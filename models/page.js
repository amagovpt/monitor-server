'use strict';

/**
 * Page Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const {
  success,
  error
} = require('../lib/_response');
const {
  execute_query
} = require('../lib/_database');
const Crawler = require('simplecrawler');

const {
  evaluate_url,
  save_page_evaluation
} = require('./evaluation');

module.exports.create_pages = async (domain_id, uris, observatorio_uris) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let pagesId = [];
    const errors = {};

    for (let u of uris) {
      u = _.replace(u, 'https://', '');
      u = _.replace(u, 'http://', '');
      u = _.replace(u, 'www.', '');
      u = decodeURIComponent(u);

      let query = `SELECT PageId, Show_In FROM Page WHERE LOWER(Uri) = "${_.toLower(u)}" LIMIT 1`;
      let page = await execute_query(query);

      if (_.size(page) > 0) {
        query = `SELECT * FROM DomainPage WHERE DomainId = "${domain_id}" AND PageId = "${page[0].PageId}" LIMIT 1`;
        let domain_page = await execute_query(query);
        if (_.size(domain_page) === 0) {
          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain_id}", "${page[0].PageId}")`;
          await execute_query(query);
          pagesId.push(page[0].PageId);
        }
        let show = null;

        if (_.includes(observatorio_uris, u)) {
          if (page[0].Show_In === 'none') {
            show = 'observatorio';
          } else if (page[0].Show_In === 'user') {
            show = 'both';
          }
        } else {
          show = page[0].Show_In;
        }

        if (!_.includes(['none', 'user', 'observatorio', 'both'], show)) {
          show = 'none';
        }

        query = `UPDATE Page SET Show_In = "${show}" WHERE PageId = "${page[0].PageId}"`;
        await execute_query(query);
      } else {
        let show = null;

        if (_.includes(observatorio_uris, u)) {
          show = 'observatorio';
        } else {
          show = 'none';
        }

        if (!_.includes(['none', 'user', 'observatorio', 'both'], show)) {
          show = 'none';
        }

        let evaluation = null;
        try {
          evaluation = await evaluate_url(u, 'examinator');
        } catch (e) {
          errors[u] = -1;
        }

        if (evaluation !== null && evaluation.result !== null) {
          query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${u}", "${show}", "${date}")`;
          let newPage = await execute_query(query);

          await save_page_evaluation(newPage.insertId, evaluation);

          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain_id}", "${newPage.insertId}")`;
          await execute_query(query);
          pagesId.push(newPage.insertId);
        } else {
          errors[u] = -1;
        }
      }
    }

    if (_.size(_.keys(errors)) > 0) {
      return error({
        code: 0,
        message: 'SOME_PAGES_ERRORS',
        err: errors
      }, pagesId);
    } else {
      return success(pagesId);
    }
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_page_id = async (url) => {
  try {
    const query = `SELECT PageId FROM Page WHERE LOWER(Uri) = "${_.toLower(url)}"`;

    const page = await execute_query(query);
    return success(page[0].PageId);
  } catch (err) {
    return error(err);
  }
}

module.exports.get_all_pages = async () => {
  try {
    const query = `SELECT p.*, e.Score, e.Evaluation_Date FROM Page as p
      LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
        SELECT Evaluation_Date FROM Evaluation 
        WHERE PageId = p.PageId 
        ORDER BY Evaluation_Date DESC LIMIT 1
      ) GROUP BY p.PageId, e.Score, e.Evaluation_Date`;

    const pages = await execute_query(query);
    return success(pages);
  } catch (err) {
    return error(err);
  }
}

module.exports.get_website_pages = async (website_id) => {
  try {
    let query = `SELECT p.PageId, p.Uri, p.Show_In
    FROM
      Domain as d,
      DomainPage as dp,
      Page as p
    WHERE
      d.WebsiteId = "${website_id}" AND
      d.Active = "1" AND
      dp.DomainId = d.DomainId AND
      p.PageId = dp.PageId`;
    const pages = await execute_query(query);

    return success(pages);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_domain_pages = async (user, domain) => {
  try {
    let query = '';
    if (user === 'admin') {
      query = `SELECT 
          p.*,
          e.A,
          e.AA,
          e.AAA,
          e.Score,
          e.Errors,
          e.Evaluation_Date 
        FROM 
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId 
            ORDER BY Evaluation_Date DESC LIMIT 1
          ),
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp
        WHERE
          (
            LOWER(u.Type) = "monitor" AND
            w.UserId = u.UserId AND
            d.WebsiteId = w.WebsiteId AND
            LOWER(d.Url) = "${_.toLower(domain)}" AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId
          )
          OR
          (
            w.UserId IS NULL AND
            d.WebsiteId = w.WebsiteId AND
            LOWER(d.Url) = "${_.toLower(domain)}" AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId
          )
        GROUP BY p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Evaluation_Date`;
    } else {
      query = `SELECT 
          p.*,
          e.A,
          e.AA,
          e.AAA,
          e.Score,
          e.Errors,
          e.Evaluation_Date 
        FROM 
          Page as p
          LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId 
            ORDER BY Evaluation_Date DESC LIMIT 1
          ),
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp
        WHERE
          LOWER(u.Username) = "${_.toLower(user)}" AND
          w.UserId = u.UserId AND
          d.WebsiteId = w.WebsiteId AND
          LOWER(d.Url) = "${_.toLower(domain)}" AND
          dp.DomainId = d.DomainId AND
          p.PageId = dp.PageId
        GROUP BY p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Evaluation_Date`;
    }

    const pages = await execute_query(query);
    return success(pages);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_pages_info = async () => {
  try {
    const query = `
      SELECT 
        p.PageId,
        p.Uri,
        w.Name as Website,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date,
        COUNT(distinct tp.TagId) as Tags
      FROM 
        Page as p
        LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
          SELECT Evaluation_Date FROM Evaluation 
          WHERE PageId = p.PageId 
          ORDER BY Evaluation_Date DESC LIMIT 1
        )
        LEFT OUTER JOIN TagPage tp ON tp.PageId = p.PageId,
        Domain as d,
        Website as w
      WHERE 
        d.DomainId = p.DomainId AND
        w.WebsiteId = d.WebsiteId
      GROUP BY p.PageId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date`;

    const pages = await execute_query(query);
    return success(pages);
  } catch (err) {
    return error(err);
  }
}

module.exports.get_user_website_pages = async (user_id, website_id) => {
  try {
    const query = `SELECT 
        distinct p.*,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Website as w,
        Domain as d,
        User as u,
        Evaluation as e
      WHERE
        w.WebsiteId = "${website_id}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        p.DomainId = d.DomainId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);
    return success(pages);
  } catch (err) {
    return error(err);
  }
}

/**
 * Observatory
 */

