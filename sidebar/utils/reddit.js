const snoowrap = require('snoowrap');

const reddit = new snoowrap({
    userAgent: '/u/chrislabeard texas-schedule@0.0.1',
    clientId: process.env.REDDIT_KEY,
    clientSecret: process.env.REDDIT_SECRET,
    username: process.env.USERNAME || USERNAME,
    password: process.env.PASSWORD || PASSWORD
  });

async function getLastThread(search) {
    var submissions = await reddit.getUser(process.env.USERNAME).getSubmissions();
    for (const post of submissions) {
        if(post.subreddit.display_name == process.env.SUBREDDIT) {
            if(post.title.indexOf(search) > -1) {
                return {
                    url: post.url,
                    id: post.id
                }
            }
        }
    }
}  

module.exports = {
    reddit,
    getLastThread
}