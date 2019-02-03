const { reddit } = require('../utils/reddit');
const axios = require('axios');
const { tsBoxScore } = require('../utils/service');

function gameThread(event, type, sport) {
    if(type) {
        //Post Game Thread
        console.log('sending post game thread and stopping watcher');
        reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: event.title})
    } else {
        //send game thread and start watching
        console.log('starting game thread and watcher');
        gameData(event, sport).then(game => {
            reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title});
            console.log(game.title);
            setTimeout(function() {
                gameWatcher(event, sport)
            }, 5000);
        });     
        
    }
}
function gameWatcher(event, sport) {
    //make API call to ESPN resp summary
    gameData(event, sport).then(game => {
        if(game.completed) {
            //Game is done make post game thread
            gameThread(game, true)
        } else {
            console.log('Game is still going lets do this..');
            setTimeout(function() {
                gameWatcher(event, sport)
            }, 5000);
        }
    });

}

function gameData(event, sport) {
    if(sport == 'baseball') {
        return tsBoxScore(event).then(gameData => {
            return buildTitle(gameData);
        });
    } else {
        //var url = 'http://localhost:3100/summary';
        var url = 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=' + event.id;
        return axios.get(url).then(data => {
            var gameData = data.data.header.competitions[0];
            return buildTitle(gameData);
        });
    }
}

function buildTitle(gameData) {
    var game = {
        completed: gameData.status.type.completed,
        teams: gameData.competitors.map(team => {
            return {
                id: team.id,
                score: team.score || null
            }
        })
    }
    if(gameData.status.type.completed) {
        var winner = gameData.competitors.find(function( obj ) { return obj.winner === true; });
        var loser = gameData.competitors.find(function( obj ) { return obj.winner === false; });
        game.title = '[POST GAME THREAD] ';
        if(winner.rank) {
            game.title += '#' + winner.rank + ' ';
        }
        game.title += winner.team.nickname + ' defeats ';
        if(loser.rank) {
            game.title += '#' + loser.rank + ' ';
        }
        game.title += loser.team.nickname + ', ' + winner.score + '-' + loser.score;
    } else {
        var primary = gameData.competitors.find(function( obj ) { return obj.id === process.env.TEAM_ID; });
        var opposing = gameData.competitors.find(function( obj ) { return obj.id != process.env.TEAM_ID; });
        game.title = '[GAME THREAD] ';
        game.title += primary.team.nickname;
        if(primary.record && primary.record.length > 0) {
            game.title += ' (' + primary.record[0].displayValue + ')'
        }
        game.title += primary.homeAway == 'away' ? ' @ ' : ' vs. ';
        game.title += opposing.team.nickname;
        if(opposing.record && opposing.record.length > 0) {
            game.title += ' (' + opposing.record[0].displayValue + ')';
        }
        game.title += ' - ' + gameData.time;
    }
    return game;    
}

module.exports = {
    gameThread,
    gameWatcher
};