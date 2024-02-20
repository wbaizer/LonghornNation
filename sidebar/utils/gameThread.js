const { reddit, getLastThread } = require('../utils/reddit');
const axios = require('axios');
const moment = require('moment');
const { tsBoxScore } = require('../utils/service');
const teamLink = require('../static_data/teams.reddit.json');
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

async function gameStatus(event, sport) {
    // Create a shallow copy of the event object
    const updatedEvent = { ...event };
    let leagueName = 'college-football'
    let teamId = process.env.TEAM_ID
    if (sport === 'basketball') {
        leagueName = 'mens-college-basketball';
    } else if (sport === 'baseball') {
        leagueName = 'college-baseball';
        teamId = '126';
    }

    const currentTime = moment().tz("America/Chicago");
    const currentGame = event.games.find(game => {
        const gameTime = moment(game.date).tz("America/Chicago");
        const endTime = moment(gameTime).endOf('day'); // End of the game day
        return currentTime.isSameOrAfter(gameTime) && currentTime.isSameOrBefore(endTime);
    });

    if (currentGame) {
        console.log("The ID of the current game is:", currentGame.id);
        const url = `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${leagueName}/summary?event=${currentGame.id}`;
        
        try {
            const response = await axios.get(url);
            const gameData = response.data.header.competitions[0];
            const primaryTeam = gameData.competitors.find(team => team.id === teamId);
            const opposingTeam = gameData.competitors.find(team => team.id !== teamId);
            const isComplete = gameData.status.type.completed;
            const gameIndex = updatedEvent.games.findIndex(game => game.id === currentGame.id)

            const primaryTeamScoreIndex = updatedEvent.games[gameIndex].score.findIndex(score => score.team === primaryTeam.team.nickname);
            const opposingTeamScoreIndex = updatedEvent.games[gameIndex].score.findIndex(score => score.team === opposingTeam.team.nickname);

            updatedEvent.games[gameIndex].score[primaryTeamScoreIndex].value = primaryTeam.score;
            updatedEvent.games[gameIndex].score[opposingTeamScoreIndex].value = opposingTeam.score;
            updatedEvent.games[gameIndex].complete = isComplete;
            updatedEvent.games[gameIndex].winner = primaryTeam.winner

            return { event: updatedEvent, game: updatedEvent.games[gameIndex] };
        } catch (error) {
            console.error("Error fetching game data:", error);
            return { event: updatedEvent, game: null }; // Return the event without modifications in case of an error
        }
    } else {
        console.log("There is no game happening right now.");
        return { event, game: null };
    }
}


function gameData(event, sport) {
    //var url = 'http://localhost:3100/summary';
    var leagueName = 'college-football'
    if(sport == 'basketball') {
        leagueName = 'mens-college-basketball';
    }
    if(sport == 'baseball') {
        leagueName = 'college-baseball';
    }
    const id = event.games[0].id
    var url = `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${leagueName}/summary?event=${id}`;
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
        gameData.tournament = event.tournament;
        gameData.games = event.games;
        gameData.completed = event.games.every(game => {
            return game.complete === true
        })
        return buildTitle(gameData, sport);
    });
}

function buildTitle(gameData, sport) {
    const sportIcons = {
        'baseball': '⚾',
        'basketball': '🏀',
        'football': '🏈'
    };

    const game = {
        id: gameData.id,
        completed: gameData.completed,
        link: gameData.link,
        picks: gameData.picks,
        date: gameData.date,
        time: gameData.time,
        venue: gameData.venue,
        sport: sport,
        tournament: gameData.tournament,
        network: gameData.broadcasts && gameData.broadcasts.length > 0 ? gameData.broadcasts[0].media.shortName : null,
        homeAway: gameData.homeAway,
        teams: gameData.competitors.map(team => ({
            id: team.id,
            score: team.score || null
        })),
        games: gameData.games
    };

    const sportIcon = sportIcons[sport] || '🏈';

    if (gameData.completed) {
        const winner = gameData.competitors.find(function (obj) { return obj.winner === true; });
        const loser = gameData.competitors.find(function (obj) { return obj.winner === false; });

        const winCount = game.games.filter(function (game) { return game.winner === true; }).length;
        const loseCount = game.games.filter(function (game) { return game.winner === false; }).length;

        let winnerScore = winner.score;
        let loserScore = loser.score;
        let threadType = game.games.length > 1 ? 'SERIES' : 'GAME';

        if (game.games.length > 1) {
            winnerScore = winCount;
            loserScore = loseCount;
        }

        game.title = `[POST ${threadType} THREAD] ${sportIcon} `;

        if (winner.rank) {
            game.title += `#${winner.rank} `;
        }

        game.title += `${winner.team.nickname || winner.team.location} defeats `;

        if (loser.rank) {
            game.title += `#${loser.rank} `;
        }

        game.title += `${loser.team.nickname || loser.team.location}, ${winnerScore}-${loserScore}`;
    } else {
        const checkID = sport === 'baseball' ? '126' : process.env.TEAM_ID;
        const primary = gameData.competitors.find(function (obj) { return obj.id === checkID; });
        const opposing = gameData.competitors.find(function (obj) { return obj.id !== checkID; });

        let threadType = game.games.length > 1 ? 'SERIES' : 'GAME';

        if (game.tournament) {
            threadType = 'TOURNAMENT';
        }

        game.title = `[${threadType} THREAD] ${sportIcon} `;

        if (game.tournament) {
            game.title += `${game.tournament}`
        } else {
            if (primary.rank) {
                game.title += `#${primary.rank} `;
            }
    
            game.title += `${primary.team.nickname || primary.team.location}`;
    
            if (primary.record && primary.record.length > 0) {
                game.title += ` (${primary.record[0].displayValue})`;
            }
    
            game.title += `${primary.homeAway === 'away' ? ' @ ' : ' vs. '}`;
    
            if (opposing.rank) {
                game.title += `#${opposing.rank} `;
            }
    
            game.title += `${opposing.team.nickname || opposing.team.location}`;
    
            if (opposing.record && opposing.record.length > 0) {
                game.title += ` (${opposing.record[0].displayValue})`;
            }
    
            if (game.games.length === 1) {
                game.title += ` - ${gameData.time}`;
            }
        }

        game.teams = { primaryTeam: primary, opposingTeam: opposing };
    }

    return game;
}



module.exports = {
    gameThread,
    gameWatcher,
    gameData,
    gameStatus,
    buildTitle
};