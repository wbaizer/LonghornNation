const { gameData, gameThread } = require('../../utils/gameThread');

module.exports = function(agenda) {
    agenda.define('game watcher', function(job, done) {
        const {event, sport} = job.attrs.data;
        gameData(event, sport).then(game => {
            if(game.completed) {
                //Game is done make post game thread
                done();
                gameThread(game, true)
            } else {
                console.log('Game is still going lets do this..');
                //Schedule
                done();
                agenda.create('game watcher', {
                    event: game,
                    sport: sport
                }).unique({'game_id': event.id}).schedule('5 minutes').save();
            }
        });
    });
}