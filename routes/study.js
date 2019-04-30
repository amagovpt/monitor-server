'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');
const { verify_user, change_user_password } = require('../models/user');
const { get_page_id } = require('../models/page');
const { evaluate_url_and_save, get_newest_evaluation } = require('../models/evaluation');

const {
  get_all_official_tags,
  create_user_tag, 
  get_study_monitor_user_tags,
  user_tag_name_exists,
  user_remove_tags
} = require('../models/tag');

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
} = require('../models/website');

const { 
  get_study_monitor_user_tag_website_pages,
  get_study_monitor_user_tag_website_pages_data,
  add_study_monitor_user_tag_website_pages,
  remove_study_monitor_user_tag_website_pages
} = require('../models/page');

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
          .catch(res => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/user/tags', async function(req, res, next) {
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
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/websites', async function(req, res, next) {
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

        get_study_monitor_user_tag_websites(user_id, tag)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/websitesData', async function(req, res, next) {
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

        get_study_monitor_user_tag_websites_data(user_id, tag)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/pages', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;

        get_study_monitor_user_tag_website_pages(user_id, tag, website)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/pagesData', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;

        get_study_monitor_user_tag_website_pages_data(user_id, tag, website)
          .then(pages => res.send(pages))
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

router.post('/user/tag/website/nameExists', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('name', 'Invalid name parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const name = req.body.name;

        study_monitor_user_tag_website_name_exists(user_id, tag, name)
          .then(exists => res.send(exists))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/domainExists', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('domain', 'Invalid domain parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const domain = req.body.domain;

        study_monitor_user_tag_website_domain_exists(user_id, tag, domain)
          .then(exists => res.send(exists))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/domain', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;

        get_study_monitor_user_tag_website_domain(user_id, tag, website)
          .then(domain => res.send(domain))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/addExistingWebsite', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('websitesId', 'Invalid websitesId parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const websitesId = JSON.parse(req.body.websitesId);

        add_study_monitor_user_tag_existing_website(user_id, tag, websitesId)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/addNewWebsite', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('name', 'Invalid name parameter').exists();
    req.check('domain', 'Invalid domain parameter').exists();
    req.check('pages', 'Invalid pages parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const name = req.body.name;
        const domain = req.body.domain;
        const pages = JSON.parse(req.body.pages);

        add_study_monitor_user_tag_new_website(user_id, tag, name, domain, pages)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/addPages', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
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
        const tag = req.body.tag;
        const website = req.body.website;
        const domain = req.body.domain;
        const pages = JSON.parse(req.body.pages);

        add_study_monitor_user_tag_website_pages(user_id, tag, website, domain, pages)
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

router.post('/user/tag/removeWebsites', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('websitesId', 'Invalid websitesId parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const websites_id = JSON.parse(req.body.websitesId);

        remove_study_monitor_user_tag_websites(user_id, tag, websites_id)
          .then(websites => res.send(websites))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/tag/website/removePages', async function(req, res, next) {
  try {
    req.check('tag', 'Invalid tag parameter').exists();
    req.check('website', 'Invalid website parameter').exists();
    req.check('pagesId', 'Invalid pagesId parameter').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, false);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const website = req.body.website;
        const pages_id = JSON.parse(req.body.pagesId);
        
        remove_study_monitor_user_tag_website_pages(user_id, tag, website, pages_id)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/user/websites/otherTags', async function(req, res, next) {
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
