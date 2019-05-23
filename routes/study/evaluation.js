'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../../lib/_error');
const { error } = require('../../lib/_response');
const { verify_user} = require('../../models/user');
const { get_page_id } = require('../../models/page');
const { evaluate_url_and_save, get_newest_evaluation } = require('../../models/evaluation');

router.post('/evaluation', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('url', 'Invalid url parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;
        const url = decodeURIComponent(req.body.url);

        get_newest_evaluation(user_id, tag, website, url)
          .then(evaluation => res.send(evaluation))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/evaluate', async function(req, res, next) {
  try {
    req.check('url', 'Invalid url parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const url = decodeURIComponent(req.body.url);
        const page_id = await get_page_id(url);

        evaluate_url_and_save(page_id.result, url, '00')
          .then(evaluation => res.send(evaluation))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;
