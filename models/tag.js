'use strict';

/**
 * Tag Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const {
  InvalidTagTypeError
} = require('../lib/_error');
const {
  success,
  error
} = require('../lib/_response');
const {
  execute_query
} = require('../lib/_database');
const {
  evaluate_url_and_save
} = require('./evaluation');

module.exports.create_official_tag = async (name, observatorio, websites) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
      VALUES ("${name}", "${observatorio}", "${date}")`;

    const tag = await execute_query(query);

    for (let w of websites) {
      query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tag.insertId}", "${w}")`;
      await execute_query(query);
    }

    return success(tag.insertId);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.create_user_tag = async (user_id, type, tags_id, user_tag_name) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Tag (UserId, Name, Show_in_Observatorio, Creation_Date) 
        VALUES ("${user_id}", "${user_tag_name}", "0", "${date}")`;

    const tag = await execute_query(query);

    if (type === 'official') {
      if (_.size(tags_id) > 1) {
        query = `SELECT w.Name, d.DomainId, d.Url, d.Start_Date
            FROM 
              TagWebsite as tw
              LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
              LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
            WHERE 
              tw.TagId IN (${_.join(tags_id, ', ')})
            GROUP BY
              w.Name, d.DomainId, d.Url, d.Start_Date
            HAVING
              COUNT(tw.WebsiteId) > 1 `;
      } else {
        query = `SELECT w.Name, d.DomainId, d.Url, d.Start_Date
                FROM 
                  TagWebsite as tw
                  LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
                  LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
                WHERE 
                  tw.TagId = "${tags_id[0]}"
                GROUP BY
                  w.Name, d.DomainId, d.Url, d.Start_Date`;
      }
      const websites = await execute_query(query);

      for (let i = 0; i < _.size(websites); i++) {
        let website = websites[i];

        query = `INSERT INTO Website (Name, UserId, Creation_Date) VALUES ("${website.Name}", "${user_id}", "${date}")`;
        let new_website = await execute_query(query);

        query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
          VALUES ("${new_website.insertId}", "${website.Url}", "${new Date(website.Start_Date).toISOString().replace(/T/, ' ').replace(/\..+/, '')}", "1")`;
        let new_domain = await execute_query(query);

        query = `SELECT * FROM DomainPage WHERE DomainId = "${website.DomainId}"`;
        let pages = await execute_query(query);

        for (let page of pages) {
          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${new_domain.insertId}", "${page.PageId}")`;
          await execute_query(query);
        }

        query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tag.insertId}", "${new_website.insertId}")`;
        await execute_query(query);
      }
    } else if (type !== 'user') {
      throw new InvalidTagTypeError(err);
    }

    return success(tag.insertId);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

/**
 * Get functions
 */

