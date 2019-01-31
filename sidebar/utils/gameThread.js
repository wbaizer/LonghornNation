const { reddit } = require('../utils/reddit');
const axios = require('axios');


function gameThread(event, type) {
    if(type) {
        //Post Game Thread
        console.log('sending post game thread and stopping watcher');
        reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: event.title})
    } else {
        //send game thread and start watching
        console.log('starting game thread and watcher');
        gameData(event.id).then(game => {
            reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title});
            setTimeout(gameWatcher(event), 300000);
        });     
        
    }
}
function gameWatcher(event) {
    //make API call to ESPN resp summary
    gameData(event.id).then(game => {
        if(game.completed) {
            //Game is done make post game thread
            gameThread(game, true)
        } else {
            setTimeout(gameWatcher(event), 300000);
        }
    });

}

function gameData(eventID) {
    return axios.get('https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=' + eventID).then(data => {
        var gameData = data.data.header.competitions[0];
        var game = {
            completed: gameData.status.type.completed,
            teams: gameData.competitors.map(team => {
                return {
                    id: team.id,
                    record: team.record[0].displayValue,
                    score: team.score || null
                }
            })
        }
        if(gameData.status.type.completed) {
            var winner = gameData.competitors.find(function( obj ) { return obj.winner === true; });
            var loser = gameData.competitors.find(function( obj ) { return obj.winner === false; });
            game.title = '[POST GAME THREAD]';
            if(winner.rank) {
                game.title += ' #' + winner.rank + ' ';
            }
            game.title += winner.team.nickname + ' defeats';
            if(loser.rank) {
                game.title += ' #' + loser.rank + ' ';
            }
            game.title += loser.team.nickname + ', ' + winner.score + ' - ' + loser.score;
        } else {
            var primary = gameData.competitors.find(function( obj ) { return obj.id === process.env.TEAM_ID; });
            var opposing = gameData.competitors.find(function( obj ) { return obj.id != process.env.TEAM_ID; });
            game.title = '[GAME THREAD] ';
            game.title += primary.team.nickname + ' (' + primary.record[0].displayValue + ')';
            game.title += ' vs. ';
            game.title += opposing.team.nickname + ' (' + opposing.record[0].displayValue + ')';
        }
        return game;
    });
}

module.exports = {
    gameThread,
    gameWatcher
};