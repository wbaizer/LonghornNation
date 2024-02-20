require("dotenv").config();
const cron = require("node-cron");
const moment = require("moment");
const snoowrap = require("snoowrap");
const express = require("express");
const path = require("path");
let agenda = require("./jobs/agenda");

console.log('delete game threads');
(async () => {
  await agenda.start();

  // Delete all jobs
  agenda.cancel({ name: 'game thread' }, function (err, removed) {
    if (err) {
      console.log(err)
    } 
    console.log(`deleted ${removed} game threads`);
  })

  console.log('All jobs deleted.');

  // Close agenda connection after deleting jobs
  await agenda.stop();
  process.exit();
})();