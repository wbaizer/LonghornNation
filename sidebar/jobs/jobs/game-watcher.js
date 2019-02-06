const { gameData, gameThread } = require('../../utils/gameThread');

module.exports = function(agenda) {
    agenda.define('game watcher', function(job, done) {
        const {event, sport} = job.attrs.data;
        gameData(event, sport).then(game => {
            if(game.completed) {
                //Game is done make post game thread
                gameThread(game, true, sport);
                done();
            } else {
                console.log('Game is still going lets do this..');
                //Schedule  
                
                job.schedule('5 minutes', {
                    event: game,
                    sport: sport                  
                });
                job.save();
                done();
            }
        }).catch(err => {
            return done(err);
        });
    });
}