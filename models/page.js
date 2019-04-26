'use strict';

/**
 * Page Model
 *
 *
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

const { evaluate_url, save_page_evaluation } = require('./evaluation');

module.exports.create_pages = async (domain_id, uris, observatorio_uris, show_in) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let pagesId = [];
    const errors = {};

    for (let u of uris) {
      u = _.replace(u, 'https://', '');
      u = _.replace(u, 'http://', '');
      u = _.replace(u, 'www.', '');

      let query = `SELECT PageId, Show_In FROM Page WHERE LOWER(Uri) = "${_.toLower(u)}" LIMIT 1`;
      let page = await execute_query(query);

      if (_.size(page) > 0) {

        query = `UPDATE Page SET Delete = "0" WHERE PageId = "${page[0].PageId}"`;
        await execute_query(query);

        query = `SELECT * FROM DomainPage WHERE DomainId = "${domain_id}" AND PageId = "${page[0].PageId}" LIMIT 1`;
        let domain_page = await execute_query(query);
        if (_.size(domain_page) === 0) {
          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain_id}", "${page[0].PageId}")`;
          await execute_query(query);
          pagesId.push(page[0].PageId);
        }
        let show = null;
        
        if (_.includes(observatorio_uris, u)) {
          show = Math.max(Number(Show_In[0]),Number(show_In[0]))+Math.max(Number(Show_In[1]),Number(show_In[1]))+"1";
        } else {
          show = Math.max(Number(Show_In[0]),Number(show_In[0]))+Math.max(Number(Show_In[1]),Number(show_In[1]))+Math.max(Number(Show_In[2]),Number(show_In[2]));
        }

        query = `UPDATE Page SET Show_In = "${show}" WHERE PageId = "${page[0].PageId}"`;
        await execute_query(query);
      } else {
        let show = null;

        if (_.includes(observatorio_uris, u)) {
          show = show_in.substring(0,1)+"1";
        } else {
          show = show_in;
        }


        let evaluation = null;
        try {
          evaluation = await evaluate_url(u, 'examinator');
        } catch(e) {
          errors[u] = -1;
        }

        if (evaluation !== null && evaluation.result !== null) {
          query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${u}", "${show}", "${date}")`;
          let newPage = await execute_query(query);

          await save_page_evaluation(newPage.insertId, evaluation,"10");

          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain_id}", "${newPage.insertId}")`;
          await execute_query(query);
          pagesId.push(newPage.insertId);
        } else {
          errors[u] = -1;
        }
      }
    }

    if (_.size(_.keys(errors)) > 0) {
      return error({ code: 0, message: 'SOME_PAGES_ERRORS', err: errors}, pagesId);
    } else {
      return success(pagesId);
    }
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_page_id = async (url) => {
  try {
    const query = `SELECT PageId FROM Page WHERE LOWER(Uri) = "${_.toLower(url)}"`;
    
    const page = await execute_query(query);
    return success(page[0].PageId);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_pages = async () => {
  try {
    const query = `SELECT p.*, e.Score, e.Evaluation_Date 
        FROM 
            Page as p
            LEFT OUTER JOIN Evaluation e ON e.PageId = p.PageId AND e.Evaluation_Date = (
                SELECT Evaluation_Date FROM Evaluation 
                WHERE PageId = p.PageId
                ORDER BY Evaluation_Date DESC LIMIT 1
            ) 
        WHERE
            LOWER(p.Show_In) LIKE '1%'
        GROUP BY p.PageId, e.Score, e.Evaluation_Date`;
    
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

module.exports.get_all_domain_pages = async (user, domain, flags) => {
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
            p.PageId = dp.PageId AND
            p.Show_In LIKE "${flags}"
          )
          OR
          (
            w.UserId IS NULL AND
            d.WebsiteId = w.WebsiteId AND
            LOWER(d.Url) = "${_.toLower(domain)}" AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In LIKE "${flags}"
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
          p.PageId = dp.PageId AND
          p.Show_In LIKE "${flags}"
        GROUP BY p.PageId, e.A, e.AA, e.AAA, e.Score, e.Errors, e.Evaluation_Date`;
    }
    
    const pages = await execute_query(query);
    return success(pages);
  } catch(err) {
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
    let query = `SELECT * FROM Website WHERE UserId = "${user_id}" AND Name = "${website}" LIMIT 1`;
    const websiteExist = await execute_query(query);

    if (_.size(websiteExist) === 0) {
      return error({code: -1, message: 'USER_WEBSITE_INEXISTENT', err: null});
    }
  //AQUI
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
        LOWER(p.Show_In) LIKE '_1%' AND
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
    const errors = {};
    const size = _.size(pages);
    for (let i = 0 ; i < size ; i++) {
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
        //AQUI
        let none = new RegExp("[0-1][0][0]");
        let observatorio = new RegExp("[0-1][1][0-1]");


        //AQUI
        if (none.test(page[0].Show_In )) {
          let show_in = page[0].Show_In[0]+"10";
          query = `UPDATE Page SET Show_In = "${show_in}" WHERE PageId = "${page[0].PageId}"`;
          await execute_query(query);
        } else if (observatorio.test(page[0].Show_In)){
          let show_in = page[0].Show_In[0]+"11";
          query = `UPDATE Page SET Show_In = "${show_in}" WHERE PageId = "${page[0].PageId}"`;
          await execute_query(query);
        }
      } else {
        let evaluation = null;
        try {
          evaluation = await evaluate_url(pages[i], 'examinator');
        } catch(e) {
          errors[pages[i]] = -1;
        }

        if (evaluation !== null && evaluation.result !== null) {
          let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
          query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${pages[i]}", "010", "${date}")`;
          let newPage = await execute_query(query);
          
          await save_page_evaluation(newPage.insertId, evaluation,"01");

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
      return error({ code: 0, message: 'SOME_PAGES_ERRORS', err: errors}, newPages.result);
    } else {
      return newPages;
    }
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.remove_my_monitor_user_website_pages = async (user_id, website, pages_id) => {
  try {
    //OTIMIZAR
    for (let id of pages_id) {
      let query = `SELECT Show_In FROM Page WHERE PageId = "${id}" LIMIT 1`;
      let page = await execute_query(query);

      let show_in;

      if (_.size(page) > 0) {
        show_in =  page[0].Show_In[0]+"0"+page[0].Show_In[2];
        query = `UPDATE Page SET Show_In = "${show_in}" WHERE PageId = "${id}"`;
        await execute_query(query);
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
      return error({code: -1, message: 'USER_WEBSITE_INEXISTENT', err: null});
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
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

//TODO eh preciso ser tao grande???...
module.exports.add_access_studies_user_tag_website_pages = async (user_id, tag, website, domain, pages) => {
  try {
    const errors = {};
    const size = _.size(pages);
    for (let i = 0 ; i < size ; i++) {
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
        } catch(e) {
          errors[pages[i]] = -1;
        }

        if (evaluation !== null && evaluation.result !== null) {
          let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
          query = `INSERT INTO Page (Uri, Creation_Date) VALUES ("${pages[i]}", "${date}")`;
          let newPage = await execute_query(query);
          //TODO um destes insert no domainPage estah mal...
          
          await save_page_evaluation(newPage.insertId, evaluation,"01");

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
      return error({ code: 0, message: 'SOME_PAGES_ERRORS', err: errors}, newPages.result);
    } else {
      return newPages;
    }
  } catch(err) {
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
  } catch(err) {
    console.log(err);
    throw error(err);
  } 
}

module.exports.update_page = async (page_id, checked) => {
  //AQUI
  try {
    let query = `SELECT Show_In FROM Page WHERE PageId = "${page_id}" LIMIT 1`;
    let page = await execute_query(query);


    let both = new RegExp("[0-1][1][1]");
    let none = new RegExp("[0-1][0][0]");

    
    if (_.size(page) > 0) {
      let show = null;

      if (both.test(page[0].Show_In)) {
        show = page[0].Show_In[0]+"10";
      } else if (page[0].Show_In[1] === '1' && checked === 'true') {
        show = page[0].Show_In[0]+"11";
      } else if (page[0].Show_In[1] ==='1' && checked === 'false') {
        show = page[0].Show_In[0]+"00";
      } else if (page[0].Show_In[2] === '1' && checked === 'true') {
        show = page[0].Show_In[0]+"11";
      } else if (page[0].Show_In [2] ==='1' && checked === 'false') {
        show = page[0].Show_In[0]+"00";
      } else if ( none.test(page[0].Show_In)) {
        show = page[0].Show_In[0]+"01";
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

module.exports.update_page_admin = async (page_id, checked) => {
  try {
    let query = `SELECT Show_In FROM Page WHERE PageId = "${page_id}" LIMIT 1`;
    let page = await execute_query(query);

    if (_.size(page) > 0) {
      let show = page[0].Show_In;

      if (page[0].Show_In[0] === '1' && checked === 'false') {
        show = "0"+page[0].Show_In[1]+page[0].Show_In[2];
      } else if (page[0].Show_In[0] ==='0' && checked === 'true') {
        show = "1"+page[0].Show_In[1]+page[0].Show_In[2];
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

//method to import website, domain and tag from selected page of studymonitor
module.exports.update_tag_admin = async (page_id, checked) => {
  try {
    let query;
    if(checked === 'true') {
       query = `SELECT t.*, w.WebsiteId as wID
            FROM 
            Tag as t, 
            Page as p, 
            Domain as d, 
            Website as w,
            TagWebsite as tw,
            DomainPage as dp 
            WHERE 
            p.PageId = "${page_id}" AND 
            dp.PageId = p.PageId AND
            dp.DomainId = d.DomainId AND
            d.WebsiteId = w.WebsiteId AND
            tw.WebsiteId = w.WebsiteId AND 
            t.TagId = tw.TagId`;
      let tag = await execute_query(query);

      if (_.size(tag) > 0) {
        const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
                VALUES ("${tag[0].Name}", "0", "${date}")`;
        let result = await execute_query(query);

        query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${result.insertId}", "${tag[0].wID}")`;
        await execute_query(query);
      }
    } else {
      query = `DELETE t
            FROM 
            Tag as t, 
            Page as p, 
            Domain as d, 
            Website as w,
            TagWebsite as tw,
            DomainPage as dp
            WHERE 
            p.PageId = "${page_id}" AND 
            dp.PageId = p.PageId AND
            dp.DomainId = d.DomainId AND
            d.WebsiteId = w.WebsiteId AND
            tw.WebsiteId = w.WebsiteId AND 
            t.TagId = tw.TagId AND
            t.UserId IS NULL`;
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
      //AQUI

      if (!_.includes(pages_id, page.PageId)) {
        show = page.Show_In[0]+"0"+page.Show_In[2];
      } else {
        show = page.Show_In[0]+"1"+page.Show_In[2];
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

module.exports.delete_page = async (page_id,show_in) => {
  try {

    let query = `SELECT Show_In FROM Page WHERE PageId = "${page_id}" LIMIT 1`;
    let page = await execute_query(query);

    let new_show_in = page[0].Show_In;
    for(let i = 0 ; i < page[0].Show_In.length;i++) {
      if (show_in[i] === '1') {
        new_show_in = replaceAt(new_show_in, i, 0);
      }
    }

    query = `UPDATE Page SET Show_In = "${new_show_in}" WHERE PageId = "${page_id}"`;
    await execute_query(query);

    return success(page_id);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}


function replaceAt(string, index, replace) {
  return string.substring(0, index) + replace + string.substring(index + 1);
}

