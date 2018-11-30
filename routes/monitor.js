'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { verify_user, change_user_password } = require('../models/user');
const { get_my_monitor_user_websites, get_my_monitor_user_website_domain } = require('../models/website');
const { get_my_monitor_user_website_pages, add_my_monitor_user_website_pages, remove_my_monitor_user_website_pages, get_page_id } = require('../models/page');
const { get_my_monitor_newest_evaluation, evaluate_url_and_save } = require('../models/evaluation');

router.post('/user/websites', async function(req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        get_my_monitor_user_websites(user_id)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/website/pages', async function(req, res, next) {
  try {
    req.check('website', 'Invalid website').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const website = req.body.website;

        get_my_monitor_user_website_pages(user_id, website)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/website/domain', async function(req, res, next) {
  try {
    req.check('website', 'Invalid website parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const website = req.body.website;

        get_my_monitor_user_website_domain(user_id, website)
          .then(domain => res.send(domain))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/website/addPages', async function(req, res, next) {
  try {
    req.check('website', 'Invalid website parameter').exists();
    req.check('domain', 'Invalid website parameter').exists();
    req.check('pages', 'Invalid pages parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const website = req.body.website;
        const domain = req.body.domain;
        const pages = JSON.parse(req.body.pages);

        add_my_monitor_user_website_pages(user_id, website, domain, pages)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/website/removePages', async function(req, res, next) {
  try {
    req.check('website', 'Invalid website parameter').exists();
    req.check('pagesId', 'Invalid pages parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const website = req.body.website;
        const pages_id = JSON.parse(req.body.pagesId);
        
        remove_my_monitor_user_website_pages(user_id, website, pages_id)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/evaluation', async function(req, res, next) {
  try {
    req.check('website', 'Invalid website parameter').exists();
    req.check('url', 'Invalid url parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const website = req.body.website;
        const url = decodeURIComponent(req.body.url);

        get_my_monitor_newest_evaluation(user_id, website, url)
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
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/changePassword', async function(req, res, next) {
  try {
    req.check('password', 'Invalid Password parameter').exists();
    req.check('newPassword', 'Invalid NewPassword parameter').exists();
    req.check('confirmPassword', 'Invalid ConfirmPassword parameter').exists().equals(req.body.newPassword);
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const password = req.body.password;
        const new_password = req.body.newPassword;

        change_user_password(user_id, password, new_password)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;