const { reddit } = require('../utils/reddit');

function gameThread(event, type) {
    if(type) {
        //send post game thread
    } else {
        //send game thread and start watching
        var title = ''
        reddit.getSubreddit(process.env.SUBREDDIT).submitSelfpost({title: post_title, text: markdown})
        setTimeout(gameWatcher(event), 300000);
    }
}
function gameWatcher(event) {
    var gameID = event.id;
    //make API call to ESPN resp summary
    if(summary.header.competitions[0].status.completed) {
        //Game is done make post game thread
        gameThread(summary, true)
    } else {
        setTimeout(gameWatcher(event), 300000);
    }
}

module.exports = {
    gameThread,
    gameWatcher
};