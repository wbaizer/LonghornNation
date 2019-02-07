module.exports = function(agenda) {
    var i = 0;
    agenda.define('example', function(job, done) {
        console.log(`im running ${i}`);
        i++;
        if(i > 20) {
            job.remove();
        }
        done();
    });
}