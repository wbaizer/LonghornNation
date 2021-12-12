import express from 'express';
import { join } from 'path';
import moment from 'moment';
import TurndownService from 'turndown';
import { gfm as _gfm } from 'turndown-plugin-gfm';
import { reddit, getLastThread } from '../../utils/reddit';

const gfm = _gfm;
const turndownService = new TurndownService();
turndownService.use(gfm);

export default function (agenda) {
  agenda.define('Sports Talk Thread', function (_, done) {
    console.log('Job Starting...');
    const app = express();
    app.set('views', join(__dirname, '../../views'));
    app.set('view engine', 'ejs');

    const date = moment(Date.now()).format('M/D/Y');
    const longDate = moment(Date.now()).format('M/D/Y hh:mm A');
    const day = moment(Date.now()).format("dddd['s]");
    async function getSTT() {
      const last_thread = await getLastThread('Sports Talk Thread');
      const data = {
        date: {
          short: date,
          long: longDate,
        },
        last_thread: last_thread || null,
      };
      app.render('sports-talk-thread', { data }, function (err, doc) {
        if (err) {
          done(err);
        }
        const markdown = turndownService.turndown(doc, { gfm: true });
        const post_title = '[' + date + '] ' + day + ' Sports Talk Thread';
        reddit
          .getSubreddit(process.env.SUBREDDIT)
          .submitSelfpost({ title: post_title, text: markdown })
          .sticky()
          .setSuggestedSort('new')
          .approve()
          .then(() => {
            if (last_thread && last_thread.id) {
              reddit
                .getSubmission(last_thread.id)
                .unsticky()
                .then((data) => {
                  done();
                })
                .catch((err) => {
                  done(err);
                });
            } else {
              done();
            }
          })
          .catch((err) => {
            done(err);
          });
      });
    }
    getSTT();
  });
}
