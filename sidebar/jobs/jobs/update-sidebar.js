const express = require('express');
const path = require('path');
const moment = require('moment');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const { reddit } = require('../../utils/reddit');
const { fetchTeamSchedule } = require('../../utils/schedule');
const teamLink = require('../../static_data/teams.reddit.json');
const networks = require('../../static_data/networks.json');

const gfm = turndownPluginGfm.gfm;
const turndownService = new TurndownService();
turndownService.use(gfm);

module.exports = function (agenda) {
    agenda.define('Update Sidebar', async function (job, done) {
        try {
            const app = express();
            app.set('views', path.join(__dirname, '../../views'));
            app.set('view engine', 'ejs');
            app.locals.moment = moment;
            const date = moment(Date.now()).format('M/D/Y hh:mm A');
            const show = {
                football: process.env.FOOTBALL,
                baseball: process.env.BASEBALL,
                basketball: process.env.BASKETBALL
            };
            const data = await fetchTeamSchedule(agenda);
            app.render('sidebar', { data, teamLink, networks, date, show, moment }, async function (err, doc) {
                if (err) {
                    console.error('Error rendering sidebar:', err);
                    return done(err);
                }
                try {
                    const markdown = turndownService.turndown(doc, { gfm: true });
                    await reddit.getSubreddit(process.env.SUBREDDIT).editSettings({ description: markdown });
                    console.log('Updated Reddit sidebar');
                    done();
                } catch (err) {
                    console.error('Error updating Reddit sidebar:', err);
                    job.schedule('15 seconds');
                    job.save();
                    done(err);
                }
            });
        } catch (err) {
            console.error('Error in job execution:', err);
            done(err);
        }
    });
};
