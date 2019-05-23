
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
    error
} = require('../../lib/_response');

const {
    verify_user,
    get_user_type
} = require('../../models/user');




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
                get_all_website_domains(user, type, website, flags)
                    .then(domains => res.send(domains))
                    .catch(err => re.send(err));
            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

router.post('/domains/existsAdmin/:websiteid', async function (req, res, next) {
    try {
        req.check('websiteId', 'Invalid WebsiteID').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const wId = decodeURIComponent(req.params.websiteid);
            domain_exists_in_admin(wId)
                .then(exists => res.send(exists))
                .catch(err => res.send(err));
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



router.post('/domains/update', async function (req, res, next) {
    try {
        req.check('domainId', 'Invalid parameter DomainId').exists();
        req.check('url', 'Invalid parameter Url').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const domain_id = req.body.domainId;
                const url = decodeURIComponent(req.body.url);

                update_domain(domain_id, url)
                    .then(success => res.send(success))
                    .catch(err => res.send(err));
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

module.exports = router;
