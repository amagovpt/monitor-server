'use strict';

/**
 * Admin Router and Controller
 */
const _ = require('lodash');
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
  verify_user
} = require('../../models/user');

const {
  get_all_entities,
  get_entity_info,
  entity_short_name_exists,
  entity_long_name_exists,
  create_entity,
  update_entity,
  delete_entity
} = require('../../models/entity');


/**
 * GET
 */


router.post('/entities/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_entities()
          .then(entities => res.send(entities))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/entities/info', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();
    req.check('entityId', 'Invalid parameter EntityId').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const entity_id = req.body.entityId;
        get_entity_info(entity_id)
          .then(entity => res.send(entity))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.get('/entities/exists/shortName/:name', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const name = req.params.name;
      entity_short_name_exists(name)
        .then(exists => res.send(exists))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.get('/entities/exists/longName/:name', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const name = req.params.name;
      entity_long_name_exists(name)
        .then(exists => res.send(exists))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});


/**
 * CREATE
 */


router.post('/entities/create', async function (req, res, next) {
  try {
    req.check('shortName', 'Invalid ShortName').exists();
    req.check('longName', 'Invalid LongName').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const shortName = req.body.shortName;
        const longName = req.body.longName;
        const websites = JSON.parse(req.body.websites);

        create_entity(shortName, longName, websites)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/entities/update', async function (req, res, next) {
  try {
    req.check('entityId', 'Invalid parameter EntityId').exists();
    req.check('shortName', 'Invalid parameter ShortName').exists();
    req.check('longName', 'Invalid parameter LongName').exists();
    req.check('defaultWebsites', 'Invalid parameter DefaultWebsites').exists();
    req.check('websites', 'Invalid parameter Websites').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const entity_id = req.body.entityId;
        const short_name = req.body.shortName;
        const long_name = req.body.longName;
        const default_websites = JSON.parse(req.body.defaultWebsites);
        const websites = JSON.parse(req.body.websites);

        update_entity(entity_id, short_name, long_name, default_websites, websites)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

/**
 * DELETE
 */

router.post('/entities/delete', async function (req, res, next) {
  try {
    req.check('entityId', 'Invalid parameter EntityId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const entity_id = req.body.entityId;

        delete_entity(entity_id)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

/*

router.post('/page/crawler', async function (req, res, next) {
  try {
    req.check('domain', 'Invalid domain parameter').exists();
    req.check('max_depth', 'Invalid depth number').exists();
    req.check('max_pages', 'Invalid max page number').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const domain = req.body.domain;
      const max_depth = parseInt(req.body.max_depth, 0);
      const max_pages = parseInt(req.body.max_pages, 0);
      const result = await get_urls(domain, max_depth, max_pages);
      res.send(success(result));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/page/crawlerSettings', async function (req, res, next) {
  try {
    req.check('max_depth', 'Invalid depth number').exists();
    req.check('max_pages', 'Invalid max page number').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      await set_crawler_settings(req.body.max_depth, req.body.max_pages);
      res.send(success());
    }
  } catch (err) {
    console.log(err)
    res.send(error(new ServerError(err)));
  }
});

router.post('/page/odf', async function (req, res, next) {
  try {
    req.check('odf', 'Invalid depth number').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      await add_evaluation(req.body.odf);
      res.send(success());
    }
  } catch (err) {
    console.log(err)
    res.send(error(new ServerError(err)));
  }
});
*/
module.exports = router;
