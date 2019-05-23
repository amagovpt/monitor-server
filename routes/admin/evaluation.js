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
    get_all_page_evaluations,
    delete_evaluation
} = require('../../models/evaluation');


router.post('/evaluations/page', async function (req, res, next) {
    try {
        req.check('page', 'Invalid page').exists();
        req.check('type', 'Invalid type').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const page = decodeURIComponent(req.body.page);
                const type = req.body.type;


                get_all_page_evaluations(page, type)
                    .then(evaluations => res.send(evaluations))
                    .catch(err => re.send(err));
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
                    .catch(err => res.send(err));
            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

module.exports = router;
