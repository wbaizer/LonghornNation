const Agenda = require('agenda');
const mongoConnectionString = process.env.MONGO_URL;
const jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

const agenda = new Agenda({
  db: {
    address: mongoConnectionString,
    collection: 'jobs',
    options: {
      useNewUrlParser: true
    }
  },
  processEvery: '10 seconds' // Adjust this according to your needs
});

// Load job types dynamically
jobTypes.forEach(function(type) {
  require('./jobs/' + type)(agenda);
});

// Event listener for when Agenda is ready
agenda.on('ready', function() {
  console.log('Agenda is ready');
  // Start Agenda only if there are job types defined
  if (jobTypes.length) {
    agenda.start();
    console.log('Agenda has started');
  } else {
    console.log('No job types defined. Agenda will not start.');
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
