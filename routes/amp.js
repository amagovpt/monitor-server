"use strict";

const express = require('express');
const router = express.Router();
const Response = require('../lib/_response');
const Evaluator = require('../models/evaluation');

router.get('/', function(req, res, next) {
  res.send(Response.no_service());
});

router.get('/eval/:url', async function(req, res, next) {
  try {
    req.check('url', 'Ivalid Url').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      let url = decodeURIComponent(req.params.url);
      const data = await Evaluator.evaluate_url(url);
      res.send(data);
    }
  } catch (err) {
    res.send(Response.error(-17, 'SERVER_ERROR', err));
  }
});

router.get('/elements/:url/:element', async function(req, res, next) {
  try {
    req.check('url', 'Ivalid Url').exists();
    req.check('element', 'Invalid Element').exists();

    let errors = req.validationErrors();
    if (errors) {
      res.send(Response.params_error(errors));
    } else {
      let url = decodeURIComponent(req.params.url);
      let element = req.params.element;
      
      const elems = await Evaluator.get_elements(url, element);
      res.send(elems);
    }
  } catch (err) {
    res.send(Response.error(-17, 'SERVER_ERROR', err));
  }
});

module.exports = router;