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
 * @param  {[type]} next) {             const user [description]
 * @return {[type]}       [description]
 */
router.post('/login', async function(req, res, next) {
  req.check('email', 'Ivalid Email').exists().isEmail();
  req.check('password', 'Invalid Password').exists();

  let email = req.params.email;
  let password = req.params.password;
  console.log(email);
  var errors = req.validationErrors();
  if (errors) {
    res.send(Response.params_error(errors));
  } else {
    const user = await User.login(email, password);
    console.log(user);
    /*user.then(res => {
      res.send(Response.success(res));
    }).catch(err => {
      res.send(Response.error(err));
    });*/
  }
});

module.exports = router;