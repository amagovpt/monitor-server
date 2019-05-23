
'use strict';

const express = require('express');
const router = express.Router();
const { ServerError, ParamsError } = require('../../lib/_error');
const { error } = require('../../lib/_response');
const { verify_user, change_user_password } = require('../../models/user');



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

