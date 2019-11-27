'use strict';

/**
 * Admin Website Router and Controller
 */

const _ = require('lodash');
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
  verify_user
} = require('../../models/user');

const {
  get_all_websites,
  get_number_of_study_monitor_websites,
  get_number_of_my_monitor_websites,
  get_number_of_observatorio_websites,
  get_all_official_websites,
  get_all_websites_without_user,
  get_all_websites_without_entity,
  get_all_user_websites,
  get_all_tag_websites,
  get_all_entity_websites,
  get_website_current_domain,
  get_website_info,
  website_name_exists,
  create_website,
  update_website,
  delete_website,
  verify_update_website_admin
} = require('../../models/website');

const {
  domain_exists_in_admin
} = require('../../models/domain');

const {
  get_website_pages
} = require('../../models/page');

const { 
  re_evaluate_website_pages
} = require('../../models/evaluation');

router.post('/websites/allOfficial', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_official_websites()
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/user', async function (req, res, next) {
  try {
    req.check('user', 'Invalid user').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const user = req.body.user;

        let websites = await get_all_user_websites(user);
        for (let website of websites['result']) {
          website['imported'] = await verify_update_website_admin(website.WebsiteId);

          let websiteAdmin = await domain_exists_in_admin(website.WebsiteId);
          website['hasDomain'] = _.size(websiteAdmin) === 1;
          website['webName'] = undefined;

          if (_.size(websiteAdmin) === 1) {
            website['webName'] = websiteAdmin[0].Name;
          }
        }
        res.send(websites);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/studyTag', async function (req, res, next) {
  try {
    req.check('tag', 'Invalid tag').exists();
    req.check('user', 'Invalid user').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag = req.body.tag;
        const user = req.body.user;

        let websites = await get_all_tag_websites(user, tag);
        for (let website of websites['result']) {
          website['imported'] = await verify_update_website_admin(website.WebsiteId);

          let websiteAdmin = await domain_exists_in_admin(website.WebsiteId);
          website['hasDomain'] = _.size(websiteAdmin) === 1;
          website['webName'] = undefined;

          if (_.size(websiteAdmin) === 1) {
            website['webName'] = websiteAdmin[0].Name;
          }
        }
        res.send(websites);
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/tag', async function (req, res, next) {
  try {
    req.check('user', 'Invalid user').exists();
    req.check('tag', 'Invalid tag').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const user = req.body.user;
        const tag = req.body.tag;

        get_all_tag_websites(user, tag)
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/entity', async function (req, res, next) {
  try {
    req.check('entity', 'Invalid entity').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const entity = req.body.entity;

        get_all_entity_websites(entity)
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/info', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();
    req.check('websiteId', 'Invalid parameter WebsiteId').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const website_id = req.body.websiteId;

        get_website_info(website_id)
          .then(website => res.send(website))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/website/allPages', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid parameter WebsiteId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const website_id = req.body.websiteId;

        get_website_pages(website_id)
          .then(pages => res.send(pages))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/withoutUser', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_websites_without_user()
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/withoutEntity', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_websites_without_entity()
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.get('/websites/exists/:name', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const name = req.params.name;

      website_name_exists(name)
        .then(exists => res.send(exists))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/delete', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid parameter WebsiteId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const website_id = req.body.websiteId;

        delete_website(website_id)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/studies/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_study_monitor_websites()
          .then(total => res.send(total))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/monitor/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_my_monitor_websites()
          .then(total => res.send(total))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/observatorio/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_observatorio_websites()
          .then(total => res.send(total))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_websites()
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});


router.get('/websites/currentDomain/:websiteId', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid websiteId').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const websiteId = req.params.websiteId;
      get_website_current_domain(websiteId)
        .then(domain => res.send(domain))
        .catch(err => res.send(err));
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/create', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();
    req.check('domain', 'Invalid Domain').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const name = req.body.name;
        const domain = decodeURIComponent(req.body.domain);
        const entity_id = req.body.entityId;
        const app_user_id = req.body.userId;
        const tags = JSON.parse(req.body.tags);

        create_website(name, domain, entity_id, app_user_id, tags)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/websites/update', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid parameter WebsiteId').exists();
    req.check('name', 'Invalid parameter Name').exists();
    req.check('domain', 'Invalid parameter Domain').exists();
    req.check('entityId', 'Invalid parameter EntityId').exists();
    req.check('userId', 'Invalid parameter UserId').exists();
    req.check('olderUserId', 'Invalid parameter OlderUserId').exists();
    req.check('transfer', 'Invalid parameter Transfer').exists();
    req.check('defaultTags', 'Invalid parameter DefaultTags').exists();
    req.check('tags', 'Invalid parameter Tags').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const website_id = req.body.websiteId;
        const name = req.body.name;
        const entity_id = req.body.entityId;
        const edit_user_id = req.body.userId;
        const older_user_id = req.body.olderUserId;
        const transfer = req.body.transfer === 'true';
        const default_tags = JSON.parse(req.body.defaultTags);
        const tags = JSON.parse(req.body.tags);

        update_website(website_id, name, entity_id, edit_user_id, older_user_id, transfer, default_tags, tags)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err)));
  }
});

router.post('/website/reEvaluate', async function (req, res, next) {
  try {
    req.check('domainId', 'Invalid DomainId').exists();
    req.check('option', 'Invalid Option').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const domain_id = req.body.domainId;
        const option = req.body.option;

        re_evaluate_website_pages(domain_id, option);
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

module.exports = router;