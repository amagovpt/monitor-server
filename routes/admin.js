'use strict';

/**
 * Admin Router and Controller
 */

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../lib/_error');
const { error } = require('../lib/_response');

const { 
  verify_user,
  get_user_type,
  get_number_of_access_studies_users,
  get_number_of_my_monitor_users,
  get_all_users,
  get_all_monitor_users,
  create_user,
  user_exists,
  get_user_info,
  update_user,
  delete_user
} = require('../models/user');

const {
  get_number_of_access_studies_tags,
  get_number_of_observatorio_tags,
  get_all_tags,
  get_all_official_tags,
  tag_official_name_exists,
  create_official_tag,
  get_tag_info,
  update_tag,
  copy_tag,
  delete_tag
} = require('../models/tag');

const {
  get_all_entities,
  get_entity_info,
  entity_short_name_exists,
  entity_long_name_exists,
  create_entity,
  update_entity,
  delete_entity
} = require('../models/entity');

const {
  get_all_websites,
  get_number_of_access_studies_websites,
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
  delete_website
} = require('../models/website');

const {
  get_all_domains,
  get_all_official_domains,
  get_all_website_domains,
  domain_exists,
  create_domain,
  delete_domain
} = require('../models/domain');

const {
  get_page_id,
  get_all_pages,
  get_all_domain_pages,
  get_website_pages,
  create_pages,
  update_page,
  update_page_admin,
  update_observatorio_pages,
  delete_page
} = require('../models/page');

const {
  evaluate_url_and_save,
  get_all_page_evaluations,
  get_evaluation,
  delete_evaluation
} =  require('../models/evaluation');

/**
 * GET
 */

