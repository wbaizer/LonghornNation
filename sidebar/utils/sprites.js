const nsg = require('node-sprite-generator');
const teamInfo = require('../static_data/teams.json');
const customFlair = require('../static_data/custom-flair.json');


function generateSprites(query, key, limit = 10) {
    nsg({
        src: [
        './src/images/teams/20x20/*.png',
        './src/images/custom/*.png',
        './src/images/networks/*.png'
        ],
        spritePath: './src/images/sprite.png',
        compositor: 'jimp',
        stylesheet: 'css',
        layout: 'packed',
        layoutOptions: {
        padding:5
        },
        stylesheetPath: './src/css/sprite.css',
        stylesheet: './src/css/template.tpl',
        stylesheetOptions: {
        nameMapping: function(data) {
            var split = data.split('/');
            var temp = split[4].split('.');
            var id = temp[0];       
            var type = split[3];
            var classes = {};
            var item = customFlair[id];
            if(type == 'teams') {
                temp = split[5].split('.');
                id = temp[0];
                var team = teamInfo[id];
                if('reddit' in team) {
                    classes.link = team.reddit;
                }
                if('flair' in team) {
                    classes.flair = team.flair;
                }
            } else {
                if('reddit' in item) {
                    classes.link = item.reddit;
                }
                if('flair' in item) {
                    classes.flair = item.flair;
                }
            }      
            return classes
        }
        }
    }, function(err){
        if(err) {
        console.log(err);
        return {error: err}
        }
        return {message: 'complete'};
    });
}

module.exports = {
    generateSprites
};