const snoowrap = require('snoowrap');

// Add request tracking
let requestCount = 0;
const requestLimit = 60; // per minute
let lastReset = Date.now();

const reddit = new snoowrap({
  userAgent: 'nodejs:texas-schedule:v0.0.1 (by /u/' + process.env.USERNAME + ')',
  clientId: process.env.REDDIT_KEY,
  clientSecret: process.env.REDDIT_SECRET,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
});

// Add configuration with correct option names
reddit.config({
  continueAfterRatelimitError: true,
  requestTimeout: 30000,
  warnings: true,
  maxRetryAttempts: 3,  // Changed from maxRetries
  retryErrorCodes: [502, 503, 504, 429],
  requestDelay: 1000,
  debug: process.env.NODE_ENV !== 'production'
});

// Add error checking
if (!process.env.REDDIT_KEY || !process.env.REDDIT_SECRET || !process.env.USERNAME || !process.env.PASSWORD) {
  throw new Error('Missing required Reddit authentication environment variables');
}

async function makeRedditRequest(func) {
  const now = Date.now();
  if (now - lastReset > 60000) {
    requestCount = 0;
    lastReset = now;
  }
  
  if (requestCount >= requestLimit) {
    const waitTime = 60000 - (now - lastReset);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount = 0;
    lastReset = Date.now();
  }
  
  requestCount++;
  return func();
}

async function getLastThread(search) {
  return makeRedditRequest(async () => {
    const submissions = await reddit.getUser(process.env.USERNAME).getSubmissions();
    for (const post of submissions) {
      if (post.subreddit.display_name == process.env.SUBREDDIT) {
        if (post.title.indexOf(search) > -1) {
          return {
            url: post.url,
            id: post.id,
          };
        }
      }
    }
    return null;
  });
}

module.exports = {
  reddit,
  getLastThread,
  makeRedditRequest
};
