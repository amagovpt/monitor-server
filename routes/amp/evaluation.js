'use strict';

/**
 * Access Monitor Plus Evaluation Router and Controller
 */

const express = require('express');
const router = express.Router();
const {
  ServerError,
  ParamsError
} = require('../../lib/_error');
const {
  error
} = require('../../lib/_response');
const {
  evaluate_url,
  evaluate_html,
  save_url_evaluation
} = require('../../models/evaluation');

router.get('/eval/:url', function (req, res, next) {
  try {
    req.check('url', 'Invalid Url').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const url = decodeURIComponent(req.params.url);

      evaluate_url(url, 'examinator') // or 'qualweb'
        .then(evaluation => {
          res.send(evaluation);

          save_url_evaluation(url, evaluation, '00');
        })
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/eval/html', function (req, res, next) {
  try {
    req.check('html', 'Invalid Html').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const html = req.body.html;

      evaluate_html(html, 'examinator') // or 'qualweb'
        .then(evaluation => res.send(evaluation))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;