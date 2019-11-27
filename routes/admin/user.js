'use strict';

/**
 * Admin User Router and Controller
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
  verify_user,
  get_number_of_study_monitor_users,
  get_number_of_my_monitor_users,
  get_all_users,
  get_all_monitor_users,
  create_user,
  user_exists,
  get_user_info,
  update_user,
  delete_user,
  get_user_type_success
} = require('../../models/user');

router.post('/users/studies/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_study_monitor_users()
          .then(total => res.send(total))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/users/monitor/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_my_monitor_users()
          .then(total => res.send(total))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/users/type', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const username = req.body.username;

        get_user_type_success(username)
          .then(type => res.send(type))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/users/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_users()
          .then(users => res.send(users))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/users/monitor', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_monitor_users()
          .then(users => res.send(users))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/users/info', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();
    req.check('userId', 'Invalid parameter userId').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const edit_user_id = req.body.userId;

        get_user_info(edit_user_id)
          .then(user => res.send(user))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.get('/users/exists/:username', async function (req, res, next) {
  try {
    req.check('username', 'Invalid Username').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const username = req.params.username;

      user_exists(username)
        .then(exists => res.send(exists))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/users/create', async function (req, res, next) {
  try {
    req.check('username', 'Invalid Username').exists();
    req.check('password', 'Invalid Password').exists();
    req.check('confirmPassword', 'Invalid Password Confirmation').exists().equals(req.body.password);
    req.check('names', 'Invalid Contact Names').exists();
    req.check('emails', 'Invalid Contact E-mails').exists();
    req.check('app', 'Invalid user Type').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const username = req.body.username;
        const password = req.body.password;
        const names = req.body.names;
        const emails = req.body.emails;
        const type = req.body.app;
        const websites = JSON.parse(req.body.websites);
        const transfer = req.body.transfer === 'true';

        create_user(username, password, names, emails, type, websites, transfer)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

/**
 * UPDATE
 */

router.post('/users/update', async function (req, res, next) {
  try {
    req.check('userId', 'Invalid parameter EntityId').exists();
    req.check('password', 'Invalid parameter Password').exists();
    req.check('confirmPassword', 'Invalid parameter ConfirmPassword').exists().equals(req.body.password);
    req.check('names', 'Invalid Contact Names').exists();
    req.check('emails', 'Invalid Contact E-mails').exists();
    req.check('app', 'Invalid parameter App').exists();
    req.check('defaultWebsites', 'Invalid parameter DefaultWebsites').exists();
    req.check('websites', 'Invalid parameter Websites').exists();
    req.check('transfer', 'Invalid parameter Transfer').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const edit_user_id = req.body.userId;
        const password = req.body.password;
        const names = req.body.names;
        const emails = req.body.emails;
        const app = req.body.app;
        const default_websites = JSON.parse(req.body.defaultWebsites);
        const transfer = req.body.transfer === 'true';
        const websites = JSON.parse(req.body.websites);

        update_user(edit_user_id, password, names, emails, app, default_websites, websites, transfer)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/users/delete', async function (req, res, next) {
  try {
    req.check('userId', 'Invalid parameter UserId').exists();
    req.check('app', 'Invalid parameter App').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const delete_user_id = req.body.userId;
        const app = req.body.app;

        delete_user(delete_user_id, app)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;