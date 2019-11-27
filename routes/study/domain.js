'use strict';

/**
 * Study Monitor Domain Router and Controller
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
  verify_user
} = require('../../models/user');

const {
  study_monitor_user_tag_website_domain_exists,
  get_study_monitor_user_tag_website_domain
} = require('../../models/website');

router.post('/user/tag/website/domainExists', async function (req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('domain', 'Invalid domain parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const domain = req.body.domain;

        study_monitor_user_tag_website_domain_exists(user_id, tag, domain)
          .then(exists => res.send(exists))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/domain', async function (req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;

        get_study_monitor_user_tag_website_domain(user_id, tag, website)
          .then(domain => res.send(domain))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;