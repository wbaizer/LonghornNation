const axios = require('axios');
const Twitter = require('twitter');
const moment = require('moment');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});


async function getLastThread(reddit) {
    var submissions = await reddit.getUser('LonghornMod').getSubmissions();
    for (const post of submissions) {
        if(post.subreddit.display_name == process.env.SUBREDDIT) {
            if(post.title.indexOf('Off Topic Free Talk Thread') > -1) {
                return post.url;
            }
        }
    }
}

async function getRecentTweets(users) {
    var list = [];
    for (const user of users) {
        var params = {
            screen_name: user,
            count: 1
        }
        await client.get('statuses/user_timeline', params, function(error, tweets, response) {
            if (!error) {
                var tweet = {
                    screen_name: tweets[0].user.screen_name,
                    url: 'https://twitter.com/user/status/' + tweets[0].id,
                    text: tweets[0].text
                }
                list.push(tweet);
            }
        });       
    }
    return list;
}

async function getRecentPosts(reddit, subs) {
    var list = [];
    for (const subKey of subs) {
        var sub = await reddit.getSubreddit(subKey).getHot({limit:5}).then(submissions => {
            return {
                link: submissions[0].subreddit_name_prefixed,
                posts: mapPosts(submissions)
            }
        });
        list.push(sub);
    };
    return list;
}

function mapPosts(posts) {
    var posts = posts.map(post => {
        return {
            title: post.title,
            link: post.url
        }
    });
    return posts;
}
function getWeather() {
    return axios.all([
        axios.get('http://api.openweathermap.org/data/2.5/weather?q=Austin,us&appid=accd2fab7262c3a5c58351042e7d2c02&units=imperial'),
        axios.get('http://api.openweathermap.org/data/2.5/forecast/daily?q=Austin,us&appid=accd2fab7262c3a5c58351042e7d2c02&units=imperial'),
    ])
    .then(axios.spread(function(
        currentWeather,
        forecast
        ) {
            return {
                    current: mapWeather(currentWeather.data, 1),
                    forecast: mapWeather(forecast.data, 2)
                }
            }
        )
    );
}
function mapWeather(data, type) {
    if(type == 1) {
        return {
            "temp": Math.round(data.main.temp),
            "conditions": data.weather[0].main
        }
    }
    if(type == 2) {
        var forcast = [];
        var forcastTemp = data.list.map(day => {
            return {
                date: moment.unix(day.dt).format('M/D'),
                temp: {
                    low: Math.round(day.temp.min),
                    max: Math.round(day.temp.max)
                },
                conditions: day.weather[0].main
            }
        });
        return forcastTemp;
    }
}

module.exports = {
    getWeather,
    getRecentPosts,
    getRecentTweets,
    getLastThread
};