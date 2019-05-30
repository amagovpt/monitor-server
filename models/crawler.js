'use strict';

/**
 * Page Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const {
  success,
  error
} = require('../lib/_response');
const {
  execute_query
} = require('../lib/_database');
const Crawler = require('simplecrawler');

const fs = require('fs');

const { write_file } = require('../lib/_util');

const crawler = (domain, max_depth, max_pages, crawl_domain_id) => {
  return new Promise((resolve, reject) => {

    const crawler = Crawler('http://' + domain);
    let urlList = [];
    let pageNumber = 0;
    let emit = false;

    crawler.on('fetchcomplete', function (r, q) {
      let contentType = r['stateData']['contentType'];
      if ((contentType.includes('text/html') || contentType.includes('image/svg+xml')) && (pageNumber <= max_pages || max_pages === 0)) {
        urlList.push(r['url']);
        urlList = _.uniq(urlList);
        pageNumber = urlList.length;
      }

      if (pageNumber >= max_pages && max_pages !== 0 && !emit) {
        emit = true;
        this.emit('complete');
      }
    });

    crawler.on('complete', async function () {
      crawler.stop();
      let query;

      for (let page of urlList) {
        query = `INSERT INTO CrawlPage ( Uri,CrawlDomainId) VALUES ("${page}","${crawl_domain_id.insertId}")`;
        await execute_query(query);
      }

      query = `UPDATE CrawlDomain SET Done = "1" WHERE CrawlDomainId = "${crawl_domain_id.insertId}"`;
      await execute_query(query);


      resolve(urlList);
    });
    crawler.nextConcurrency = 25;
    crawler.interval = 0.1;
    crawler.maxDepth = max_depth + 1;
    crawler.start();
  });
}


module.exports.crawl_domain = async (subDomain, domain, domainId, max_depth, max_pages) => {
  const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  let query = `INSERT INTO CrawlDomain (DomainUri, DomainId, Creation_Date,SubDomainUri) VALUES ("${domain}", "${domainId}", "${date}","${subDomain}")`;
  let crawl_domain_id = await execute_query(query);
  crawler(subDomain, max_depth, max_pages, crawl_domain_id);

  return success(true);
};

module.exports.get_crawl_results_domain = async (domain) => {

  const query = `SELECT cp.Uri,cp.CrawlId,cd.Creation_Date
                    FROM CrawlPage as cp,
                    CrawlDomain as cd
                    WHERE cd.DomainUri = "${domain}" AND cp.CrawlDomainId = cd.CrawlDomainId`;

  const pages = await execute_query(query);

  return success(pages);
};

module.exports.get_all_crawl_results = async () => {

  const query = `SELECT *
                    FROM CrawlDomain`;

  const pages = await execute_query(query);

  return success(pages);
};

module.exports.get_crawl_results_subDomain = async (subDomain) => {

  const query = `SELECT cp.Uri,cp.CrawlId,cd.Creation_Date
                    FROM CrawlPage as cp,
                    CrawlDomain as cd
                    WHERE cd.SubDomainUri = "${subDomain}" AND cp.CrawlDomainId = cd.CrawlDomainId`;

  const pages = await execute_query(query);

  return success(pages);
};

module.exports.get_crawl_results_crawlDomainID = async (crawlDomainID) => {

  const query = `SELECT cp.Uri,cp.CrawlId,cd.Creation_Date
                    FROM CrawlPage as cp,
                    CrawlDomain as cd
                    WHERE cd.CrawlDomainId = "${crawlDomainID}" AND cp.CrawlDomainId = cd.CrawlDomainId`;

  const pages = await execute_query(query);

  return success(pages);
};

module.exports.is_done_crawl_domain = async (subDomain) => {

  const query = `SELECT cd.Done
                    FROM 
                    CrawlDomain as cd
                    WHERE cd.SubDomainUri = "${subDomain}"`;

  const page = await execute_query(query);
  let result;

  if (_.size(page) === 0)
    result = 0;
  else if (page[0].Done === 1)
    result = 2;
  else
    result = 1;

  return success(result);
};

module.exports.delete_crawl_results = async (crawlDomainId) => {

    const query = `DELETE FROM CrawlDomain
                    WHERE CrawlDomainId = "${crawlDomainId}"`;
    await execute_query(query);

  return success(true);
};


module.exports.set_crawler_settings = async (max_depth, max_pages) => {
  try {
    let settings = {};

    settings['maxDepth'] = max_depth;
    settings['maxPages'] = max_pages;

    await write_file(__dirname + '/../lib/crawler_config.json', JSON.stringify(settings, null, 2));

    /*fs.writeFile('../lib/crawler_config.json', JSON.stringify(settings), function (err) {
      if (err) {
        throw (err);
      }
    });*/

    return success(true);
  } catch (err) {
    console.log(err);
    return error(err);
  }
};


module.exports.get_crawler_settings = async () => {
  try {
    const settings = require('./../lib/crawler_config.json');
    return success(settings);
  } catch (err) {
    console.log(err);
    return error(err);
  }
};

const readFile = () => {
  return new Promise((resolve, reject) => {
    let settings = {};

    fs.readFile('../lib/crawler_config.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        settings = JSON.parse(data);
        resolve(settings);
      }
    });
  });
}
