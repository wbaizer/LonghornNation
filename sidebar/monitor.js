require('dotenv').config();
const Agenda = require('agenda');
const mongoConnectionString = process.env.MONGO_URL;

const agenda = new Agenda({
  db: {
    address: mongoConnectionString,
    collection: 'jobs'
  }
});

async function clearStuckJobs() {
  try {
    await agenda.start();
    console.log('Checking for stuck jobs...');
    
    // Find jobs that are:
    // 1. Locked (meaning they started running)
    // 2. Haven't finished (no lastFinishedAt timestamp)
    // 3. Started running more than 30 minutes ago
    const stuckJobs = await agenda.jobs({
      lockedAt: { $exists: true },
      lastFinishedAt: { $exists: false },
      lastRunAt: { 
        $lt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    });

    if (stuckJobs.length === 0) {
      console.log('No stuck jobs found.');
    } else {
      console.log(`Found ${stuckJobs.length} stuck jobs`);
      
      for (const job of stuckJobs) {
        console.log(`Cleaning up stuck job: ${job.attrs.name} (ID: ${job.attrs._id})`);
        console.log(`Last run at: ${job.attrs.lastRunAt}`);
        console.log(`Type: ${job.attrs.name}`);
        
        // Remove the lock and reset the job
        await agenda.jobs({ _id: job.attrs._id }, {
          $unset: {
            lockedAt: undefined,
            lastRunAt: undefined
          }
        });
        
        // Optionally, reschedule the job if needed
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

    console.log('Stuck job cleanup completed');
    await agenda.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during stuck job cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearStuckJobs(); 