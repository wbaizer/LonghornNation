require('dotenv').config()

const cron = require("node-cron");
const moment = require('moment');
const snoowrap = require('snoowrap');
const express = require('express');
const path = require('path');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');

const { fetchTeamSchedule } = require('./utils/schedule');
const { message } = require('./utils/discord');

const teamLink = require('./static_data/teams.reddit.json');
const networks = require('./static_data/networks.json');

console.log('Starting Up App');
cron.schedule("0 0 * * *", function() {
    var app = express();
    var date = moment(Date.now()).format('M/D/Y hh:mm A');
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    var show = {
        football: false,
        baseball: true,
        basketball: true
      }
    const reddit = new snoowrap({
        userAgent: '/u/chrislabeard texas-schedule@0.0.1',
        clientId: process.env.REDDIT_KEY,
        clientSecret: process.env.REDDIT_SECRET,
        username: process.env.USERNAME,
        password: process.env.PASSWORD
      });
    fetchTeamSchedule().then(data => {
        app.render('sidebar', {data, teamLink: teamLink, networks: networks, date, show}, function(err, doc) {
            var gfm = turndownPluginGfm.gfm
            var turndownService = new TurndownService();
            turndownService.use(gfm);
            var markdown = turndownService.turndown(doc, {gfm: true});
            reddit.getSubreddit(process.env.SUBREDDIT).editSettings({
                description: markdown
              }).then(data => {
                console.log('updated sidebar');
                message(process.env.DISCORD_CHANNEL, false, `MoOooOoo I updated the sidebar on ${process.env.SUBREDDIT}!`);      
              }).catch(err => {
                  console.log(err);
                  message(process.env.DISCORD_CHANNEL, true, err.message);
              });
        });
    });
});