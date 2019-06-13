'use strict';

const {
  AxePuppeteer
} = require('axe-puppeteer');
const puppeteer = require('puppeteer');
//const reporter = require('axe-reporter-earl');
const reporter = require('../../../../deque/axe-reporter-earl/dist/axeReporterEarl');
const fs = require('fs');

module.exports.init = async params => {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.setViewport({
    width: 1366,
    height: 768
  });

  await page.setBypassCSP(true);

  await page.goto(params[0]);

  const axe = new AxePuppeteer(page);
  /*axe.configure({
    createEarlReport
  });*/
  const results = await axe.analyze();

  const earl = reporter.default(results, params[0]);

  console.log(earl);

  //await write_file(__dirname + '/page.json', JSON.stringify(earlReport, null, 2))

  await page.close();
  await browser.close();

  return results;
}

function write_file (path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}