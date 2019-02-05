const express = require('express');
const path = require('path');
const moment = require('moment');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const { reddit , getLastThread } = require('../../utils/reddit');
const { getWeather, getRecentPosts, getRecentTweets } = require('../../utils/ftt');
const { message } = require('../../utils/discord');
var gfm = turndownPluginGfm.gfm
var turndownService = new TurndownService();
turndownService.use(gfm);

module.exports = function(agenda) {
    agenda.define('Free Talk Thread', function(job, done) {
        console.log('im running');
        var app = express();
        app.set('views', path.join(__dirname, '../../views'));
        app.set('view engine', 'ejs');
        
        var date = moment(Date.now()).format('M/D/Y');
        var date_2 = moment(Date.now()).format('M/D/Y hh:mm A');
        var day = moment(Date.now()).format("dddd['s]");
        async function getFTT() {
          var weather = await getWeather();
          var posts = await getRecentPosts(reddit, ['All', 'CFB', 'LonghornNation']);
          var tweets = await getRecentTweets([
            'sehlinger3', 
            'CoachTomHerman', 
            'TexasFootball', 
            'BCarringtonUT',
            'MikeRoach247',
            '_delconte'
          ]);
          var last_thread = await getLastThread('Off Topic Free Talk Thread');
          var data = {
            date: {
              short: date,
              long: date_2
            },
            last_thread: last_thread || null,
            weather: weather,
            top: posts,
            tweets: tweets
          }
          console.log(data);
          app.render('ftt', {data}, function(err, doc) {
            var markdown = turndownService.turndown(doc, {gfm: true});
            var post_title = "[" + date + "] " + day + " Off Topic Free Talk Thread";
            console.log(err);
            reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: post_title, text: markdown}).sticky().approve();
            if(last_thread && last_thread.id) { 
              reddit.getSubmission(last_thread.id).unsticky();
            }
            //message(process.env.DISCORD_CHANNEL, false, `MoOooOoo FTT posted on ${process.env.SUBREDDIT}!`);
          });
        }
        getFTT();    
    });
}