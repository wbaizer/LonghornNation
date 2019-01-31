const snoowrap = require('snoowrap');

const reddit = new snoowrap({
    userAgent: '/u/chrislabeard texas-schedule@0.0.1',
    clientId: process.env.REDDIT_KEY,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.USERNAME || USERNAME,
    password: process.env.PASSWORD || PASSWORD
  });

module.exports = {
    reddit
}