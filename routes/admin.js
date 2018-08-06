'use strict';

/**
 * Admin Router and Controller
 */

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');

const { 
  verify_user,
  get_all_users
} = require('../models/user');

const { 
  get_all_tags
} = require('../models/tag');

const {
  get_all_entities
} = require('../models/entity');

const {
  get_all_websites
} = require('../models/website');

const {
  get_all_domains
} = require('../models/domain');

const {
  get_all_pages
} = require('../models/page');

router.post('/users/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_users()
          .then(users => res.send(users))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_tags()
          .then(tags => res.send(tags))
          .catch(res => res.send(res));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/entities/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_entities()
          .then(entities => res.send(entities))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/websites/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_websites()
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/domains/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_domains()
          .then(domains => res.send(domains))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/pages/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_pages()
          .then(pages => res.send(pages))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

module.exports = router;