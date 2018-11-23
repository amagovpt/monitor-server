'use strict';

/**
 * Page Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

const { evaluate_url_and_save } = require('./evaluation');

module.exports.create_pages = async (domain_id, uris) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let pagesId = [];

    for (let u of uris) {
      u = _.replace(u, 'https://', '');
      u = _.replace(u, 'http://', '');
      u = _.replace(u, 'www.', '');

      let query = `SELECT PageId FROM Page WHERE Uri = "${u}" LIMIT 1`;
      let page = await execute_query(query);

      if (_.size(page) > 0) {
        query = `SELECT * FROM DomainPage WHERE DomainId = "${domain_id}" AND PageId = "${page[0].PageId}" LIMIT 1`;
        let domain_page = await execute_query(query);
        if (_.size(domain_page) === 0) {
          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain_id}", "${page[0].PageId}")`;
          await execute_query(query);
          pagesId.push(page[0].PageId);
        }
      } else {
        query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${u}", "none", "${date}")`;
        let newPage = await execute_query(query);
        
        await evaluate_url_and_save(newPage.insertId, u);

        query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain_id}", "${newPage.insertId}")`;
        await execute_query(query);
        pagesId.push(newPage.insertId);
      }
    }

    return success(pagesId);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_page_id = async (url) => {
  try {
    const query = `SELECT PageId FROM Page WHERE Uri = "${url}"`;
    
    const page = await execute_query(query);
    return success(page[0].PageId);
  } catch(err) {
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
  } catch(err) {
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
          e.Score, 
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
            u.Type = "monitor" AND
            w.UserId = u.UserId AND
            d.WebsiteId = w.WebsiteId AND
            d.Url = "${domain}" AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId
          )
          OR
          (
            w.UserId IS NULL AND
            d.WebsiteId = w.WebsiteId AND
            d.Url = "${domain}" AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId
          )
        GROUP BY p.PageId, e.Score, e.Evaluation_Date`;
    } else {
      query = `SELECT 
          p.*, 
          e.Score, 
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
          u.Email = "${user}" AND
          w.UserId = u.UserId AND
          d.WebsiteId = w.WebsiteId AND
          d.Url = "${domain}" AND
          dp.DomainId = d.DomainId AND
          p.PageId = dp.PageId
        GROUP BY p.PageId, e.Score, e.Evaluation_Date`;
    }
    
    const pages = await execute_query(query);
    return success(pages);
  } catch(err) {
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
  } catch(err) {
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
  } catch(err) {
    return error(err);
  }
}

/**
 * MY MONITOR
 */

module.exports.get_my_monitor_user_website_pages = async (user_id, website) => {
  try {
    const query = `SELECT 
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
        w.Name = "${website}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        (p.Show_In = "user" OR p.Show_In = "both") AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch(err) {
    console.log(err);
    return error(err);
  } 
}

module.exports.add_my_monitor_user_website_pages = async (user_id, website, domain, pages) => {
  try {
    const _size = _.size(pages);
    for (let i = 0 ; i < _size ; i++) {
      let query = `SELECT PageId, Show_In FROM Page WHERE Uri = "${pages[i]}" LIMIT 1`;
      let page = await execute_query(query);

      if (_.size(page) > 0) {
        query = `SELECT 
            dp.* 
          FROM
            Website as w,
            Domain as d,
            DomainPage as dp
          WHERE 
            w.Name = "${website}" AND
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
              w.Name = "${website}" AND
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
        let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${pages[i]}", "user", "${date}")`;
        let newPage = await execute_query(query);
        
        await evaluate_url_and_save(newPage.insertId, pages[i]);

        query = `INSERT INTO DomainPage (DomainId, PageId) 
          SELECT 
            d.DomainId, 
            "${newPage.insertId}" 
          FROM
            Website as w,
            Domain as d
          WHERE 
            w.Name = "${website}" AND
            w.UserId = "${user_id}" AND
            d.WebsiteId = w.WebsiteId AND
            d.Url = "${domain}" AND
            d.Active = 1`;
        await execute_query(query);
      }
    }

    return this.get_my_monitor_user_website_pages(user_id, website);
  } catch(err) {
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
    const query = `SELECT 
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
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = "${website}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch(err) {
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
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.Name = "${website}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const pages = await execute_query(query);

    return success(pages);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.add_access_studies_user_tag_website_pages = async (user_id, tag, website, domain, pages) => {
  try {
    const _size = _.size(pages);
    for (let i = 0 ; i < _size ; i++) {
      let query = `SELECT PageId FROM Page WHERE Uri = "${pages[i]}" LIMIT 1`;
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
            t.Name = "${tag}" AND
            t.UserId = "${user_id}" AND 
            tw.TagId = t.TagId AND
            w.WebsiteId = tw.WebsiteId AND
            w.Name = "${website}" AND
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
              t.Name = "${tag}" AND
              t.UserId = "${user_id}" AND 
              tw.TagId = t.TagId AND
              w.WebsiteId = tw.WebsiteId AND
              w.Name = "${website}" AND
              w.UserId = "${user_id}" AND
              d.WebsiteId = w.WebsiteId`;
          await execute_query(query);
        }
      } else {
        let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${pages[i]}", "none", "${date}")`;
        let newPage = await execute_query(query);
        
        await evaluate_url_and_save(newPage.insertId, pages[i]);

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
            t.Name = "${tag}" AND
            t.UserId = "${user_id}" AND 
            tw.TagId = t.TagId AND
            w.WebsiteId = tw.WebsiteId AND
            w.Name = "${website}" AND
            w.UserId = "${user_id}" AND
            d.WebsiteId = w.WebsiteId`;
        await execute_query(query);
        
        query = `SELECT distinct d.DomainId, d.Url 
                  FROM
                    User as u,
                    Website as w,
                    Domain as d
                  WHERE
                    d.Url = "${domain}" AND
                    d.WebsiteId = w.WebsiteId AND
                    (
                      w.UserId IS NULL OR
                      (
                        u.UserId = w.UserId AND
                        u.Type = 'monitor'
                      )
                    )
                  LIMIT 1`;

        const exisitng_domain = await execute_query(query);

        if (_.size(exisitng_domain) > 0) {
          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${exisitng_domain[0].DomainId}", "${newPage.insertId}")`;
          await execute_query(query);
        }
      }
    }

    return this.get_access_studies_user_tag_website_pages(user_id, tag, website);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.remove_access_studies_user_tag_website_pages = async (user_id, tag, website, pagesId) => {
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
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND 
        tw.TagId = t.TagId AND 
        d.WebsiteId = tw.WebsiteId AND
        dp.DomainId = d.DomainId AND
        dp.PageId IN ("${pagesId}")`;

    await execute_query(query);

    return this.get_access_studies_user_tag_website_pages(user_id, tag, website);
  } catch(err) {
    console.log(err);
    throw error(err);
  } 
}

module.exports.update_page = async (page_id, checked) => {
  try {
    let query = `SELECT Show_In FROM Page WHERE PageId = "${page_id}" LIMIT 1`;
    let page = await execute_query(query);
    console.log(checked);
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
  } catch(err) {
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
  } catch(err) {
    console.log(err);
    return error(err);
  }
}