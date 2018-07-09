'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { verify } = require('../models/user');
const { get_all_websites_from_user } = require('../lib/website');

router.get('/user/websites', async function(req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify(res, req.body.cookie, false);
      if (user_id !== -1) {
        get_all_websites_from_user(user_id)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;