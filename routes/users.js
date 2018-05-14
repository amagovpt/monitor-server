"use strict";

/**
 * Users Router and Controller
 */

const express = require('express');
const router = express.Router();
const Response = require('../lib/_response');
const User = require('../models/user');

/**
 * Root user router
 * Does nothing - service not available
 * @param  {[type]} req   [description]
 * @param  {[type]} res   [description]
 * @param  {[type]} next) {             res.send(Reponse.no_service());} [description]
 * @return {[type]}       [description]
 */
router.get('/', function(req, res, next) {
  res.send(Reponse.no_service());
});


/**
 * [description]
 * @param  {[type]} req   [description]
 * @param  {[type]} res   [description]
 * @param  {[type]} next) {             try {    req.check('email', 'Ivalid Email').exists().isEmail();    req.check('password', 'Invalid Password').exists();        var errors [description]
 * @return {[type]}       [description]
 */
router.post('/login', async function(req, res, next) {
  try {
    req.check('email', 'Ivalid Email').exists().isEmail();
    req.check('password', 'Invalid Password').exists();
    
    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      let email = req.body.email;
      let password = req.body.password;

      const user = await User.login(email, password);
      res.send(user);
    }
  } catch (err) {
    res.send(Response.error(-14, 'SERVER_ERROR', err));
  }
});

router.post('/create', async function (req, res, next) {
  try {
    req.check('email', 'Ivalid Email').exists();
    req.check('password', 'Invalid Password').exists();
    req.check('confirmPassword', 'Invalid Password Confirmation').exists().equals(req.body.password);
    req.check('app', 'Ivalid user Type').exists();
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(req.body.cookie);
      if (verification) {
        let email = req.body.email;
        let password = req.body.password;
        let type = req.body.app;

        const user = await User.create(email, password, type);
        res.send(user);
      } else {
        res.send(Response.error(-13, 'USER_VERIFICATION_ERROR'));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-14, 'SERVER_ERROR', err)); 
  }
});

router.post('/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(req.body.cookie);
      if (verification) {

        const users = await User.all();
        res.send(users);
      } else {
        res.send(Response.error(-13, 'USER_VERIFICATION_ERROR'));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-14, 'SERVER_ERROR', err)); 
  }
});

module.exports = router;