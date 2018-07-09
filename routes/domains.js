'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { verify_user } = require('../models/user');
const { 
  create_domain, 
  domain_exists, 
  get_all_active_domains, 
  get_all_domains_info 
} = require('../models/domain');

router.post('/create', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid Website Id').exists();
    req.check('url', 'Invalid Url').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const website_id = req.body.websiteId;
        const url = req.body.url;
        const tags = req.body.tags;
        
        create_domain(website_id, url, tags)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

/**
 * GETS
 */

router.get('/exists/:domain', async function (req, res, next) {
  try {
    req.check('domain', 'Invalid Domain').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const url = req.params.domain;

      domain_exists(url)
        .then(exists => res.send(exists))
        .catch(err => re.send(err));
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_active_domains()
          .then(domains => res.send(domains))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/allInfo', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_domains_info()
          .then(domains => res.send(domains))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

module.exports = router;