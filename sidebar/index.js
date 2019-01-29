#!/usr/bin/env node
require('dotenv').config()

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const snoowrap = require('snoowrap');
const sass = require('node-sass');
const express = require('express');
const path = require('path');
const moment = require('moment');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');

const teamLink = require('./static_data/teams.reddit.json');
const networks = require('./static_data/networks.json');

const { fetchTeamSchedule } = require('./utils/schedule');
const { generateSprites } = require('./utils/sprites');
const { message } = require('./utils/discord');
const { getWeather, getRecentPosts, getRecentTweets, getLastThread } = require('./utils/ftt');

var gfm = turndownPluginGfm.gfm
var turndownService = new TurndownService();
turndownService.use(gfm);

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("HOOK'EM", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
};

const askQuestions = () => {
  const questions = [
    {
      name: "ACTION",
      type: "rawlist",
      message: "What do you want to do?",
      choices: ['Update Sidebar', 'Update Stylesheet', 'Send Message', 'Generate Spritesheet', 'Generate FTT']
    },
    {
        name: 'USERNAME',
        message: 'Your reddit username',
        type: 'input'
    },
    {
        name: 'PASSWORD',
        message: 'Your reddit password',
        type: 'password'
    },
    {
        name: 'REASON',
        message: 'Reason for updating',
        type: 'input'
    }
  ];
  return inquirer.prompt(questions);
};

const success = message => {
  console.log(
    chalk.white.bgGreen.bold(`${message}`)
  );
};

const run = async () => {
  // show script introduction
  init();

  // ask questions
  const answers = await askQuestions();
  const { ACTION, USERNAME, PASSWORD, REASON } = answers;
  const reddit = new snoowrap({
    userAgent: '/u/chrislabeard texas-schedule@0.0.1',
    clientId: process.env.REDDIT_KEY,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.USERNAME || USERNAME,
    password: process.env.PASSWORD || PASSWORD
  });
  if(ACTION == 'Update Sidebar') {
    var app = express();
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    var date = moment(Date.now()).format('M/D/Y hh:mm A');
    fetchTeamSchedule().then(data => {
        app.render('sidebar', {data, teamLink: teamLink, networks: networks, date}, function(err, doc) {
            var markdown = turndownService.turndown(doc, {gfm: true});
            reddit.getSubreddit(process.env.SUBREDDIT).editSettings({
                description: markdown
              }).then(data => {
                success('Success, you did it peter!');  
                message(process.env.DISCORD_CHANNEL, false, `MoOooOoo I updated the sidebar on ${process.env.SUBREDDIT}!`);         
              }).catch(err => {
                  console.log(err.message);
                  message(process.env.DISCORD_CHANNEL, true, err.message);
              });
        });
    });
  }
  if(ACTION == 'Update Stylesheet') {
    sass.render({
        file: './src/css/style.scss',
        outputStyle: 'compressed'
    }, function(err, result){
        if(err) {
            console.log(err);
        }
        var style = {};
        style.css = result.css.toString().trim();
        style.reason = REASON;
        reddit.getSubreddit(process.env.SUBREDDIT).updateStylesheet(style).then(data => {
            success('Success, you did it peter!');
            message(process.env.DISCORD_CHANNEL, false, `MoOooOoo I updated the styelsheet on ${process.env.SUBREDDIT}!`);
        }).catch(err => {
            console.log(err);
            message(process.env.DISCORD_CHANNEL, true, err.message);
        });
    });
  }
  if(ACTION == 'Send Message') {
    message(process.env.DISCORD_CHANNEL, false, REASON);
  }
  if(ACTION == 'Generate Spritesheet') {
    generateSprites();
    success('Spritesheet Generated');
  }
  if(ACTION == 'Generate FTT') {
    var app = express();
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    
    var date = moment(Date.now()).format('M/D/Y');
    var date_2 = moment(Date.now()).format('M/D/Y hh:mm A');
    var day = moment(Date.now()).format("dddd['s]");
    Promise.all([
      getWeather(), 
      getRecentPosts(reddit, ['CFB', 'ALL', 'LonghornNation']),
      getRecentTweets(['sehlinger3']),
      getLastThread(reddit)
    ]).then(values => {
      var data = {
        date: {
          short: date,
          long: date_2
        },
        last_thread: values[3] || null,
        weather: values[0],
        top: values[1],
        tweets: values[2]
      }
      app.render('ftt', {data}, function(err, doc) {
        var markdown = turndownService.turndown(doc, {gfm: true});
        var post_title = "[" + date + "] " + day + " Off Topic Free Talk Thread - Testing";
        console.log(markdown);
        // Add code to post to reddit and unsticky last thread.
      });
    });
  }

};

run();