router.post('/users/studies/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_access_studies_users()
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

router.post('/tags/studies/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_access_studies_tags()
          .then(total => res.send(total))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/observatorio/total', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_number_of_observatorio_tags()
          .then(total => res.send(total))
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
        get_number_of_access_studies_websites()
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
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_tags()
          .then(tags => res.send(tags))
          .catch(res => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/allOfficial', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_official_tags()
          .then(tags => res.send(tags))
          .catch(res => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/info', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();
    req.check('tagId', 'Invalid parameter TagId').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag_id = req.body.tagId;

        get_tag_info(tag_id)
          .then(tag => res.send(tag))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

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

        get_all_user_websites(user)
          .then(websites => res.send(websites))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/websites/tag', async function (req, res, next) {
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
          .catch(err => res.send(res));
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
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/domains/all', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_domains()
          .then(domains => res.send(domains))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/domains/website', async function (req, res, next) {
  try {
    req.check('user', 'Invalid user').exists();
    req.check('website', 'Invalid website').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const user = req.body.user;
        const website = req.body.website;

        get_all_website_domains(user, website)
          .then(domains => res.send(domains))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
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

        //TODO acabar isto mas.. e o studymonitor?
        const type = await get_user_type(user_id);
        let flags;
        switch (type) {
          case 'nidma':
            flags = '100';
            break;
          case 'monitor':
            flags = '010';
        }

        //TODO meter flags como argumento deste metodo?
        get_all_domain_pages(user, domain)
          .then(pages => res.send(pages))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/evaluations/page', async function (req, res, next) {
  try {
    req.check('page', 'Invalid page').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const user = req.body.user;
        const page = decodeURIComponent(req.body.page);

        get_all_page_evaluations(page,"10")
          .then(evaluations => res.send(evaluations))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

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

router.post('/page/evaluate', async function(req, res, next) {
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
        
        evaluate_url_and_save(page_id.result, url,"10")
          .then(evaluation => res.send(evaluation))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err)
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

router.post('/domains/allOfficial', async function (req, res, next) {
  try {
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        get_all_official_domains()
          .then(domains => res.send(domains))
          .catch(err => re.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.get('/users/exists/:email', async function (req, res, next) {
  try {
    req.check('email', 'Invalid Email').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const email = req.params.email;
      user_exists(email)
        .then(exists => res.send(exists))
        .catch(err => res.send(err)); 
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.get('/tags/exists/:name', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const name = req.params.name;
      tag_official_name_exists(name)
        .then(exists => res.send(exists))
        .catch(err => res.send(err)); 
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

router.get('/domains/exists/:domain', async function (req, res, next) {
  try {
    req.check('domain', 'Invalid Domain').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const domain = decodeURIComponent(req.params.domain);
      domain_exists(domain)
        .then(exists => res.send(exists))
        .catch(err => res.send(err)); 
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

/**
 * CREATE
 */

router.post('/users/create', async function (req, res, next) {
  try {
    req.check('username', 'Invalid Username').exists();
    req.check('password', 'Invalid Password').exists();
    req.check('confirmPassword', 'Invalid Password Confirmation').exists().equals(req.body.password);
    req.check('names', 'Inavlid Contact Names').exists();
    req.check('emails', 'Inavlid Contact E-mails').exists();
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
        const transfer = req.body.transfer;
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

router.post('/tags/create', async function (req, res, next) {
  try {
    req.check('name', 'Invalid Name').exists();
    req.check('observatorio', 'Invalid Observatorio').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const name = req.body.name;
        const observatorio = req.body.observatorio;
        const websites = JSON.parse(req.body.websites);

        create_official_tag(name, observatorio, websites)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

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
        const user_id = req.body.userId;
        const tags = JSON.parse(req.body.tags);

        create_website(name, domain, entity_id, user_id, tags)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/domains/create', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid WebsiteId').exists();
    req.check('url', 'Invalid Url').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const website_id = req.body.websiteId;
        const url = decodeURIComponent(req.body.url);

        create_domain(website_id, url)
          .then(success => res.send(success))
          .catch(err => res.send(err));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});
//AQUI
router.post('/pages/create', async function (req, res, next) {
  try {
    req.check('domainId', 'Invalid DomainId').exists();
    req.check('uris', 'Invalid Uris').exists();
    req.check('observatorio', 'Invalid Observaotrio Uris').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const domain_id = req.body.domainId;
        const uris = JSON.parse(req.body.uris);
        const observatorio_uris = JSON.parse(req.body.observatorio);

        create_pages(domain_id, uris, observatorio_uris,"100")
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
        const websites = JSON.parse(req.body.websites);

        update_user(edit_user_id, password, names, emails, app, default_websites, websites)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/update', async function (req, res, next) {
  try {
    req.check('tagId', 'Invalid parameter TagId').exists();
    req.check('name', 'Invalid parameter Name').exists();
    req.check('observatorio', 'Invalid parameter Observatorio').exists();
    req.check('defaultWebsites', 'Invalid parameter DefaultWebsites').exists();
    req.check('websites', 'Invalid parameter Websites').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag_id = req.body.tagId;
        const name = req.body.name;
        const observatorio = req.body.observatorio;
        const default_websites = JSON.parse(req.body.defaultWebsites);
        const websites = JSON.parse(req.body.websites);

        update_tag(tag_id, name, observatorio, default_websites, websites)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/update/copy', async function (req, res, next) {
  try {
    req.check('tagId', 'Invalid parameter TagId').exists();
    req.check('name', 'Invalid parameter Name').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag_id = req.body.tagId;
        const name = req.body.name;

        copy_tag(tag_id, name)
          .then(success => res.send(success))
          .catch(err => res.send(res));
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

router.post('/websites/update', async function (req, res, next) {
  try {
    req.check('websiteId', 'Invalid parameter WebsiteId').exists();
    req.check('name', 'Invalid parameter Name').exists();
    req.check('domain', 'Invalid parameter Domain').exists();
    req.check('entityId', 'Invalid parameter EntityId').exists();
    req.check('userId', 'Invalid parameter UserId').exists();
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
        const default_tags = JSON.parse(req.body.defaultTags);
        const tags = JSON.parse(req.body.tags);

        update_website(website_id, name, entity_id, edit_user_id, default_tags, tags)
          .then(success => res.send(success))
          .catch(err => res.send(res));
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
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/pages/updateAdmin', async function (req, res, next) {
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

        update_page_admin(page_id, checked)
          .then(success => res.send(success))
          .catch(err => res.send(res));
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
     // const user_id = await verify_user(res, req.body.cookie, true);
      //if (user_id !== -1) {
        const pages = JSON.parse(req.body.pages);
        const pages_id = JSON.parse(req.body.pagesId);

        update_observatorio_pages(pages, pages_id)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    //}
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

/**
 * DELETE
 */

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
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/tags/delete', async function (req, res, next) {
  try {
    req.check('tagId', 'Invalid parameter EntityId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const tag_id = req.body.tagId;

        delete_tag(tag_id)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

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
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/domains/delete', async function (req, res, next) {
  try {
    req.check('domainId', 'Invalid parameter DomainId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const domain_id = req.body.domainId;

        delete_domain(domain_id)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/pages/delete', async function (req, res, next) {
  try {
    req.check('pageId', 'Invalid parameter PageId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const page_id = req.body.pageId;

        delete_page(page_id,"101")
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

router.post('/evaluations/delete', async function (req, res, next) {
  try {
    req.check('evaluationId', 'Invalid parameter EvaluationId').exists();
    req.check('cookie', 'User not logged in').exists();

    const errors = req.validationErrors();
    if (errors) {
      res.send(error(new ParamsError(errors)));
    } else {
      const user_id = await verify_user(res, req.body.cookie, true);
      if (user_id !== -1) {
        const evaluation_id = req.body.evaluationId;

        delete_evaluation(evaluation_id)
          .then(success => res.send(success))
          .catch(err => res.send(res));
      }
    }
  } catch (err) {
    console.log(err);
    res.send(error(new ServerError(err))); 
  }
});

module.exports = router;
