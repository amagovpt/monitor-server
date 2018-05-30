"use strict";

const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Response = require('../lib/_response');
const User = require('../models/user');
const Page = require('../models/page');
const Evaluation = require('../models/evaluation');

router.post('/create', async function (req, res, next) {
  try {
    req.check('domainId', 'Ivalid Domain Id').exists();
    req.check('uris', 'Invalid Uris').exists();
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        let domainId = req.body.domainId;
        let uris = _.split(req.body.uris, '\n');
        let tags = req.body.tags;
        
        const size = _.size(uris);
        for (let i = 0 ; i < size ; i++) {
          let id = await Page.create(domainId, uris[i], tags);
          Evaluation.evaluate_and_save(id, uris[i]);
        }

        res.send(Response.success());
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
        const pages = await Page.all();
        res.send(pages);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-17, 'SERVER_ERROR', err)); 
  }
});

router.post('/allInfo', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        const pages = await Page.all_info();
        res.send(pages);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-17, 'SERVER_ERROR', err)); 
  }
});

module.exports = router;