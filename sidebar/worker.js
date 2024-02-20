require("dotenv").config();

const cron = require("node-cron");
const moment = require("moment");
const snoowrap = require("snoowrap");
const express = require("express");
const path = require("path");
const TurndownService = require("turndown");
const turndownPluginGfm = require("turndown-plugin-gfm");

const { fetchTeamSchedule } = require("./utils/schedule");

const { buildTitle } = require("./utils/gameThread");
const teamLink = require("./static_data/teams.reddit.json");
const networks = require("./static_data/networks.json");
let agenda = require("./jobs/agenda");

console.log("Starting Up App");
agenda.on("ready", function () {

  agenda
    .create("Update Sidebar")
    .unique({ subreddit: process.env.SUBREDDIT })
    .repeatEvery("0 0 * * *", { skipImmediate: false })
    .save();
  agenda
    .create("Free Talk Thread")
    .unique({ "ftt-sub": process.env.SUBREDDIT })
    .repeatEvery("0 0 * * *", { skipImmediate: true })
    .save();
  agenda
    .create("Sports Talk Thread")
    .unique({ "stt-sub": process.env.SUBREDDIT })
    .repeatEvery("2 0 * * *", { skipImmediate: true })
    .save();
});

console.log("created recurring event");
