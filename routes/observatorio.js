'use strict';

const express = require('express');
const router = express.Router();
const { ServerError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { get_observatorio_data } = require('../models/observatorio');

router.get('/', async function(req, res, next) {
  try {
    get_observatorio_data()
      .then(data => res.send(data))
      .catch(err => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;