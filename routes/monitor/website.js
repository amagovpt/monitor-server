'use strict';

/**
 * My Monitor Website Router and Controller
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
  get_my_monitor_user_websites
} = require('../../models/website');

router.post('/user/websites', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        get_my_monitor_user_websites(user_id)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;