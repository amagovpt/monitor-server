"use strict";

const express = require('express');
const router = express.Router();
const Response = require('../lib/_response');

router.get('/', function(req, res, next) {
  res.send(Response.no_service());
});

module.exports = router;