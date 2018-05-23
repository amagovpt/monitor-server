"use strict";

const express = require('express');
const router = express.Router();
const Response = require('../lib/_response');
const User = require('../models/user');
const Entity = require('../models/entity');

router.post('/create', async function (req, res, next) {
  try {
    req.check('shortName', 'Ivalid Short Name').exists();
    req.check('longName', 'Invalid Long Name').exists();
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        let shortName = req.body.shortName;
        let longName = req.body.longName;
        let websites = req.body.websites;
        let tags = req.body.tags;

        const entity = await Entity.create(shortName, longName, websites, tags);
        res.send(entity);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-17, 'SERVER_ERROR', err)); 
  }
});

/**
 * GETS
 */

router.post('/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        const entities = await Entity.all();
        res.send(entities);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-17, 'SERVER_ERROR', err)); 
  }
});

module.exports = router;