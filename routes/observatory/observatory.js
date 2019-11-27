'use strict';

/**
 * Observatory Router and Controller
 */

const express = require('express');
const router = express.Router();
const {
  ServerError
} = require('../../lib/_error');
const {
  error
} = require('../../lib/_response');
const {
  get_observatory_data
} = require('../../models/page');

router.get('/', async function (req, res, next) {
  try {
    get_observatory_data()
      .then(data => res.send(data))
      .catch(err => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;