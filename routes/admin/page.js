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

router.post('/page/evaluate', async function (req, res, next) {
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

                evaluate_url_and_save(page_id.result, url, "10")
                    .then(evaluation => res.send(evaluation))
                    .catch(err => res.send(err));
            }
        }
    } catch (err) {
        console.log(err)
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

router.post('/pages/website', async function (req, res, next) {
    try {
        req.check('tag', 'Invalid tag').exists();
        req.check('user', 'Invalid user').exists();
        req.check('website', 'Invalid Website').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const tag = req.body.tag;
                const user = req.body.user;
                const website = req.body.website;

                const user_id = await get_user_id(user);

                if (tag !== 'null') {
                    get_study_monitor_user_tag_website_pages(user_id, tag, website)
                        .then(pages => res.send(pages))
                        .catch(err => re.send(err));
                } else {
                    get_my_monitor_user_website_pages(user_id, website)
                        .then(pages => res.send(pages))
                        .catch(err => re.send(err));
                }
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

                get_all_domain_pages(user, type, domain, flags)
                    .then(pages => res.send(pages))
                    .catch(err => re.send(err));
            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

router.post('/pages/create', async function (req, res, next) {
    try {
        req.check('domainId', 'Invalid DomainId').exists();
        req.check('uris', 'Invalid Uris').exists();
        req.check('observatorio', 'Invalid Observatory Uris').exists();
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

                create_pages(domain_id, uris, observatorio_uris, '100')
                    .then(success => res.send(success))
                    .catch(err => res.send(err));
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

router.post('/pages/updateAdminPage', async function (req, res, next) {
    try {
        req.check('pageId', 'Invalid parameter PageId').exists();
        req.check('user', 'Invalid parameter user').exists();
        req.check('tag', 'Invalid parameter tag').exists();
        req.check('website', 'Invalid parameter website').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const page_id = req.body.pageId;
                const username = req.body.user;
                const tag = req.body.tag;
                const website = req.body.website;

                const type = await get_user_type(username);

                const success = await update_page_admin(page_id, type)
                    .catch(err => res.send(err));

                if (type === 'studies') {
                    //method to tag from selected page of studymonitor
                    update_page_study_admin(page_id, username, tag, website)
                        .catch(err => res.send(res));
                }

                res.send(success);

            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

router.post('/pages/updateAdminWebsite', async function (req, res, next) {
    try {
        req.check('websiteId', 'Invalid parameter PageId').exists();
        req.check('cookie', 'User not logged in').exists();
        req.check('websiteName', 'No website name').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const websiteId = req.body.websiteId;
                const websiteName = req.body.websiteName;

                update_website_admin(websiteId, websiteName)
                    .then(success => res.send(success))
                    .catch(err => res.send(res));

            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

router.post('/pages/updateAdminTag', async function (req, res, next) {
    try {
        req.check('tagId', 'Invalid parameter TagId').exists();
        req.check('cookie', 'User not logged in').exists();
        req.check('tagName', 'No tag name').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const tag_id = req.body.tagId;
                const tagName = req.body.tagName;

                update_tag_admin(tag_id, tagName)
                    .then(success => res.send(success))
                    .catch(err => res.send(res));

            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});


router.post('/pages/checkUpdateAdminTag', async function (req, res, next) {
    try {
        req.check('tagId', 'Invalid parameter PageId').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const tag_id = req.body.tagId;

                verify_update_tag_admin(tag_id)
                    .then(success => res.send(success))
                    .catch(err => res.send(res));

            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

router.post('/pages/checkupdateAdminWebsite', async function (req, res, next) {
    try {
        req.check('websiteId', 'Invalid parameter PageId').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const websiteId = req.body.websiteId;

                verify_update_website_admin(websiteId)
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
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const pages = JSON.parse(req.body.pages);
                const pages_id = JSON.parse(req.body.pagesId);

                update_observatory_pages(pages, pages_id)
                    .then(success => res.send(success))
                    .catch(err => res.send(err));
            }
        }
    } catch (err) {
        console.log(err);
        res.send(error(new ServerError(err)));
    }
});

router.post('/pages/delete', async function (req, res, next) {
    try {
        req.check('pages', 'Invalid parameter pages').exists();
        req.check('cookie', 'User not logged in').exists();

        const errors = req.validationErrors();
        if (errors) {
            res.send(error(new ParamsError(errors)));
        } else {
            const user_id = await verify_user(res, req.body.cookie, true);
            if (user_id !== -1) {
                const pages = req.body.pages;

                delete_pages(pages)
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
