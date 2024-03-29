#!/usr/bin/env node

require("dotenv").config();

const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const { reddit, getLastThread } = require("./utils/reddit");
const sass = require("node-sass");
const express = require("express");
const path = require("path");
const moment = require("moment");
const TurndownService = require("turndown");
const turndownPluginGfm = require("turndown-plugin-gfm");
const teamLink = require("./static_data/teams.reddit.json");
const networks = require("./static_data/networks.json");
const baseball_static = require('./exampleData/baseball.json')
const football_static = require('./exampleData/ncaaf_regular_schedule.json')
let agenda = require("./jobs/agenda");

const { fetchTeamSchedule } = require("./utils/schedule");
const { generateSprites } = require("./utils/sprites");
const { message } = require("./utils/discord");
const { getWeather, getRecentPosts, getRecentTweets } = require("./utils/ftt");
const { texasSports, tsCalendar } = require("./utils/service");

var gfm = turndownPluginGfm.gfm;
var turndownService = new TurndownService();
turndownService.use(gfm);

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("HOOK'EM", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default",
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
      choices: [
        "Update Sidebar",
        "Update Stylesheet",
        "Send Message",
        "Generate Spritesheet",
        "Generate FTT",
        "Scrape Texas",
        "Schedule Job",
        "Generate STT",
      ],
    },
    {
      name: "USERNAME",
      message: "Your reddit username",
      type: "input",
    },
    {
      name: "PASSWORD",
      message: "Your reddit password",
      type: "password",
    },
    {
      name: "REASON",
      message: "Reason for updating",
      type: "input",
    },
  ];
  return inquirer.prompt(questions);
};

const success = (message) => {
  console.log(chalk.white.bgGreen.bold(`${message}`));
};

