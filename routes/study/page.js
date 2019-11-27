'use strict';

/**
 * Study Monitor Page Router and Controller
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
  get_study_monitor_user_tag_website_pages,
  get_study_monitor_user_tag_website_pages_data,
  add_study_monitor_user_tag_website_pages,
  remove_study_monitor_user_tag_website_pages
} = require('../../models/page');

router.post('/user/tag/website/pages', async function (req, res, next) {
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

        get_study_monitor_user_tag_website_pages(user_id, tag, website)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/pagesData', async function (req, res, next) {
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

        get_study_monitor_user_tag_website_pages_data(user_id, tag, website)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/removePages', async function (req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('pagesId', 'Invalid pagesId parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;
        const pages_id = JSON.parse(req.body.pagesId);

        remove_study_monitor_user_tag_website_pages(user_id, tag, website, pages_id)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/addPages', async function (req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('domain', 'Invalid website parameter').exists();
    req.check('pages', 'Invalid pages parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;
        const domain = req.body.domain;
        const pages = JSON.parse(req.body.pages);

        add_study_monitor_user_tag_website_pages(user_id, tag, website, domain, pages)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;