module.exports.get_number_of_access_studies_tags = async () => {
  try {
    const query = `SELECT COUNT(t.TagId) as Tags FROM Tag as t, User as u WHERE LOWER(u.Type) = "studies" AND t.UserId = u.UserId`;
    const tags = await execute_query(query);
    return success(tags[0].Tags);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_number_of_observatorio_tags = async () => {
  try {
    const query = `SELECT COUNT(*) as Tags FROM Tag WHERE Show_in_Observatorio = "1"`;
    const tags = await execute_query(query);
    return success(tags[0].Tags);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.tag_official_name_exists = async (name) => {
  try {
    const query = `SELECT * FROM Tag WHERE LOWER(Name) = "${_.toLower(name)}" AND UserId IS NULL LIMIT 1`;
    const tag = await execute_query(query);
    return success(_.size(tag) === 1);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_tags = async () => {
  try {
    const query = `SELECT 
        t.*,
        u.Username as User,
        COUNT(distinct tw.WebsiteId) as Websites 
      FROM 
        Tag as t
        LEFT OUTER JOIN User as u ON u.UserId = t.UserId
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      WHERE
        t.UserId IS NULL  
      GROUP BY t.TagId`;
    const tags = await execute_query(query);
    return success(tags);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_official_tags = async () => {
  try {
    const query = `SELECT * FROM Tag WHERE UserId IS NULL`;
    const tags = await execute_query(query);
    return success(tags);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_official_tags = async user_id => {
  try {
    const query = `SELECT t.* 
      FROM 
        Tag as t
      WHERE 
        t.UserId IS NULL AND
        t.Name NOT IN (SELECT Name FROM Tag as t2 WHERE t2.UserId = "${user_id}")`;
    const tags = await execute_query(query);
    return success(tags);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_tags_info = async () => {
  try {
    const query = `
      SELECT 
      t.*,
        COUNT(distinct te.EntityId) as Entities,
        COUNT(distinct tw.WebsiteId) as Websites,
        COUNT(distinct td.DomainId) as Domains,
        COUNT(distinct tp.PageId) as Pages
    FROM
      Tag as t
      LEFT OUTER JOIN TagEntity as te ON te.TagId = t.TagId
      LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
      LEFT OUTER JOIN TagDomain as td ON td.TagId = t.TagId
      LEFT OUTER JOIN TagPage as tp ON tp.TagId = t.TagId
    GROUP BY t.TagId
    `;

    const tags = await execute_query(query);
    return success(tags);
  } catch (err) {
    return error(err);
  }
}

module.exports.get_access_studies_user_tags = async user_id => {
  try {
    const query = `SELECT 
        distinct t.*, 
        COUNT(distinct tw.WebsiteId) as Websites,
        COUNT(distinct dp.PageId) as Pages 
      FROM 
        Tag as t
        LEFT OUTER JOIN TagWebsite as tw ON tw.TagId = t.TagId
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = tw.WebsiteId
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
      WHERE 
        t.UserId = "${user_id}"
      GROUP BY t.TagId`;
    const tags = await execute_query(query);
    return success(tags);
  } catch (err) {
    return error(err);
  }
}

module.exports.user_tag_name_exists = async (user_id, name) => {
  const query = `SELECT * FROM Tag WHERE LOWER(Name) = "${_.toLower(name)}" AND UserId = "${user_id}" LIMIT 1`;
  const tag = await execute_query(query);
  return success(_.size(tag) !== 0);
}

module.exports.user_remove_tags = async (user_id, tags_id) => {
  try {
    let query = `DELETE
        w.*
      FROM
        Website as w
      WHERE
        w.WebsiteId IN (SELECT WebsiteId FROM TagWebsite WHERE TagId IN (${tags_id}))`;
    await execute_query(query);

    query = `DELETE FROM Tag WHERE TagId IN (${tags_id})`;
    await execute_query(query);

    return await this.get_access_studies_user_tags(user_id);
  } catch (err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.get_tag_info = async (tag_id) => {
  try {
    let query = `SELECT t.*, u.Username FROM Tag as t LEFT OUTER JOIN User as u ON u.UserId = t.UserId WHERE TagId = "${tag_id}" LIMIT 1`;

    let tag = await execute_query(query);

    if (_.size(tag) === 0) {
      throw new EntityNotFoundError();
    } else {
      tag = tag[0];

      query = `SELECT w.* 
        FROM
          TagWebsite as tw,
          Website as w 
        WHERE
          tw.TagId = "${tag_id}" AND 
          w.WebsiteId = tw.WebsiteId`;
      const websites = await execute_query(query);

      tag.websites = websites;
    }

    return success(tag);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.update_tag = async (tag_id, name, observatorio, default_websites, websites) => {
  try {
    let query = `UPDATE Tag SET Name = "${name}", Show_in_Observatorio = "${observatorio}" WHERE TagId = "${tag_id}"`;
    await execute_query(query);

    for (let website_id of default_websites) {
      if (!_.includes(websites, website_id)) {
        query = `DELETE FROM TagWebsite WHERE TagId = "${tag_id}" AND WebsiteId = "${website_id}"`;
        await execute_query(query);
      }
    }

    for (let website_id of websites) {
      if (!_.includes(default_websites, website_id)) {
        query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tag_id}", "${website_id}")`;
        await execute_query(query);
      }
    }

    return success(tag_id);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.copy_tag = async (tag_id, name) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
      VALUES ("${name}", "0", "${date}")`;
    const newTag = await execute_query(query);

    query = `SELECT w.Name, d.DomainId, d.Url, d.Start_Date
            FROM 
              TagWebsite as tw
              LEFT OUTER JOIN Website as w ON w.WebsiteId = tw.WebsiteId
              LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
            WHERE 
              tw.TagId = "${tag_id}"
            GROUP BY
              w.Name, d.DomainId, d.Url, d.Start_Date`;
    
    const websites = await execute_query(query);

    for (let w of websites) {
      query = `SELECT w.* 
        FROM
          Website as w,
          User as u
        WHERE
          LOWER(w.Name) = "${_.toLower(w.Name)}" AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) = "monitor"))
        LIMIT 1`;
      const existingWebsite = await execute_query(query);

      if (_.size(existingWebsite) > 0) {
        query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${newTag.insertId}", "${existingWebsite[0].WebsiteId}")`;
        await execute_query(query);
      } else {
        query = `INSERT INTO Website (Name, Creation_Date) VALUES ("${w.Name}", "${date}")`;
        const newWebsite = await execute_query(query);

        query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
          VALUES ("${newWebsite.insertId}", "${w.Url}", "${new Date(w.Start_Date).toISOString().replace(/T/, ' ').replace(/\..+/, '')}", "1")`;
        const newDomain = await execute_query(query);

        query = `SELECT * FROM DomainPage WHERE DomainId = "${w.DomainId}"`;
        const pages = await execute_query(query);

        for (let p of pages) {
          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${newDomain.insertId}", "${p.PageId}")`;
          await execute_query(query);
        }

        query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${newTag.insertId}", "${newWebsite.insertId}")`;
        await execute_query(query);
      }
    }

    return success(newTag.insertId);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.delete_tag = async (tag_id) => {
  try {
    const query = `DELETE FROM Tag WHERE TagId = "${tag_id}"`;
    await execute_query(query);

    return success(tag_id);
  } catch (err) {
    console.log(err);
    return error(err);
  }
};

//method to import website, domain and tag from selected page of studymonitor
module.exports.update_tag_admin = async (tag_id, checked, user_id) => {
  try {
    let query;
    if (checked === 'true') {
      query = `SELECT t.UserId, t.Name as tagName, w.*, d.*
            FROM 
            Tag as t, 
            Domain as d, 
            Website as w,
            TagWebsite as tw
            WHERE 
            dp.DomainId = d.DomainId AND
            d.WebsiteId = w.WebsiteId AND
            tw.WebsiteId = w.WebsiteId AND 
             tw.TagId = T.TagId AND 
            t.TagId = "${tag_id}"`;
      let tag = await execute_query(query);
      let websiteName = tag[0].Name;
      let tagName = tag[0].tagName;
      let domainUrl = tag[0].Url;


      query = `SELECT  p.*
            FROM 
            Tag as t, 
            Page as p, 
            Domain as d, 
            Website as w,
            TagWebsite as tw,
            DomainPage as dp 
            WHERE 
            dp.DomainId = d.DomainId AND
            d.WebsiteId = w.WebsiteId AND
            tw.WebsiteId = w.WebsiteId AND 
             tw.TagId = T.TagId AND 
            t.TagId = "${tag_id}"`;


      let pages = await execute_query(query);

      if (_.size(webDomain) > 0) {
        const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        query = `INSERT INTO Website (Name, Creation_Date) VALUES ("${websiteName}", "${date}")`;
        let website = await execute_query(query);

        query = `INSERT INTO Domain ( WebsiteId,Url, Start_Date, Active) VALUES ( "${website.insertId}","${domainUrl}", "${date}", "1")`;
        let domain = await execute_query(query);

        for (let page of pages) {
          query = `UPDATE Page SET Show_In = "${show}" WHERE PageId = "${page.PageId}"`;
          await execute_query(query);

          query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain.insertId}", "${page.PageId}")`;
          await execute_query(query);

          query = `INSERT INTO Tag (Name, Show_in_Observatorio, Creation_Date) 
                VALUES ("${tagName}", "0", "${date}")`;
          let tag = await execute_query(query);

          query = `INSERT INTO TagWebsite (WebsiteId, TagId) VALUES ("${website.insertId}", "${tag.insertId}")`;
          await execute_query(query);

        }

      }
    } else {

      query = `DELETE d,w
             FROM 
            Tag as t, 
            Domain as d, 
            Website as w,
            TagWebsite as tw
            WHERE 
            dp.DomainId = d.DomainId AND
            d.WebsiteId = w.WebsiteId AND
            tw.WebsiteId = w.WebsiteId AND 
             tw.TagId = T.TagId AND 
            t.TagId = "${tag_id}"`;
      await execute_query(query);


      query = `SELECT  p.*
            FROM 
            Tag as t, 
            Page as p, 
            Domain as d, 
            Website as w,
            TagWebsite as tw,
            DomainPage as dp 
            WHERE 
            p.PageId = dp.PageId
            dp.DomainId = d.DomainId AND
            d.WebsiteId = w.WebsiteId AND
            tw.WebsiteId = w.WebsiteId AND 
             tw.TagId = T.TagId AND 
            t.TagId = "${tag_id}"`;


      let pages = await execute_query(query);


      for (let page of pages) {
        await update_page_admin(page.PageId, false);
      }


    }

    return success(website_id);
  } catch (err) {
    console.log(err);
    return error(err);
  }
};
