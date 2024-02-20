require("dotenv").config();

const moment = require("moment");
const { fetchTeamSchedule } = require("./utils/schedule");
const { buildTitle } = require("./utils/gameThread");
const teamLink = require("./static_data/teams.reddit.json");
const networks = require("./static_data/networks.json");
const agenda = require("./jobs/agenda");

console.log("Starting Up App");

async function initializeAgenda() {
  try {
    await new Promise((resolve, reject) => {
      agenda.once("ready", () => resolve());
    });

    console.log("Agenda initialized successfully.");

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

    console.log("Recurring events created successfully.");
  } catch (error) {
    console.error("Error initializing Agenda:", error);
    process.exit(1); // Exit the process with a non-zero status code to indicate failure
  }
}

initializeAgenda();
