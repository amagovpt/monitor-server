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
    verify_user
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
    verify_update_tag_admin,
    get_all_user_tags
} = require('../../models/tag');

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



router.post('/tags/studies/total', async function (req, res, next) {
    try {
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                get_number_of_study_monitor_tags()
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

router.post('/tags/user', async function (req, res, next) {
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

                let tags = await get_all_user_tags(user);

                for (let tag of tags["result"]) {
                    tag["imported"] = await verify_update_tag_admin(tag.TagId);
                    //tag["Website"] = console.log(tag);
                }

                res.send(tags);
            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

module.exports = router;