const run = async () => {
  // show script introduction
  init();

  // ask questions
  const answers = await askQuestions();
  const { ACTION, USERNAME, PASSWORD, REASON } = answers;
  if (ACTION == "Update Sidebar") {
    var app = express();
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");

    var date = moment(Date.now()).format("M/D/Y hh:mm A");
    var show = {
      football: true,
      baseball: false,
      basketball: false,
    };
    var show = {
      football: process.env.FOOTBALL,
      baseball: process.env.BASEBALL,
      basketball: process.env.BASKETBALL,
    };
    fetchTeamSchedule(agenda)
      .then((data) => {
        app.render(
          "sidebar",
          {
            data,
            teamLink: teamLink,
            networks: networks,
            date,
            show,
            moment: moment,
          },
          function (err, doc) {
            if (err) {
              return console.log(err);
            }
            var markdown = turndownService.turndown(doc, { gfm: true });
            reddit
              .getSubreddit(process.env.SUBREDDIT)
              .editSettings({
                description: markdown,
              })
              .then((data) => {
                //success('Success, you did it peter!');
                console.log("updated reddit");
                //message(process.env.DISCORD_CHANNEL, false, `MoOooOoo I updated the sidebar on ${process.env.SUBREDDIT}!`);
              })
              .catch((err) => {
                console.log(err.message);
                //message(process.env.DISCORD_CHANNEL, true, err.message);
              });
          }
        );
      })
      .catch((err) => {
        return console.log(err);
      });
  }
  if (ACTION == "Update Stylesheet") {
    sass.render(
      {
        file: "./src/css/style.scss",
        outputStyle: "compressed",
      },
      function (err, result) {
        if (err) {
          console.log(err);
        }
        var style = {};
        style.css = result.css.toString().trim();
        style.reason = REASON;
        reddit
          .getSubreddit(process.env.SUBREDDIT)
          .uploadStylesheetImage({
            name: "sprite",
            file: "./src/images/sprite.png",
          })
          .then((data) => {
            message(
              process.env.DISCORD_CHANNEL,
              false,
              `MoOooOoo I updated the spritesheet on ${process.env.SUBREDDIT}!`
            );
          })
          .catch((err) => {
            message(process.env.DISCORD_CHANNEL, true, err.message);
          });
        reddit
          .getSubreddit(process.env.SUBREDDIT)
          .updateStylesheet(style)
          .then((data) => {
            success("Success, you did it peter!");
            message(
              process.env.DISCORD_CHANNEL,
              false,
              `MoOooOoo I updated the styelsheet on ${process.env.SUBREDDIT}!`
            );
          })
          .catch((err) => {
            console.log(err);
            message(process.env.DISCORD_CHANNEL, true, err.message);
          });
      }
    );
  }
  if (ACTION == "Send Message") {
    //message(process.env.DISCORD_CHANNEL, false, REASON);
    //agenda.create('Update Sidebar').schedule('5 seconds').save();
    if (process.env.test.includes("football")) {
      console.log("yes");
    } else {
      console.log("no");
    }
  }
  if (ACTION == "Generate Spritesheet") {
    generateSprites();
    success("Spritesheet Generated");
  }
  if (ACTION == "Generate FTT") {
    var app = express();
    // app.set('views', path.join(__dirname, 'views'));
    app.set("view engine", "ejs");

    var date = moment(Date.now()).format("M/D/Y");
    var date_2 = moment(Date.now()).format("M/D/Y hh:mm A");
    var day = moment(Date.now()).format("dddd['s]");

    async function getFTT() {
      var weather = await getWeather();

      var posts = await getRecentPosts(reddit, [
        "All",
        "CFB",
        "LonghornNation",
      ]);

      var tweets = await getRecentTweets([
        "sehlinger3",
        "CoachTomHerman",
        "TexasFootball",
        "BCarringtonUT",
        "MikeRoach247",
        "_delconte",
      ]);

      var calendar = await tsCalendar();

      var last_thread = await getLastThread("Off Topic Free Talk Thread");
      var data = {
        date: {
          short: date,
          long: date_2,
        },
        last_thread: last_thread || null,
        weather: weather,
        top: posts,
        tweets: tweets,
        calendar,
      };
      app.render(
        "ftt.ejs",
        {
          data,
        },
        function (err, doc) {
          var markdown = turndownService.turndown(doc, {
            gfm: true,
          });

          var post_title =
            "[" + date + "] " + day + " Off Topic Free Talk Thread - Testing";
          console.log(markdown);
          reddit
            .getSubreddit(process.env.SUBREDDIT)
            .submitSelfpost({
              title: post_title,
              text: markdown,
            })
            .sticky()
            .setSuggestedSort("new");
          if (last_thread && last_thread.id) {
            reddit.getSubmission(last_thread.id).unsticky();
          }
          message(
            process.env.DISCORD_CHANNEL,
            false,
            `MoOooOoo FTT posted on ${process.env.SUBREDDIT}!`
          );
        }
      );
    }
    await getFTT();
  }
  if (ACTION == "Scrape Texas") {
    //tsBoxScore('12343').then(data => {});
    async function dog() {
      let dog = await texasSports();
    }
    dog();
  }
  if (ACTION == "Schedule Job") {
    var jobsList = {};
    var testData = {
      id: "401013060",
      opposingTeam: {
        id: "201",
        team: {
          nickname: "Oklahoma",
        },
        curatedRank: {
          current: "2",
        },
        score: {
          displayValue: null,
        },
        reddit: "/r/sooners",
      },
      primaryTeam: {
        id: "251",
        winner: false,
        team: {
          nickname: "Texas",
        },
        score: {
          displayValue: null,
        },
      },
      date: "May 18",
      time: "2:30 pm",
      network: "",
      homeAway: "",
      complete: false,
      venue: {
        address: {
          city: "Austin",
          state: "TX",
        },
      },
    };
    var scheduleDate = moment().add(30, "seconds").toDate();
    console.log("schedule game thread", moment(scheduleDate).fromNow());
    // agenda
    //   .create("game thread", {
    //     event: testData,
    //     sport: "football",
    //   })
    //   .unique({
    //     game_id: testData.id,
    //   })
    //   .schedule(scheduleDate)
    //   .save();
    //agenda.create('update sidebar', {event: testData}).unique({'game_id': testData.id}).schedule(scheduleDate).save();
  }
  if (ACTION === "Generate STT") {
    const app = express();
    app.set("view engine", "ejs");

    const date = moment(Date.now()).format("M/D/Y");
    const longDate = moment(Date.now()).format("M/D/Y hh:mm A");
    const day = moment(Date.now()).format("dddd['s]");
    async function getSTT() {
      const last_thread = await getLastThread("Sports Talk Thread");
      const data = {
        date: {
          short: date,
          long: longDate,
        },
        last_thread: last_thread || null,
      };
      app.render("sports-talk-thread", { data }, function (err, doc) {
        if (err) {
          console.log(err);
        }
        const markdown = turndownService.turndown(doc, { gfm: true });
        const post_title = "[" + date + "] " + day + " Sports Talk Thread";
        reddit
          .getSubreddit(process.env.SUBREDDIT)
          .submitSelfpost({ title: post_title, text: markdown })
          .sticky()
          .setSuggestedSort("new")
          .approve()
          .then(() => {
            if (last_thread && last_thread.id) {
              reddit
                .getSubmission(last_thread.id)
                .unsticky()
                .then((data) => {
                  message(539365867402690565, null, "Success!");
                })
                .catch((err) => {});
            } else {
              done();
            }
          })
          .catch((err) => {
            done(err);
          });
      });
    }
    getSTT();
  }
};

run();
