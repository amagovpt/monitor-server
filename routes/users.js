"use strict";

/**
 * Users Router and Controller
 */

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { success, error } = require('../lib/_response');
const { 
  verify_user, 
  login_user,
  create_user,
  email_exists,
  get_all_users,
  get_all_monitor_users
} = require('../models/user');

/**
 * [description]
 * @param  {[type]} req   [description]
 * @param  {[type]} res   [description]
 * @param  {[type]} next) {             try {    req.check('email', 'Ivalid Email').exists().isEmail();    req.check('password', 'Invalid Password').exists();        var errors [description]
 * @return {[type]}       [description]
 */
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

router.post('/create', async function (req, res, next) {
  try {
    req.check('email', 'Ivalid Email').exists();
    req.check('password', 'Invalid Password').exists();
    req.check('confirmPassword', 'Invalid Password Confirmation').exists().equals(req.body.password);
    req.check('app', 'Ivalid user Type').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const email = req.body.email;
        const password = req.body.password;
        const type = req.body.app;
        const websites = req.body.websites;

        create_user(email, password, type, websites)
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

router.get('/exists/:email', async function (req, res, next) {
  try {
    req.check('email', 'Invalid Email').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      email_exists(req.params.email)
        .then(exists => res.send(exists))
        .catch(err => res.send(err)); 
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
        get_all_users()
          .then(users => res.send(users))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/monitor', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_monitor_users()
          .then(users => res.send(users))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

module.exports = router;