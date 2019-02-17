const express = require('express');
const path = require('path');
const moment = require('moment');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const teamLink = require('../static_data/teams.abr.json');
const networks = require('../static_data/networks.json');

var app = express();
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

var gfm = turndownPluginGfm.gfm
var turndownService = new TurndownService();
turndownService.use(gfm);

function createMarkdown(template, data) {
    return new Promise(function(resolve,reject) {
        app.render(template, {data, networks, teamLink}, function(err, doc) {
            if(err) {
                reject(err);
            }
            var markdown = turndownService.turndown(doc, {gfm: true});
            resolve(markdown);
        });
    });

}


module.exports = createMarkdown;