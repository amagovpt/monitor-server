"use strict";

/**
 * Websites Router and Controller
 */

const express = require('express');
const router = express.Router();
const Response = require('../lib/_response');
const User = require('../models/user');
const Website = require('../models/website');

router.post('/create', async function (req, res, next) {
  try {
    req.check('shortName', 'Ivalid Short Name').exists();
    req.check('longName', 'Invalid Long Name').exists();
    req.check('domain', 'Invalid Domain').exists();
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        let shortName = req.body.shortName;
        let longName = req.body.longName;
        let domain = req.body.domain;
        let entityId = req.body.entityId;
        let userId = req.body.userId;

        const website = await Website.create(shortName, longName, domain, entityId, userId);
        res.send(website);
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
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        const websites = await Website.all();
        res.send(websites);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-14, 'SERVER_ERROR', err)); 
  }
});

router.post('/withoutEntity', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        const websites = await Website.all_without_entity();
        res.send(websites);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-14, 'SERVER_ERROR', err)); 
  }
});

module.exports = router;