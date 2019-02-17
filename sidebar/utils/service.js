const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const util = require('util');
const ts_teams = require('../static_data/texas_sports_teams.json');
const ts_networks = require('../static_data/texas_sports_networks.json');
const teams = require('../static_data/teams.json');
const statesList = require('../static_data/states.json');
let Parser = require('rss-parser');

async function texasSports(agenda) {
    //var base = 'https://texassports.com/schedule.aspx?path='+ sport;
    let baseball = {
        schedule: {
            regular: [],
            post: []
        },
        rankings: {}
    };
    var schedule = 'https://texassports.com/schedule.aspx?path=baseball';
    var standings = 'http://www.big12sports.com/standings/Standings.dbml?DB_OEM_ID=10410&SPID=13131';
    return axios.all([
        axios.get(schedule),
        axios.get(standings),
    ])
    .then(axios.spread(function(
        baseball_schedule,
        baseball_standings,
        ) {
            // This is a hotfix and terrible fix later.
            return {
                schedule: processSchedule(baseball_schedule, agenda),
                rankings: processStandings(baseball_standings)
            }
        })
    ).catch(err => {
        return err;
    });
}
async function processXML(agenda) {
    let parser = new Parser({
        customFields: {
            item:[
                ['s:localstartdate', 'date'],
                ['s:opponent', 'opponent'],
                ['s:gameid', 'id'],
                ['ev:location', 'location']
            ]
        }
    });
    let feed = await parser.parseURL('http://www.texassports.com/calendar.ashx/calendar.rss?sport_id=1');
    var events = feed.items.map(item => {
        var content = item.content;
        var split = content.split("\\n");
        var scoreData = '';
        var primaryTeamScore = null;
        var opposingTeamScore = null;
        var scores = [];
        var homeAway = '';
        var network = '';
        var location = item.location.split(',');
        var networkData = split.find(function(element) {
            return element.includes("TV");
        });
        var scoreResult = split.find(function(element) {
            return element.match(/^(W|L)/g);
        });
        if(scoreResult) {
            scoreData = scoreResult.split(" ");
            var scoresTemp = scoreData[1].split("-");
            if(scoreData[0] == 'W') {
                primaryTeamScore = scoresTemp[0];
                opposingTeamScore = scoresTemp[1];
            } else {
                primaryTeamScore = scoresTemp[1];
                opposingTeamScore = scoresTemp[0];
            }
        }
        if(networkData) {
            var values = networkData.split(":");
            network = values[1].trim().toUpperCase();
        }
        if(item.title.match(/(at)/g)) {
            homeAway = '@';
        }
        var teamID = ts_teams[item.opponent.toUpperCase()];
        var team = teams[teamID];
        return {
            id: item.id,
            date: moment(item.isoDate).format('MMM D'),
            dateISO: item.isoDate,
            time: moment(item.isoDate).format('h:mm a'),
            homeAway: homeAway,
            primaryTeam: {
                id: process.env.TEAM_ID,
                winner: scoreData[0] == 'W' ? true : false,
                team: {
                    nickname: teams[process.env.TEAM_ID].nickname
                },
                score: {
                    displayValue: primaryTeamScore
                }
            },
            opposingTeam: {
                id: teamID,
                team: {
                    nickname: team.nickname
                },
                score: {
                    displayValue: opposingTeamScore
                },
                reddit: team.reddit
            },
            completed: scoreResult ? true : false,
            network: ts_networks[network] || null,
            venue: {
                address: {
                    city: location[0] || '',
                    state: location[1] || ''
                }
            }
            
        }
    })
    return events;
}
function processStandings(response) {
    let rankings = {
        primaryTeam: {},
        teams: []
    }
    const html = response.data;
    const $ = cheerio.load(html);
    var list = []
    var rows = $('.standings-table tbody tr');
    $(rows).each(function(i, elem) {
        //Skip the first 3 rows because fuck em.
        if(i > 2) {
            //Get the team data from ESPN Static
            var teamKey = $(this).find('td.team a').text().trim().toUpperCase();
            var teamID = ts_teams[teamKey];
            var team = teams[teamID];
            //Get standings info
            var overall = $(this).find('td.overall.record').text().trim();
            var conference = $(this).find('td.conference.record').text().trim();
            if(teamID == process.env.TEAM_ID) {
                primaryTeamRanking = {
                    overall: overall,
                    conference: conference
                }
                rankings.primaryTeam = primaryTeamRanking;
            }
            var teamTemp = {
                name: team.nickname,
                id: teamID,
                rank: '',
                abbreviation: team.abbreviation,
                overall: overall,
                conference: conference
            }
            rankings.teams.push(teamTemp);

        }
    });
    return rankings;
}
function processSchedule(response, agenda) {
    let schedule = {
        regular: [],
        post: []
    }
    const html = response.data;
    const $ = cheerio.load(html);
    $('.sidearm-schedule-tournament').each(function(i, elem) {
        var title = $(this).find('p').text().trim();
        schedule.post[title] = [];
    });
    if($('.sidearm-schedule-record').length > 0) {
        var list = $('.sidearm-schedule-record').find('ul');
        var overall = $(list).find('li:first-child span:nth-child(2)').text();
        var conf = $(list).find('li:nth-child(3) span:nth-child(2)').text();
    }
    $('.sidearm-schedule-game').each(function(i, elem) {
        var venue2 = $(this).find('.sidearm-schedule-game-details .sidearm-schedule-game-location span:first-child').text().trim().replace(/\s/g,'').split(',');
        var state = statesList[venue2[1]];
        var rank = null;
        var away = $(this).find('.sidearm-schedule-game-away').text().trim().replace(/\s/g,'');
        if($(this).find('.sidearm-schedule-game-opponent-name span').text().length > 0) {
            rank = $(this).find('.sidearm-schedule-game-opponent-name span').text().trim();
        }
        var result = $(this).find('.sidearm-schedule-game-result').text().trim().replace(/\s/g,'').split('-').join(',').split(',');
        var teamName = $(this).find('.sidearm-schedule-game-opponent-name').text().trim().replace('(DH)','').replace(/#*[0-9]/g, '').trim().toUpperCase();
        var network = $(this).find('.sidearm-schedule-game-coverage-tv-content').text().trim().toUpperCase();
        var date = $(this).find('.sidearm-schedule-game-opponent-date span:first-child').text().replace(/\(.*?\)/g, '').trim();
        var time = $(this).find('.sidearm-schedule-game-opponent-date span:nth-child(2)').text().replace(/[.]/g, '').trim().toUpperCase();
        var year = moment().format('Y');
        var gameID = $(this).attr('data-game-id');
        const [hour, min, period] = time.match(/\d+|\w+/g);
        var timeConst = hour;
        if(period == null) {
            timeConst += ':00:00 ' + min;
        } else {
            timeConst += ':' + min + ':00 ' + period;
        }
        var gameDate = date + ' ' + year + ' ' + timeConst;
        //kill me now
        var teamID = ts_teams[teamName];
        var team = teams[teamID];
        if(result.length > 0) {

        }
        var game = {
            id: gameID,
            opposingTeam: {
                id: teamID,
                team: {
                    nickname: teamName === 'ALUMNI GAME' ? 'ALUMNI GAME' : team.nickname
                },
                curatedRank: {
                    current: rank
                },
                score: {
                    displayValue: result[2] || null
                },
                reddit: teamName === 'ALUMNI GAME' ? '/r/LonghornNation' : team.reddit
            },
            primaryTeam: {
                id: process.env.TEAM_ID,
                winner: result[0] == 'W' ? true : false,
                team: {
                    nickname: teams[process.env.TEAM_ID].nickname
                },
                score: {
                    displayValue: result[1] || null
                }
            },
            date: moment(gameDate, 'MMM D YYYY h:mm:ss A').format('MMM D'),
            dateISO: gameDate,
            time: moment(gameDate, 'MMM D YYYY h:mm:ss A').format('h:mm a'),
            network: ts_networks[network] ? ts_networks[network] : network,
            homeAway: away == 'at' ? '@' : '',
            complete: result.length > 1 ? true : false,
            venue: {
                address: {
                    city: venue2[0] || '',
                    state: state || ''
                }
            }
        }
        if(process.env.GAME_THREAD == 'true') {
            /*if(moment(gameDate, 'MMM D YYYY h:mm:ss A').isAfter(Date.now())) {
                var scheduleDate = moment(gameDate, 'MMM D YYYY h:mm:ss A').subtract(1, 'hours').toDate();
                console.log('baseball - schedule game thread', moment(scheduleDate).fromNow());
                agenda.create('game thread', {event: game, sport: 'baseball'}).unique({'game_id': game.id}).schedule(scheduleDate).save();
            }*/
        }
        if($(this).parent('.sidearm-schedule-games-container').length) {
            schedule.regular.push(game);
        } else {
            var title = $(this).parents('.sidearm-schedule-tournament').find('p').text().trim();
            schedule.post[title].push(game);
        }
    });
    return schedule;
}

function tsBoxScore(event) {
    return axios.get(`https://texassports.com/boxscore.aspx?id=${event.id}&path=baseball`).then(response => {
        if(response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);
    
            var box = $('.box-score');
            var title = $(box).find('h1').text().toUpperCase().trim();
            var scores = $(box).find('.info-graphic');
            var winnerObj = $(scores).find('th.winner').parent('tr');
            var loserObj = $(scores).find('th:not(".winner")').parent('tr');
            var winnerScore = $(winnerObj).find('td:nth-last-child(3)').text();
            var loserScore = $(loserObj).find('td:nth-last-child(3)').text();
            var winnerName = $(winnerObj).find('th span:nth-child(2)').text().toUpperCase().trim();
            var loserName = $(loserObj).find('th span:nth-child(2)').text().toUpperCase().trim();
            var winnerRegex = new RegExp('([1-9]\\S+)(?=\\s+' + winnerName + ')', 'g');
            var loserRegex = new RegExp('([1-9]\\S+)(?=\\s+' + loserName + ')', 'g');
            var winnerRank = title.match(winnerRegex);
            var loserRank = title.match(loserRegex);
            var loser = {
                id: ts_teams[loserName],
                score: loserScore,
                team: teams[ts_teams[loserName]],
                rank: loserRank != null ? loserRank[0] : null,
                winner: false
            }
            var winner = {
                id:ts_teams[winnerName],
                score: winnerScore,
                team: teams[ts_teams[winnerName]],
                rank: winnerRank != null ? winnerRank[0] : null,
                winner: true
            }
            var game = {
                status : {
                    type: {
                        completed: true
                    }
                },
                competitors: [winner, loser]
            }
            return game;
        } else {
            console.log('no game data');
        }

        
    }, (error) => {
        console.log('no game passing normal data');
        var game = {
            id:event.id,
            status: {
                type: {
                    completed: false
                }
            },
            time: event.time,
            date: event.date,
            network: event.network,
            homeAway: event.homeAway == '@' ? '' : 'away',
            competitors: [event.primaryTeam, event.opposingTeam],
            venue: event.venue,
            record: []
        }
        return new Promise(function(resolve, reject) {
            resolve(game);
        });
    });
}

async function tsCalendar() {
    let parser = new Parser({
        customFields: {
            item:[
                ['s:localstartdate', 'date']
            ]
        }
    });
    let feed = await parser.parseURL('http://www.texassports.com/calendar.ashx/calendar.rss?sport_id=&han=');
    let today = moment();
    var events = await feed.items.filter(function(item) {
        var date = moment(item.isoDate);
        return today.isSame(date, 'day');
    });
    return events.limit(5);
}
function limit(c){
    return this.filter((x,i)=>{
        if(i<=(c-1)){return true}
    })
}
Array.prototype.limit=limit;

module.exports = {
    texasSports,
    tsBoxScore,
    tsCalendar,
    processXML
};