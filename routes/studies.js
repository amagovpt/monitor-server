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
  get_all_official_tags,
  create_user_tag, 
  get_access_studies_user_tags,
  user_tag_name_exists,
  user_remove_tags
} = require('../models/tag');

const { 
  get_access_studies_user_tag_websites,
  get_access_studies_user_tag_websites_data,
  add_access_studies_user_tag_new_website,
  add_access_studies_user_tag_existing_website,
  access_studies_user_tag_website_name_exists,
  access_studies_user_tag_website_domain_exists,
  get_access_studies_user_tag_website_domain,
  remove_access_studies_user_tag_websites,
  get_access_studies_user_websites_from_other_tags
} = require('../models/website');

const { 
  get_access_studies_user_tag_website_pages,
  get_access_studies_user_tag_website_pages_data,
  add_access_studies_user_tag_website_pages,
  remove_access_studies_user_tag_website_pages
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
        get_access_studies_user_tags(user_id)
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

        get_access_studies_user_tag_websites(user_id, tag)
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

        get_access_studies_user_tag_websites_data(user_id, tag)
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

        get_access_studies_user_tag_website_pages(user_id, tag, website)
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

        get_access_studies_user_tag_website_pages_data(user_id, tag, website)
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

        access_studies_user_tag_website_name_exists(user_id, tag, name)
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

        access_studies_user_tag_website_domain_exists(user_id, tag, domain)
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

        get_access_studies_user_tag_website_domain(user_id, tag, website)
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

        add_access_studies_user_tag_existing_website(user_id, tag, websitesId)
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

        add_access_studies_user_tag_new_website(user_id, tag, name, domain, pages)
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

        add_access_studies_user_tag_website_pages(user_id, tag, website, domain, pages)
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
        const websitesId = split(req.body.websitesId, ',');

        remove_access_studies_user_tag_websites(user_id, tag, websitesId)
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
        const pagesId = split(req.body.pagesId, ',');
        
        remove_access_studies_user_tag_website_pages(user_id, tag, website, pagesId)
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

        get_access_studies_user_websites_from_other_tags(user_id, tag)
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