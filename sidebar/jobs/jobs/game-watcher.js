const { gameStatus, gameThread, gameData } = require('../../utils/gameThread');
const { reddit, getLastThread } = require('../../utils/reddit');
const createMarkdown = require('../../utils/markdown');
module.exports = function(agenda) {
    agenda.define('game watcher', function(job, done) {
        const {event, sport} = job.attrs.data;
        gameStatus(event, sport).then(gameStatus => {
            const { event: updatedEvent } = gameStatus
            if(updatedEvent.completed) {
                //Game is done make post game thread
                job.remove();
                
                gameThread(updatedEvent, true, sport)
                done();
            } else {
                console.log('Game is still going lets do this..');
                //Schedule
                //Update game thread with the latest event details
                job.attrs.data.event = updatedEvent
                if (updatedEvent.games.length > 1 && gameStatus.game && gameStatus.game.complete) {
                    gameData(updatedEvent, sport).then(game => {
                        getLastThread('[SERIES THREAD]').then(last_thread => {
                            if (last_thread && last_thread.id) {
                                createMarkdown('partials/game_thread', game).then(markdown => {
                                    reddit.getSubmission(last_thread.id).edit(markdown)
                                })
                            }
                        })
                    })

                }
                job.save()
                done();
            }
        });
    });
}