'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { verify_user } = require('../models/user');
const { 
  create_entity, 
  entity_short_name_exists, 
  entity_long_name_exists, 
  get_all_entities, 
  get_all_entities_info 
} = require('../models/entity');

router.post('/create', async function (req, res, next) {
  try {
    req.check('shortName', 'Invalid Short Name').exists();
    req.check('longName', 'Invalid Long Name').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const shortName = req.body.shortName;
        const longName = req.body.longName;
        const websites = req.body.websites;
        const tags = req.body.tags;

        create_entity(shortName, longName, websites, tags)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

/**
 * GETS
 */

router.get('/existsShortName/:name', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      entity_short_name_exists(req.params.name)
        .then(exists => res.send(exists))
        .catch(err => res.send(err));
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.get('/existsLongName/:name', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      entity_long_name_exists(req.params.name)
        .then(exists => res.send(exists))
        .catch(err => res.send(err));
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

router.post('/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user !== -1) {
        get_all_entities()
          .then(entities => res.send(entites))
          .catch(err => res.send(res));
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
      if (user !== -1) {
        get_all_entities_info()
          .then(entities => res.send(entites))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err))); 
  }
});

module.exports = router;