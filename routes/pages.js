"use strict";

const express = require('express');
const router = express.Router();
const Response = require('../lib/_response');
const User = require('../models/user');
const Page = require('../models/page');

router.post('/create', async function (req, res, next) {
  try {
    req.check('domainId', 'Ivalid Domain Id').exists();
    req.check('uri', 'Invalid Uri').exists();
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        let domainId = req.body.domainId;
        let uri = req.body.uri;
        let tags = req.body.tags;
        
        const domain = await Page.create(domainId, uri, tags);
        res.send(domain);
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
      const verification = await User.verify(res, req.body.cookie,true);
      if (verification) {
        const pages = await Page.all();
        res.send(pages);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-17, 'SERVER_ERROR', err)); 
  }
});

module.exports = router;