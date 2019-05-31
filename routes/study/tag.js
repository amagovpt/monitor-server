'use strict';

/**
 * Study Monitor Tag Router and Controller
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
  verify_user
} = require('../../models/user');

const {
  get_all_official_tags,
  create_user_tag,
  get_study_monitor_user_tags,
  user_tag_name_exists,
  user_remove_tags
} = require('../../models/tag');

const {
  get_study_monitor_user_websites_from_other_tags
} = require('../../models/website');

router.post('/tags/allOfficial', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        get_all_official_tags(user_id)
          .then(tags => res.send(tags))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tags', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        get_study_monitor_user_tags(user_id)
          .then(tags => res.send(tags))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/create/tag', async function (req, res, next) {
  try {
    req.check('type', 'Tag type invalid').exists();
    req.check('user_tag_name', 'Tag name invalid').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const type = req.body.type;
        const tags_id = JSON.parse(req.body.tagsId);
        const user_tag_name = req.body.user_tag_name;

        create_user_tag(user_id, type, tags_id, user_tag_name)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/nameExists', async function (req, res, next) {
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

router.post('/user/removeTags', async function (req, res, next) {
  try {
    req.check('tagsId', 'Invalid tagsId parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tags_id = JSON.parse(req.body.tagsId);

        user_remove_tags(user_id, tags_id)
          .then(tags => res.send(tags))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/websites/otherTags', async function (req, res, next) {
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

        get_study_monitor_user_websites_from_other_tags(user_id, tag)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;