const express = require('express');
const path = require('path');
const moment = require('moment');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const { reddit } = require('../../utils/reddit');
const { fetchTeamSchedule } = require('../../utils/schedule');
const teamLink = require('../../static_data/teams.reddit.json');
const networks = require('../../static_data/networks.json');
const { message } = require('../../utils/discord');

var gfm = turndownPluginGfm.gfm
var turndownService = new TurndownService();
turndownService.use(gfm);

module.exports = function(agenda) {
    agenda.define('Update Sidebar', function(job, done) {
        var app = express();
        app.set('views', path.join(__dirname, '../../views'));
        app.set('view engine', 'ejs');
        app.locals.moment = moment;
        var date = moment(Date.now()).format('M/D/Y hh:mm A');
        var show = {
          football: false,
          baseball: true,
          basketball: true
        }
        fetchTeamSchedule(agenda).then(data => {
            app.render('sidebar', {data, teamLink: teamLink, networks: networks, date, show, moment: moment}, function(err, doc) {
              if(err) {
                done(err);
                return console.log(err);
              }
              var markdown = turndownService.turndown(doc, {gfm: true}); 
              reddit.getSubreddit(process.env.SUBREDDIT).editSettings({
                    description: markdown
                  }).then(data => {
                    //success('Success, you did it peter!'); 
                    console.log('updated reddit');
                    done();
                    message(process.env.DISCORD_CHANNEL, false, `MoOooOoo I updated the sidebar on ${process.env.SUBREDDIT}!`);         
                  }).catch(err => {
                      console.log(err.message);
                      done(err.message);
                      message(process.env.DISCORD_CHANNEL, true, err.message);
                  });
    
            });
        }).catch(err => {
            return done(err);
        });
    });
};