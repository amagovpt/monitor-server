"use strict";

const express = require('express');
const router = express.Router();
const Response = require('../lib/_response');
const User = require('../models/user');
const Tag = require('../models/tag');

router.post('/create', async function (req, res, next) {
  try {
    req.check('name', 'Ivalid Name').exists();
    req.check('observatorio', 'Invalid Observatorio').exists();
    req.check('cookie', 'User not logged in').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      const verification = await User.verify(res, req.body.cookie, true);
      if (verification) {
        let name = req.body.name;
        let observatorio = req.body.observatorio;
        let entities = req.body.entities;
        let websites = req.body.websites;
        let domains = req.body.domains;
        let pages = req.body.pages;
        
        const tag = await Tag.create(name, observatorio, entities, websites, domains, pages);
        res.send(tag);
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
        const tags = await Tag.all();
        res.send(tags);
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
        const tags = await Tag.all_info();
        res.send(tags);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(Response.error(-17, 'SERVER_ERROR', err)); 
  }
});

module.exports = router;