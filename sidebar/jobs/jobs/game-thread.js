const { gameThread, gameData } = require('../../utils/gameThread');
const { reddit, getLastThread } = require('../../utils/reddit');
const createMarkdown = require('../../utils/markdown');

module.exports = function(agenda) {
    agenda.define('game thread', function(job, done) {
        const {event, type, sport} = job.attrs.data;
        gameData(event, sport).then(game => {
            if(game.completed) {
                console.log('sending post game thread and stopping watcher');
                var markdown = `[Box Score](${game.link})`;
                reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title, text: markdown}).sticky().approve();
                getLastThread('[GAME THREAD]').then(last_thread => {
                    if(last_thread && last_thread.id) { 
                        reddit.getSubmission(last_thread.id).unsticky();
                    }
                });
                done();
            } else {
                console.log('Posting game thread to reddit');
                createMarkdown('partials/game_thread', game).then(markdown => {
                    reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title, text: markdown}).sticky().approve().then(data => {
                        done();
                        agenda.create('game watcher', {event: event, sport: sport}).unique({'game_id': event.id}).schedule('1 hour').repeatEvery('10 minutes').save();
                    }).catch(err => {
                        done(err);
                    });
                    
                }).catch(err => {
                    done(err);
                });

            }
        }).catch(err => {
            return done(err);
        });
    });
}