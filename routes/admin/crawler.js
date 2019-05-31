'use strict';

/**
 * Admin Crawler Router and Controller
 */

const express = require('express');
const router = express.Router();

const {
  ServerError,
  ParamsError
} = require('../../lib/_error');
const {
  error
} = require('../../lib/_response');

const {
  crawl_domain,
  get_crawl_results_domain,
  get_crawl_results_crawlDomainID,
  delete_crawl_results,
  is_done_crawl_domain,
  get_all_crawl_results,
  get_crawler_settings,
  set_crawler_settings
} = require('../../models/crawler');

router.post('/crawler/crawl', async function (req, res, next) {
  try {
    req.check('domain', 'Invalid domain parameter').exists();
    req.check('domainId', 'Invalid domainID parameter').exists();
    req.check('subDomain', 'Invalid domain parameter').exists();
    req.check('max_depth', 'Invalid depth number').exists();
    req.check('max_pages', 'Invalid max page number').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const domain = req.body.domain;
      const domainId = req.body.domainId;
      const subDomain = req.body.subDomain; //se for para dar crawl no dominio, mete subDomain = domain
      const max_depth = parseInt(req.body.max_depth, 0);
      const max_pages = parseInt(req.body.max_pages, 0);

      crawl_domain(subDomain, domain, domainId, max_depth, max_pages)
        .then(result => res.send(result))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/crawler/getSubDomain', async function (req, res, next) {
  try {
    req.check('subDomain', 'Invalid subDomain parameter').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const subDomain = req.body.subDomain;

      get_crawl_results_domain(subDomain)
        .then(result => res.send(result))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/crawler/getByCrawlDomainID', async function (req, res, next) {
  try {
    req.check('crawlDomainId', 'Invalid subDomain parameter').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const id = req.body.crawlDomainId;

      get_crawl_results_crawlDomainID(id)
        .then(result => res.send(result))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/crawler/getAll', async function (req, res, next) {
  try {
    get_all_crawl_results()
      .then(result => res.send(result))
      .catch(err => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/crawler/isSubdomainDone', async function (req, res, next) {
  try {
    req.check('subDomain', 'Invalid subDomain parameter').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const subDomain = req.body.subDomain;

      is_done_crawl_domain(subDomain)
        .then(result => res.send(result))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/crawler/delete', async function (req, res, next) {
  try {
    req.check('crawlDomainId', 'Invalid crawlDomainId parameter').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const crawlDomainId = req.body.crawlDomainId;

      delete_crawl_results(crawlDomainId)
        .then(result => res.send(result))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/crawler/getConfig', async function (req, res, next) {
  try {
    get_crawler_settings()
      .then(result => res.send(result))
      .catch(err => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/crawler/setConfig', async function (req, res, next) {
  try {
    req.check('maxDepth', 'Invalid depth number').exists();
    req.check('maxPages', 'Invalid max page number').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const max_depth = req.body.maxDepth;
      const max_pages = req.body.maxPages;
      
      set_crawler_settings(max_depth, max_pages)
        .then(result => res.send(result))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;