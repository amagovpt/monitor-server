'use strict';

/**
 * Admin Router and Controller
 */

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');

const { login_user } = require('../models/user');

router.post('/login', function(req, res, next) {
  try {
    req.check('email', 'Invalid Email').exists().isEmail();
    req.check('password', 'Invalid Password').exists();
    req.check('app', 'Invalid App').exists();
    
    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const email = req.body.email;
      const password = req.body.password;
      const app = req.body.app;

      login_user(email, password, app)
        .then(cookie => res.send(cookie))
        .catch(err => res.send(err));
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;