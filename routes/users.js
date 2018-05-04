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
router.post('/login', function(req, res, next) {
  const user = await User.login();
  res.send(Response.success(user));
});

module.exports = router;
