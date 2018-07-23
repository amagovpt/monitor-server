'use strict';

const express = require('express');
const router = express.Router();
const { split } = require('lodash');
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { verify_user } = require('../models/user');
const { get_page_id } = require('../models/page');
const { evaluate_url_and_save, get_newest_evaluation } = require('../models/evaluation');
const { 
  create_user_tag, 
  get_access_studies_user_tags,
  user_tag_name_exists,
  add_user_tag_pages,
  user_remove_tags,
  user_tag_remove_pages
} = require('../models/tag');

const { get_access_studies_user_tag_pages } = require('../models/page');

router.post('/user/tag', async function(req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        get_access_studies_user_tags(user_id)
          .then(tags => res.send(tags))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/pages', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;

        get_access_studies_user_tag_pages(user_id, tag)
          .then(tags => res.send(tags))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/create/tag', async function(req, res, next) {
  try {
    req.check('type', 'Tag type invalid').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const type = req.body.type;
        const official_tag_id = req.body.official_tag_id;
        const user_tag_name = req.body.user_tag_name;

        create_user_tag(user_id, type, official_tag_id, user_tag_name)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/evaluation', async function(req, res, next) {
  try {
    req.check('url', 'Invalid url parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const url = decodeURIComponent(req.body.url);

        get_newest_evaluation(user_id, url)
          .then(evaluation => res.send(evaluation))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/evaluate', async function(req, res, next) {
  try {
    req.check('url', 'Invalid url parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const url = decodeURIComponent(req.body.url);
        const page_id = await get_page_id(url);

        evaluate_url_and_save(page_id.result, url)
          .then(evaluation => res.send(evaluation))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/nameExists', async function(req, res, next) {
  try {
    req.check('name', 'Invalid name parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const name = req.body.name;

        user_tag_name_exists(user_id, name)
          .then(exists => res.send(exists))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/addPages', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('urls', 'Invalid urls parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const urls = JSON.parse(req.body.urls);

        add_user_tag_pages(user_id, tag, urls)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/removeTags', async function(req, res, next) {
  try {
    req.check('tagsId', 'Invalid tagsId parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tagsId = split(req.body.tagsId, ',');

        user_remove_tags(user_id, tagsId)
          .then(tags => res.send(tags))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/removePages', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('pagesId', 'Invalid pagesId parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const pagesId = split(req.body.pagesId, ',');
        
        user_tag_remove_pages(user_id, tag, pagesId)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;