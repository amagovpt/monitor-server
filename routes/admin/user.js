'use strict';

/**
 * Admin Router and Controller
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
    get_user_type,
    get_user_type_success,
    get_user_id
} = require('../../models/user');

const {
    get_number_of_study_monitor_tags,
    get_number_of_observatorio_tags,
    get_all_tags,
    get_all_official_tags,
    tag_official_name_exists,
    create_official_tag,
    get_tag_info,
    update_tag,
    copy_tag,
    delete_tag,
    update_tag_admin,
    verify_update_tag_admin,
    get_all_user_tags
} = require('../../models/tag');

const {
    get_all_entities,
    get_entity_info,
    entity_short_name_exists,
    entity_long_name_exists,
    create_entity,
    update_entity,
    delete_entity
} = require('../../models/entity');

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
    update_website_admin,
    verify_update_website_admin
} = require('../../models/website');

const {
    get_all_domains,
    get_all_official_domains,
    get_all_website_domains,
    domain_exists,
    domain_exists_in_admin,
    create_domain,
    update_domain,
    delete_domain
} = require('../../models/domain');

const {
    get_page_id,
    get_all_pages,
    get_all_domain_pages,
    get_website_pages,
    create_pages,
    update_page,
    update_page_admin,
    update_page_study_admin,
    delete_pages,
    get_urls,
    get_study_monitor_user_tag_website_pages,
    get_my_monitor_user_website_pages,
    update_observatory_pages
} = require('../../models/page');

const {
    evaluate_url_and_save,
    get_all_page_evaluations,
    get_evaluation,
    delete_evaluation
} = require('../../models/evaluation');




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
                    .catch(err => res.send(res));
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
                    .catch(err => res.send(res));
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
                    .catch(err => res.send(res));
            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

module.exports = router;
