'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../../lib/_error');
const { error } = require('../../lib/_response');
const { verify_user} = require('../../models/user');
const {  get_my_monitor_user_website_domain } = require('../../models/website');


router.post('/user/website/domain', async function(req, res, next) {
    try {
        req.check('website', 'Invalid website parameter').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, false);
            if (user_id !== -1) {
                const website = req.body.website;

                get_my_monitor_user_website_domain(user_id, website)
                    .then(domain => res.send(domain))
                    .catch(err => res.send(err));
            }
        }
    } catch (err) {
        res.send(error(new ServerError(err)));
    }
});

module.exports = router;
