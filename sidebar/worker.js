require("dotenv").config();

const moment = require("moment");
const { fetchTeamSchedule } = require("./utils/schedule");
const { buildTitle } = require("./utils/gameThread");
const teamLink = require("./static_data/teams.reddit.json");
const networks = require("./static_data/networks.json");
const Agenda = require('agenda');
const mongoConnectionString = process.env.MONGO_URL;

console.log("Starting Up App");

const agenda = new Agenda({
  db: {
    address: mongoConnectionString,
    collection: 'jobs',
    options: {
      useNewUrlParser: true
    }
  },
  processEvery: '1 minute',
  defaultConcurrency: 1,
  maxConcurrency: 1,
  lockLimit: 1,
  defaultLockLifetime: 30000
});

// Explicitly load only the required jobs
require('./jobs/jobs/update-sidebar')(agenda);
require('./jobs/jobs/ftt')(agenda);
require('./jobs/jobs/sports-talk-thread')(agenda);

// Define the cleanup job
agenda.define('cleanup-stuck-jobs', async function(job, done) {
  try {
    console.log('Checking for stuck jobs...');
    
    const stuckJobs = await agenda.jobs({
      lockedAt: { $exists: true },
      lastFinishedAt: { $exists: false },
      lastRunAt: { 
        $lt: new Date(Date.now() - 30 * 60 * 1000)
      }
    });

    if (stuckJobs.length === 0) {
      console.log('No stuck jobs found.');
    } else {
      console.log(`Found ${stuckJobs.length} stuck jobs`);
      
      for (const job of stuckJobs) {
        console.log(`Cleaning up stuck job: ${job.attrs.name} (ID: ${job.attrs._id})`);
        console.log(`Last run at: ${job.attrs.lastRunAt}`);
        
        // Remove the lock and reset the job
        await agenda.jobs({ _id: job.attrs._id }, {
          $unset: {
            lockedAt: undefined,
            lastRunAt: undefined
          }
        });
        
        // Reschedule recurring jobs, remove one-time jobs
        if (job.attrs.type !== 'single') {
          await job.enable();
          await job.save();
          console.log(`Job ${job.attrs._id} has been reset and enabled`);
        } else {
          await job.remove();
          console.log(`One-time job ${job.attrs._id} has been removed`);
        }
      }
    }
    done();
  } catch (error) {
    console.error('Error during stuck job cleanup:', error);
    done(error);
  }
});

let isRunning = false;

agenda.on('ready', async function() {
  console.log('Agenda is ready');
  if (!isRunning) {
    try {
      isRunning = true;
      await agenda.start();
      console.log('Agenda has started');

      // Schedule recurring jobs with different times to avoid concurrent Reddit requests
      await agenda
        .create("Update Sidebar")
        .unique({ subreddit: process.env.SUBREDDIT })
        .repeatEvery("0 0 * * *", { 
          skipImmediate: false,
          timezone: 'America/Chicago'
        })
        .save();

      await agenda
        .create("Free Talk Thread")
        .unique({ "ftt-sub": process.env.SUBREDDIT })
        .repeatEvery("30 0 * * *", {
          skipImmediate: true,
          timezone: 'America/Chicago'
        })
        .save();

      await agenda
        .create("Sports Talk Thread")
        .unique({ "stt-sub": process.env.SUBREDDIT })
        .repeatEvery("0 2 * * *", {
          skipImmediate: true,
          timezone: 'America/Chicago'
        })
        .save();

      // Add the cleanup job to run every 30 minutes
      await agenda
        .create("cleanup-stuck-jobs")
        .unique({ "cleanup": true })
        .repeatEvery("*/30 * * * *", {
          skipImmediate: false,
          timezone: 'America/Chicago'
        })
        .save();

      console.log('Recurring events created successfully.');
    } catch (error) {
      console.error('Error initializing jobs:', error);
      process.exit(1);
    }
  }
});

// Add error handling for failed jobs with rate limit awareness
agenda.on('fail', function(err, job) {
  console.error('Job failed:', job.attrs.name, err);
  
  // Check if the error is related to rate limiting
  if (err.message && err.message.includes('RATELIMIT')) {
    console.log('Rate limit hit, rescheduling job in 5 minutes');
    job.schedule('5 minutes from now');
    job.save();
    return;
  }
  
  if (job.attrs.failCount > 3) {
    job.disable();
    job.save();
    console.error('Job disabled after multiple failures:', job.attrs.name);
  }
});

// Graceful shutdown handling
function graceful() {
  console.log('Stopping Agenda...');
  agenda.stop(function() {
    console.log('Agenda has stopped');
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);

module.exports = agenda;
