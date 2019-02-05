const { gameThread, gameData } = require('../../utils/gameThread');
const { reddit, getLastThread } = require('../../utils/reddit');
module.exports = function(agenda) {
    agenda.define('game thread', function(job, done) {
        const {event, type, sport} = job.attrs.data;
        if(type) {
            //Post Game Thread
            console.log('sending post game thread and stopping watcher');
            reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: event.title}).sticky();
            getLastThread('[GAME THREAD]').then(last_thread => {
                if(last_thread && last_thread.id) { 
                    reddit.getSubmission(last_thread.id).unsticky();
                }
            });
    
        } else {
            //send game thread and start watching
            console.log('starting game thread and watcher');
            gameData(event, sport).then(game => {
                reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title}).sticky();
                console.log(game.title);
                agenda.create('game watcher', {
                    event: event,
                    sport: sport
                }).unique({'game_id': event.id}).schedule('30 seconds').save();
                done();
            });     
            
        }
    });
}