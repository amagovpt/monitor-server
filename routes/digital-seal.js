'use strict';

/**
 * Digital Seal Router and Controller
 */

const express = require('express');
const router = express.Router();

const {
  ServerError,
  ParamsError
} = require('../lib/_error');
const {
  error
} = require('../lib/_response');
const {
  get_website_seal_information
} = require('../models/website');

router.post('/', function (req, res, next) {
  try {
    req.check('domain', 'Invalid Domain').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const domain = req.body.domain;

      get_website_seal_information(domain)
        .then(imageInformation => res.send(imageInformation))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.get('/:domain', function (req, res, next) {
  try {
    req.check('domain', 'Invalid Domain').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const domain = req.params.domain;

      get_website_seal_information(domain)
        .then(imageInformation => res.send(imageInformation))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;