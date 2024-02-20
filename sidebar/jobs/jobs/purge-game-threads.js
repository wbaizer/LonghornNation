module.exports = function(agenda) {
  agenda.define('purge game threads', function(job, done) {
    agenda.jobs({ name: 'game thread' }, (err, jobs) => {
      if (err) {
        console.error("Error fetching game thread jobs:", err);
      } else {
        jobs.forEach(job => {
          job.remove(err => {
            if (err) {
              console.error("Error removing game thread job:", err);
            } else {
              console.log(`Removed game thread job with ID ${job.attrs._id}`);
            }
          });
        });
      }
    });
    done();
  });
}