const { gameThread, gameData } = require('../../utils/gameThread');
const { reddit, getLastThread } = require('../../utils/reddit');
module.exports = function(agenda) {
    agenda.define('game thread', function(job, done) {
        const {event, type, sport} = job.attrs.data;
        gameData(event, sport).then(game => {
            if(game.completed) {
                console.log('sending post game thread and stopping watcher');
                var markdown = `[Box Score](${game.link})`;
                reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title, text: markdown}).sticky();
                getLastThread('[GAME THREAD]').then(last_thread => {
                    if(last_thread && last_thread.id) { 
                        reddit.getSubmission(last_thread.id).unsticky();
                    }
                });
                done();
            } else {
                reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title}).sticky();
                console.log(game.title);
                agenda.create('game watcher', {
                    event: event,
                    sport: sport
                }).unique({'game_id': event.id}).schedule('5 minutes').save();
                done();                
            }
        });
    });
}