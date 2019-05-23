'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../../lib/_error');
const { error } = require('../../lib/_response');
const { verify_user } = require('../../models/user');


const {
    get_study_monitor_user_tag_websites,
    get_study_monitor_user_tag_websites_data,
    add_study_monitor_user_tag_new_website,
    add_study_monitor_user_tag_existing_website,
    study_monitor_user_tag_website_name_exists,
    remove_study_monitor_user_tag_websites
} = require('../../models/website');


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



module.exports = router;
