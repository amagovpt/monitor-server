'use strict';

/**
 * Admin Page Router and Controller
 */

const express = require('express');
const router = express.Router();

const {
  ServerError,
  ParamsError
} = require('../../lib/_error');
const {
  success,
  error
} = require('../../lib/_response');

const {
  verify_user,
  get_user_type,
  get_user_id
} = require('../../models/user');

const {
  update_tag_admin,
  verify_update_tag_admin
} = require('../../models/tag');

const {
  update_website_admin,
  verify_update_website_admin
} = require('../../models/website');

const {
  get_page_id,
  get_all_pages,
  get_all_domain_pages,
  create_pages,
  update_page,
  update_page_admin,
  update_page_study_admin,
  delete_pages,
  get_study_monitor_user_tag_website_pages,
  get_my_monitor_user_website_pages,
  update_observatory_pages,
  add_evaluation
} = require('../../models/page');

const {
  evaluate_url_and_save,
  get_evaluation
} = require('../../models/evaluation');

router.post('/page/evaluation', async function (req, res, next) {
  try {
    req.check('url', 'Invalid url').exists();
    req.check('evaluation_id', 'Invalid evaluation_id').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const url = decodeURIComponent(req.body.url);
        const evaluation_id = req.body.evaluation_id;

        get_evaluation(url, evaluation_id)
          .then(evaluation => res.send(evaluation))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/page/evaluate', async function (req, res, next) {
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

        evaluate_url_and_save(page_id.result, url, "10")
          .then(evaluation => res.send(evaluation))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err)
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/all', async function (req, res, next) {
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
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/website', async function (req, res, next) {
  try {
    req.check('tag', 'Invalid tag').exists();
    req.check('user', 'Invalid user').exists();
    req.check('website', 'Invalid Website').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const user = req.body.user;
        const website = req.body.website;

        const app_user_id = await get_user_id(user);

        if (tag !== 'null') {
          get_study_monitor_user_tag_website_pages(app_user_id, tag, website)
            .then(pages => res.send(pages))
            .catch(err => re.send(err));
        } else {
          get_my_monitor_user_website_pages(app_user_id, website)
            .then(pages => res.send(pages))
            .catch(err => re.send(err));
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/domain', async function (req, res, next) {
  try {
    req.check('user', 'Invalid user').exists();
    req.check('domain', 'Invalid domain').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const user = req.body.user;
        const domain = decodeURIComponent(req.body.domain);

        const type = await get_user_type(user);

        let flags;
        switch (type) {
          case 'nimda':
            flags = '1__';
            break;
          case 'monitor':
            flags = '_1_';
            break;
          default:
            flags = '%';
            break;
        }

        get_all_domain_pages(user, type, domain, flags)
          .then(pages => res.send(pages))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/create', async function (req, res, next) {
  try {
    req.check('domainId', 'Invalid DomainId').exists();
    req.check('uris', 'Invalid Uris').exists();
    req.check('observatory', 'Invalid Observatory Uris').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const domain_id = req.body.domainId;
        const uris = JSON.parse(req.body.uris);
        const observatory_uris = JSON.parse(req.body.observatory);

        create_pages(domain_id, uris, observatory_uris, '100')
        //.then(success => res.send(success))
        //.catch(err => res.send(err));

        res.send(success(true));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/update', async function (req, res, next) {
  try {
    req.check('pageId', 'Invalid parameter PageId').exists();
    req.check('checked', 'Invalid parameter Checked').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const page_id = req.body.pageId;
        const checked = req.body.checked;

        update_page(page_id, checked)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/updateAdminPage', async function (req, res, next) {
  try {
    req.check('pageId', 'Invalid parameter PageId').exists();
    req.check('user', 'Invalid parameter user').exists();
    req.check('tag', 'Invalid parameter tag').exists();
    req.check('website', 'Invalid parameter website').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const page_id = req.body.pageId;
        const username = req.body.user;
        const tag = req.body.tag;
        const website = req.body.website;

        const type = await get_user_type(username);

        const success = await update_page_admin(page_id, type);

        if (type === 'studies') {
          //method to tag from selected page of studymonitor
          update_page_study_admin(page_id, username, tag, website)
            .catch(err => res.send(err));
        }

        res.send(success);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/updateAdminWebsite', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid parameter PageId').exists();
    req.check('cookie', 'User not logged in').exists();
    req.check('websiteName', 'No website name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const website_id = req.body.websiteId;
        const website_name = req.body.websiteName;

        update_website_admin(website_id, website_name)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/updateAdminTag', async function (req, res, next) {
  try {
    req.check('tagId', 'Invalid parameter TagId').exists();
    req.check('cookie', 'User not logged in').exists();
    req.check('tagName', 'No tag name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag_id = req.body.tagId;
        const tag_name = req.body.tagName;

        update_tag_admin(tag_id, tag_name)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/checkUpdateAdminTag', async function (req, res, next) {
  try {
    req.check('tagId', 'Invalid parameter PageId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag_id = req.body.tagId;

        verify_update_tag_admin(tag_id)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/checkupdateAdminWebsite', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid parameter PageId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const websiteId = req.body.websiteId;

        verify_update_website_admin(websiteId)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/updateObservatorio', async function (req, res, next) {
  try {
    req.check('pages', 'Invalid parameter Pages').exists();
    req.check('pagesId', 'Invalid parameter PagesId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const pages = JSON.parse(req.body.pages);
        const pages_id = JSON.parse(req.body.pagesId);

        update_observatory_pages(pages, pages_id)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/pages/delete', async function (req, res, next) {
  try {
    req.check('pages', 'Invalid parameter pages').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const pages = req.body.pages;

        delete_pages(pages)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/page/odf', async function (req, res, next) {
  try {
    req.check('odf', 'Invalid ODF').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const odf = req.body.odf;

      add_evaluation(odf)
        .then(success => res.send(success))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err)
    res.send(error(new ServerError(err)));
  }
});

module.exports = router;