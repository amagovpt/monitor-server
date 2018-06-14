"use strict";

const express = require('express');
const router = express.Router();
const Observatorio = require('../models/observatorio');

router.get('/', async function(req, res, next) {
  try {
    const data = await Observatorio.get_data();
    res.send(data);
  } catch (err) {
    res.send(Response.error(-17, 'SERVER_ERROR', err));
  }
});

module.exports = router;