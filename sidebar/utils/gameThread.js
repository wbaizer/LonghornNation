const { reddit, getLastThread } = require('../utils/reddit');
const axios = require('axios');
const moment = require('moment');
const { tsBoxScore } = require('../utils/service');
const oneHour = 1000 * 60 * 60;
const quick = 3000;
const long = 300000;
/*

Schedule runs every at midnight
It will find upcoming games and create a game thread job
When the game thread job runs, it will post a game thread then schedule a game thread watcher
When the game thread watcher runs it will check if the game is done:
• If game is done - fire off gamethread(event, true) submits post game thread.
• If game is not done - schedule the next job to check again in 5 mins.

*/
function gameThread(event, type, sport) {
    if(type) {
        //Post Game Thread
        console.log('sending post game thread and stopping watcher');
        var markdown = '';
        if(event.link) {
            markdown = `[Box Score](${event.link})`;
        }
        reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: event.title, text: markdown}).sticky().approve();
        getLastThread('[GAME THREAD]').then(last_thread => {
            if(last_thread && last_thread.id) { 
                reddit.getSubmission(last_thread.id).unsticky();
            }
        });

    } else {
        //send game thread and start watching
        console.log('starting game thread and watcher');
        gameData(event, sport).then(game => {
            reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: game.title}).sticky().approve();
            console.log(game.title);
            setTimeout(function() {
                gameWatcher(event, sport)
            }, quick);
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
            //Schedule
            setTimeout(function() {
                gameWatcher(event, sport)
            }, quick);
        }
    });

}

function gameData(event, sport) {
    if(sport == 'baseball') {
        return tsBoxScore(event).then(gameData => {
            gameData.link = `https://texassports.com/boxscore.aspx?id=${gameData.id}&path=baseball`;
            return buildTitle(gameData, sport);
        });
    } else {
        //var url = 'http://localhost:3100/summary';
        var leagueName = 'college-football'
        if(sport == 'basketball') {
            leagueName = 'mens-college-basketball'
        }
        var url = `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${leagueName}/summary?event=${event.id}`;
        return axios.get(url).then(data => {
            var gameData = data.data.header.competitions[0];
            var odds = data.data.pickcenter.find(function( obj ) { return obj.provider.id === '25'; });
            var boxScore = data.data.header.links.find(function( obj ) { return obj.text === 'Box Score'; });
            var date = moment(gameData.date).format('MMM D');
            console.log('date from espn', gameData.date);
            if(odds) {
                gameData.picks = odds;
            }
            if(boxScore) {
                gameData.link = boxScore.href;
            } else {
                gameData.link = null;
            }
            gameData.venue = data.data.gameInfo.venue;
            gameData.time = moment(gameData.date).format('h:mm a');
            gameData.date = date;
            return buildTitle(gameData, sport);
        });
    }
}

function buildTitle(gameData, sport) {
    var game = {
        id: gameData.id,
        completed: gameData.status.type.completed,
        link: gameData.link,
        picks: gameData.picks,
        date: gameData.date,
        time: gameData.time,
        venue: gameData.venue,
        sport: sport,
        network: gameData.broadcasts && gameData.broadcasts.length > 0 ? gameData.broadcasts[0].media.shortName : null,
        homeAway: gameData.homeAway,
        teams: gameData.competitors.map(team => {
            return {
                id: team.id,
                score: team.score || null
            }
        })
    }
    var sportIcon = "🏈";
    if(sport == 'baseball') {
      sportIcon = "⚾";
    }
    if(sport == 'basketball') {
      sportIcon = "🏀";
    }
    if(gameData.status.type.completed) {
        var winner = gameData.competitors.find(function( obj ) { return obj.winner === true; });
        var loser = gameData.competitors.find(function( obj ) { return obj.winner === false; });
        game.title = `[POST GAME THREAD] ${sportIcon} `;
        if(winner.rank) {
            game.title += ' #' + winner.rank + ' ';
        }
        game.title += winner.team.nickname + ' defeats ';
        if(loser.rank) {
            game.title += '#' + loser.rank + ' ';
        }
        game.title += loser.team.nickname + ', ' + winner.score + '-' + loser.score;
    } else {
        var primary = gameData.competitors.find(function( obj ) { return obj.id === process.env.TEAM_ID; });
        var opposing = gameData.competitors.find(function( obj ) { return obj.id != process.env.TEAM_ID; });
        game.title = `[GAME THREAD] ${sportIcon} `;
        if(primary.rank) {
            game.title += '#' + primary.rank + ' ';
        }
        game.title += ' ' + primary.team.nickname;
        if(primary.record && primary.record.length > 0) {
            game.title += ' (' + primary.record[0].displayValue + ')'
        }
        game.title += primary.homeAway == 'away' ? ' @ ' : ' vs. ';
        if(opposing.rank) {
            game.title += '#' + opposing.rank + ' ';
        }
        game.title += opposing.team.nickname;
        if(opposing.record && opposing.record.length > 0) {
            game.title += ' (' + opposing.record[0].displayValue + ')';
        }
        game.title += ' - ' + gameData.time;
        game.teams = {primaryTeam: primary, opposingTeam: opposing};
    }
    return game;    
}

module.exports = {
    gameThread,
    gameWatcher,
    gameData,
    buildTitle
};