module.exports.get_observatory_data = async () => {
  try {
    const query = `
      SELECT
        e.EvaluationId,
        e.Title,
        e.Score,
        e.Errors,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date,
        p.PageId,
        p.Uri,
        p.Creation_Date as Page_Creation_Date,
        d.Url,
        w.WebsiteId,
        w.Name as Website_Name,
        w.Creation_Date as Website_Creation_Date,
        en.Long_Name as Entity_Name,
        t.TagId,
        t.Name as Tag_Name,
        t.Show_in_Observatorio,
        t.Creation_Date as Tag_Creation_Date
      FROM
        Page as p
        LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
            SELECT Evaluation_Date FROM Evaluation 
            WHERE PageId = p.PageId 
            ORDER BY Evaluation_Date DESC LIMIT 1
        ),
        DomainPage as dp,
        Domain as d,
        Website as w
        LEFT OUTER JOIN Entity as en ON en.EntityId = w.EntityId,
        TagWebsite as tw,
        Tag as t
      WHERE
        t.Show_in_Observatorio = 1 AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        (p.Show_In = "both" || p.Show_In = "observatorio")`;

    const data = await execute_query(query);
    return success(data);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

/**
 * MY MONITOR
 */

module.exports.get_my_monitor_user_website_pages = async (user_id, website) => {
  try {
    let query = `SELECT * FROM Website WHERE UserId = "${user_id}" AND Name = "${website}" LIMIT 1`;
    const websiteExist = await execute_query(query);

    if (_.size(websiteExist) === 0) {
      return error({
        code: -1,
        message: 'USER_WEBSITE_INEXISTENT',
        err: null
      });
    }

    query = `SELECT 
        distinct p.*,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Errors,
        e.Evaluation_Date
      FROM 
        Page as p,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Evaluation as e
      WHERE
        LOWER(w.Name) = "${_.toLower(website)}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        (LOWER(p.Show_In) = "user" OR LOWER(p.Show_In) = "both") AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.add_my_monitor_user_website_pages = async (user_id, website, domain, pages) => {
  try {
    const errors = {};
    const size = _.size(pages);
    for (let i = 0; i < size; i++) {
      let query = `SELECT PageId, Show_In FROM Page WHERE Uri = "${decodeURIComponent(pages[i])}" LIMIT 1`;
      let page = await execute_query(query);

      if (_.size(page) > 0) {
        query = `SELECT 
            dp.* 
          FROM
            Website as w,
            Domain as d,
            DomainPage as dp
          WHERE 
            LOWER(w.Name) = "${_.toLower(website)}" AND
            w.UserId = "${user_id}" AND
            d.WebsiteId = w.WebsiteId AND
            dp.DomainId = d.DomainId AND
            dp.PageId = "${page[0].PageId}"`;

        let domainPage = await execute_query(query);
        if (_.size(domainPage) === 0) {
          query = `INSERT INTO DomainPage (DomainId, PageId) 
            SELECT 
              d.DomainId, 
              "${page[0].PageId}" 
            FROM
              Website as w,
              Domain as d
            WHERE 
              LOWER(w.Name) = "${_.toLower(website)}" AND
              w.UserId = "${user_id}" AND
              d.WebsiteId = w.WebsiteId AND
              d.Url = "${domain}" AND
              d.Active = 1`;
          await execute_query(query);
        }

        if (page[0].Show_In === 'none') {
          query = `UPDATE Page SET Show_In = "user" WHERE PageId = "${page[0].PageId}"`;
          await execute_query(query);
        } else if (page[0].Show_In === 'observatorio') {
          query = `UPDATE Page SET Show_In = "both" WHERE PageId = "${page[0].PageId}"`;
          await execute_query(query);
        }
      } else {
        let evaluation = null;
        try {
          evaluation = await evaluate_url(pages[i], 'examinator');
        } catch (e) {
          errors[pages[i]] = -1;
        }

        if (evaluation !== null && evaluation.result !== null) {
          let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
          query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${decodeURIComponent(pages[i])}", "user", "${date}")`;
          let newPage = await execute_query(query);

          await save_page_evaluation(newPage.insertId, evaluation);

          query = `INSERT INTO DomainPage (DomainId, PageId) 
            SELECT 
              d.DomainId, 
              "${newPage.insertId}" 
            FROM
              Website as w,
              Domain as d
            WHERE 
              LOWER(w.Name) = "${_.toLower(website)}" AND
              w.UserId = "${user_id}" AND
              d.WebsiteId = w.WebsiteId AND
              LOWER(d.Url) = "${_.toLower(domain)}" AND
              d.Active = 1`;
          await execute_query(query);
        } else {
          errors[pages[i]] = -1;
        }
      }
    }

    const newPages = await this.get_my_monitor_user_website_pages(user_id, website);

    if (_.size(_.keys(errors)) > 0) {
      return error({
        code: 0,
        message: 'SOME_PAGES_ERRORS',
        err: errors
      }, newPages.result);
    } else {
      return newPages;
    }
  } catch (err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.remove_my_monitor_user_website_pages = async (user_id, website, pages_id) => {
  try {
    for (let id of pages_id) {
      let query = `SELECT Show_In FROM Page WHERE PageId = "${id}" LIMIT 1`;
      let page = await execute_query(query);
      if (_.size(page) > 0) {
        if (page[0].Show_In === 'user') {
          query = `UPDATE Page SET Show_In = "none" WHERE PageId = "${id}"`;
          await execute_query(query);
        } else if (page[0].Show_In === 'both') {
          query = `UPDATE Page SET Show_In = "observatorio" WHERE PageId = "${id}"`;
          await execute_query(query);
        }
      }
    }

    return this.get_my_monitor_user_website_pages(user_id, website);
  } catch (err) {
    console.log(err);
    throw error(err);
  }
}

/**
 * ACCESS STUDIES
 */

module.exports.get_access_studies_user_tag_website_pages = async (user_id, tag, website) => {
  try {
    let query = `SELECT * FROM Website WHERE UserId = "${user_id}" AND LOWER(Name) = "${_.toLower(website)}" LIMIT 1`;
    const websiteExists = await execute_query(query);

    if (_.size(websiteExists) === 0) {
      return error({
        code: -1,
        message: 'USER_WEBSITE_INEXISTENT',
        err: null
      });
    }

    query = `SELECT 
        distinct p.*,
        e.Score,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Evaluation as e
      WHERE
        LOWER(t.Name) = "${_.toLower(tag)}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        LOWER(w.Name) = "${_.toLower(website)}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_access_studies_user_tag_website_pages_data = async (user_id, tag, website) => {
  try {
    const query = `SELECT 
        distinct p.*,
        e.Score,
        e.Tot,
        e.A,
        e.AA,
        e.AAA,
        e.Evaluation_Date
      FROM 
        Page as p,
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Evaluation as e
      WHERE
        LOWER(t.Name) = "${_.toLower(tag)}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        LOWER(w.Name) = "${_.toLower(website)}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.add_access_studies_user_tag_website_pages = async (user_id, tag, website, domain, pages) => {
  try {
    const errors = {};
    const size = _.size(pages);
    for (let i = 0; i < size; i++) {
      let query = `SELECT PageId FROM Page WHERE Uri = "${decodeURIComponent(pages[i])}" LIMIT 1`;
      let page = await execute_query(query);

      if (_.size(page) > 0) {
        query = `SELECT 
            dp.* 
          FROM
            Tag as t,
            TagWebsite as tw,
            Website as w,
            Domain as d,
            DomainPage as dp
          WHERE 
            LOWER(t.Name) = "${_.toLower(tag)}" AND
            t.UserId = "${user_id}" AND 
            tw.TagId = t.TagId AND
            w.WebsiteId = tw.WebsiteId AND
            LOWER(w.Name) = "${_.toLower(website)}" AND
            w.UserId = "${user_id}" AND
            d.WebsiteId = w.WebsiteId AND
            dp.DomainId = d.DomainId AND
            dp.PageId = "${page[0].PageId}"`;

        let domainPage = await execute_query(query);
        if (_.size(domainPage) === 0) {
          query = `INSERT INTO DomainPage (DomainId, PageId) 
            SELECT 
              d.DomainId, 
              "${page[0].PageId}" 
            FROM
              Tag as t,
              TagWebsite as tw,
              Website as w,
              Domain as d
            WHERE 
              LOWER(t.Name) = "${_.toLower(tag)}" AND
              t.UserId = "${user_id}" AND 
              tw.TagId = t.TagId AND
              w.WebsiteId = tw.WebsiteId AND
              LOWER(w.Name) = "${_.toLower(website)}" AND
              w.UserId = "${user_id}" AND
              d.WebsiteId = w.WebsiteId`;
          await execute_query(query);
        }
      } else {
        let evaluation = null;

        try {
          evaluation = await evaluate_url(pages[i], 'examinator');
        } catch (e) {
          errors[pages[i]] = -1;
        }

        if (evaluation !== null && evaluation.result !== null) {
          let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
          query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${decodeURIComponent(pages[i])}", "none", "${date}")`;
          let newPage = await execute_query(query);

          await save_page_evaluation(newPage.insertId, evaluation);

          query = `INSERT INTO DomainPage (DomainId, PageId) 
            SELECT 
              d.DomainId, 
              "${newPage.insertId}" 
            FROM
              Tag as t,
              TagWebsite as tw,
              Website as w,
              Domain as d
            WHERE 
              LOWER(t.Name) = "${_.toLower(tag)}" AND
              t.UserId = "${user_id}" AND 
              tw.TagId = t.TagId AND
              w.WebsiteId = tw.WebsiteId AND
              LOWER(w.Name) = "${_.toLower(website)}" AND
              w.UserId = "${user_id}" AND
              d.WebsiteId = w.WebsiteId`;
          await execute_query(query);

          query = `SELECT distinct d.DomainId, d.Url 
                    FROM
                      User as u,
                      Website as w,
                      Domain as d
                    WHERE
                      LOWER(d.Url) = "${_.toLower(domain)}" AND
                      d.WebsiteId = w.WebsiteId AND
                      (
                        w.UserId IS NULL OR
                        (
                          u.UserId = w.UserId AND
                          LOWER(u.Type) = 'monitor'
                        )
                      )
                    LIMIT 1`;

          const existing_domain = await execute_query(query);

          if (_.size(existing_domain) > 0) {
            query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${existing_domain[0].DomainId}", "${newPage.insertId}")`;
            await execute_query(query);
          }
        } else {
          errors[pages[i]] = -1;
        }
      }
    }

    const newPages = await this.get_access_studies_user_tag_website_pages(user_id, tag, website);

    if (_.size(_.keys(errors)) > 0) {
      return error({
        code: 0,
        message: 'SOME_PAGES_ERRORS',
        err: errors
      }, newPages.result);
    } else {
      return newPages;
    }
  } catch (err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.remove_access_studies_user_tag_website_pages = async (user_id, tag, website, pages_id) => {
  try {
    const query = `
      DELETE 
        dp.* 
      FROM
        Tag as t,
        TagWebsite as tw,
        Domain as d,
        DomainPage as dp
      WHERE 
        LOWER(t.Name) = "${_.toLower(tag)}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        d.WebsiteId = tw.WebsiteId AND
        dp.DomainId = d.DomainId AND
        dp.PageId IN (${pages_id})`;

    await execute_query(query);

    return this.get_access_studies_user_tag_website_pages(user_id, tag, website);
  } catch (err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.update_page = async (page_id, checked) => {
  try {
    let query = `SELECT Show_In FROM Page WHERE PageId = "${page_id}" LIMIT 1`;
    let page = await execute_query(query);

    if (_.size(page) > 0) {
      let show = null;

      if (page[0].Show_In === 'both') {
        show = 'user';
      } else if (page[0].Show_In === 'user' && checked === 'true') {
        show = 'both';
      } else if (page[0].Show_In === 'user' && checked === 'false') {
        show = 'none';
      } else if (page[0].Show_In === 'observatorio' && checked === 'true') {
        show = 'both';
      } else if (page[0].Show_In === 'observatorio' && checked === 'false') {
        show = 'none';
      } else if (page[0].Show_In === 'none') {
        show = 'observatorio';
      }

      query = `UPDATE Page SET Show_In = "${show}" WHERE PageId = "${page_id}"`;
      await execute_query(query);
    }

    return success(page_id);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.update_observatorio_pages = async (pages, pages_id) => {
  try {
    for (let page of pages) {
      let show = null;

      if (page.Show_In === 'both' && !_.includes(pages_id, page.PageId)) {
        show = 'user';
      } else if (page.Show_In === 'user' && _.includes(pages_id, page.PageId)) {
        show = 'both';
      } else if (page.Show_In === 'observatorio' && !_.includes(pages_id, page.PageId)) {
        show = 'none';
      } else if (page.Show_In === 'none' && _.includes(pages_id, page.PageId)) {
        show = 'observatorio';
      } else {
        show = page.Show_In;
      }

      let query = `UPDATE Page SET Show_In = "${show}" WHERE PageId = "${page.PageId}"`;
      await execute_query(query);
    }

    return success(true);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.delete_page = async (page_id) => {
  try {
    const query = `DELETE FROM Page WHERE PageId = "${page_id}"`;
    await execute_query(query);

    return success(page_id);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

const crawl = (domain, max_depth, max_pages) => {
  return new Promise((resolve, reject) => {

    const crawler = Crawler('http://' + domain);
    let urlList = [];
    let pageNumber = 0;

    crawler.on('fetchcomplete', function (r, q) {
      let contentType = r['stateData']['contentType'];
      if ((contentType.includes('text/html') || contentType.includes('image/svg+xml')) && (pageNumber <= max_pages || max_pages === 0)) {
        urlList.push(r['url']);
        pageNumber++;
      }

      if (pageNumber >= max_pages && max_pages !== 0) {
        this.emit('complete');
      }
    });

    crawler.on('complete', function () {
      crawler.stop();
      resolve(urlList);
    });

    crawler.maxDepth = max_depth + 1;
    crawler.start();
  });
}

//perguntar se domino tar la eh relvante
//acrescentar predefinicoes com -1 max pages e -1 para ir buscar a json
//var Crawler = require("simplecrawler")
//
//  var crawler = Crawler('https://www.google.pt');
//
//         crawler.on("fetchcomplete", function (q, r,t) {
//             console.log(r);
//             console.log("separador")
//             console.log(q);
//
//
//         });
//         crawler.maxDepth = 2;
//         crawler.start();
//
//
//
module.exports.get_urls = async (domain, max_depth, max_pages) => {
  let list = await crawl(domain, max_depth, max_pages);

  return list;
};

//preciso de fazer isto?
//como fazer standard
//por ficheiro a mao
module.exports.set_crawler_settings = async (max_depth, max_pages) => {
  try {
    const fs = require('fs');
    let settings = {};

    settings['max_depth'] = max_depth;
    settings['max_pages'] = max_pages;

    fs.writeFile(_dirname + '/lib/crawler.json', JSON.stringify(settings), function (err) {
      if (err) {
        throw (err);
      }
    });
  } catch (err) {
    console.log(err);
    return error(err);
  }
};


module.exports.add_evaluation = async odf => {
  try {
    //TODO
  } catch (err) {
    console.log(err);
    return error(err);
  }
};