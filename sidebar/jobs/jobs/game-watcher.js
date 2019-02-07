const { gameData, gameThread } = require('../../utils/gameThread');
const moment = require('moment');

module.exports = function(agenda) {
    agenda.define('game watcher', function(job, done) {
        const {event, sport} = job.attrs.data;
        gameData(event, sport).then(game => {
            if(game.completed) {
                //Game is done make post game thread
                gameThread(game, true, sport)
                done();
            } else {
                console.log('Game is still going lets do this..');
                //Schedule
                josb.attrs.data.event = game;
                job.attrs.nextRunAt = moment().add(5, 'minutes').toDate(); 
                job.save();
                done();
            }
        });
    });
}