'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { verify } = require('../models/user');
const { get_all_user_websites } = require('../lib/website');
const { get_user_website_pages } = require('../lib/page');

router.post('/user/websites', async function(req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify(res, req.body.cookie, false);
      if (user_id !== -1) {
        get_all_user_websites(user_id)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/website/pages', async function(req, res, next) {
  try {
    req.check('website_id', 'Invalid website').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify(res, req.body.cookie, false);
      if (user_id !== -1) {
        const website_id = req.body.website_id;

        get_user_website_pages(user_id, website_id)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;