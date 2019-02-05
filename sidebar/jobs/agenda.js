const Agenda = require('agenda');

const mongoConnectionString = 'mongodb+srv://bevo:' + process.env.MONGO_ATLAS_PW + '@cluster0-ey81j.mongodb.net/agenda?retryWrites=true';


// or override the default collection name:
let agenda = new Agenda({
  db: {
    address: mongoConnectionString, 
    collection: 'jobs',
    options: {
      useNewUrlParser: true
    }
  }
});

let jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

jobTypes.forEach(function(type) {
  require('./jobs/' + type)(agenda);
});

if(jobTypes.length) {
  agenda.on('ready', function() {
    agenda.start();
  });
}

function graceful() {
    agenda.stop(function() {
      process.exit(0);
    });
}
  
process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

module.exports = agenda;