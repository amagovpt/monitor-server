'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../../lib/_error');
const { error } = require('../../lib/_response');
const { verify_user, change_user_password } = require('../../models/user');
const { get_page_id } = require('../../models/page');
const { evaluate_url_and_save, get_newest_evaluation } = require('../../models/evaluation');

const {
  get_all_official_tags,
  create_user_tag, 
  get_study_monitor_user_tags,
  user_tag_name_exists,
  user_remove_tags
} = require('../../models/tag');

const { 
  get_study_monitor_user_tag_websites,
  get_study_monitor_user_tag_websites_data,
  add_study_monitor_user_tag_new_website,
  add_study_monitor_user_tag_existing_website,
  study_monitor_user_tag_website_name_exists,
  study_monitor_user_tag_website_domain_exists,
  get_study_monitor_user_tag_website_domain,
  remove_study_monitor_user_tag_websites,
  get_study_monitor_user_websites_from_other_tags
} = require('../../models/website');

const { 
  get_study_monitor_user_tag_website_pages,
  get_study_monitor_user_tag_website_pages_data,
  add_study_monitor_user_tag_website_pages,
  remove_study_monitor_user_tag_website_pages
} = require('../../models/page');





router.post('/evaluation', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('url', 'Invalid url parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;
        const url = decodeURIComponent(req.body.url);

        get_newest_evaluation(user_id, tag, website, url)
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

        evaluate_url_and_save(page_id.result, url, '00')
          .then(evaluation => res.send(evaluation))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});


module.exports = router;
