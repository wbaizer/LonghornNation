const moment = require("moment");
const path = require("path");
const fs = require("fs");
const TurndownService = require("turndown");
const turndownPluginGfm = require("turndown-plugin-gfm");
const { reddit, getLastThread } = require("../../utils/reddit");
const { getWeather, getRecentPosts } = require("../../utils/ftt");
const { tsCalendar } = require("../../utils/service");
const ejs = require("ejs");

const gfm = turndownPluginGfm.gfm;
const turndownService = new TurndownService();
turndownService.use(gfm);

module.exports = function (agenda) {
  agenda.define("Sports Talk Thread", async function (job, done) {
    try {
      console.log("Running the job...");
      const date = moment(Date.now()).format("M/D/Y");
      const date_2 = moment(Date.now()).format("M/D/Y hh:mm A");
      const day = moment(Date.now()).format("dddd['s]");
      
      const weather = await getWeather();
      const posts = await getRecentPosts(reddit, ["All", "CFB", "LonghornNation"]);
      // const tweets = await getRecentTweets(["Hcard7", "CoachSark", "TexasFootball", "_delconte"]);
      const last_thread = await getLastThread("Sports Talk Thread");
      const calendar = await tsCalendar();
      
      const data = {
        date: {
          short: date,
          long: date_2,
        },
        last_thread: last_thread || null,
        weather,
        top: posts,
        tweets: null,
        calendar,
      };
      
      const doc = await renderTemplate("sports-talk-thread", { data });
      const markdown = turndownService.turndown(doc, { gfm: true });
      const post_title = `[${date}] ${day} Sports Talk Thread`;

      const submission = await reddit
        .getSubreddit(process.env.SUBREDDIT)
        .submitSelfpost({ title: post_title, text: markdown })
        .sticky()
        .setSuggestedSort("new")
        .approve();
        
      if (last_thread && last_thread.id) {
        await reddit.getSubmission(last_thread.id).unsticky();
      }
      
      console.log("Job completed successfully.");
      done(); // Notify Agenda that the job is done
    } catch (error) {
      console.error("Error:", error);
      done(error); // Notify Agenda with an error if needed
    }
  });
};

async function renderTemplate(templateName, context) {
  try {
    // Load the EJS template file
    const templatePath = path.join(__dirname, `../../views/${templateName}.ejs`);
    const template = await fs.promises.readFile(templatePath, "utf-8");

    // Render the template using EJS
    const renderedContent = ejs.render(template, context);

    return renderedContent;
  } catch (error) {
    throw new Error(`Error rendering template: ${error.message}`);
  }
}