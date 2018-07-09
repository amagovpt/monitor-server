'use strict';

const express = require('express');
const router = express.Router();
const { size, split } = require('lodash');
const { each } = require('async');
const { ServerError, ParamsError } = require('../lib/_error');
const { success, error } = require('../lib/_response');
const { verify_user } = require('../models/user');
const { create_page, get_all_pages, get_all_pages_info } = require('../models/page');
const { evaluate_url_and_save } = require('../models/evaluation');

router.post('/create', async function (req, res, next) {
  try {
    req.check('domainId', 'Ivalid Domain Id').exists();
    req.check('uris', 'Invalid Uris').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const domain_id = req.body.domainId;
        const uris = split(req.body.uris, '\n');
        const tags = req.body.tags;

        each(uris, (uri, callback) => {
          create_page(domain_id, uris[i], tags)
            .then(page => {
              evaluate_url_and_save(page.result, uris[i])
                .then(succes => callback())
                .catch(err => callback(err))
            })
            .catch(err => callback(err));
        }, err => {
          if (err) {
            res.send(err);
          } else {
            res.send(success());
          }
        });
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

/**
 * GETS
 */

router.post('/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_pages()
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/allInfo', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_pages_info()
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

module.exports = router;