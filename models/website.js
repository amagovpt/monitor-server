'use strict';

/**
 * Website Model
 */

/**
 * Libraries and modules
 */
const { size, map } = require('lodash');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

/**
 * Create functions
 */

module.exports.create_website = async (name, domain, entity_id, user_id, tags) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let query = `INSERT INTO Website (Name, Creation_Date) VALUES ("${name}", "${date}")`;
    
    if (entity_id && user_id) {
      query = `INSERT INTO Website (EntityId, UserId, Name, Creation_Date) 
      VALUES ("${entity_id}", "${user_id}", "${name}", "${date}")`;
    } else if (entity_id) {
       query = `INSERT INTO Website (EntityId, Name, Creation_Date) 
      VALUES ("${entity_id}", "${name}", "${date}")`;
    } else if (user_id) {
       query = `INSERT INTO Website (UserId, Name, Creation_Date) 
      VALUES ("${user_id}", "${name}", "${date}")`;
    }

    const website = await execute_query(query);

    query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
      VALUES ("${website.insertId}", "${domain}", "${date}", "1")`;

    await execute_query(query);

    const size = size(tags);
    for (let i = 0 ; i < size ; i++) {
      query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${tags[i]}", "${website.insertId}")`;
      await execute_query(query);
    }

    return success(website.insertId);
  } catch(err) {
    return error(err);
  }
}

/**
 * Get functions
 */

module.exports.website_name_exists = async (name) => {
  try {
    const query = `SELECT * FROM Website WHERE Name = "${name}" LIMIT 1`;
    const website = await execute_query(query);
    return success(size(website) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_websites = async () => {
  try {
    const query = `SELECT * FROM Website`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_websites_without_entity = async () => {
  try {
    const query = `SELECT * FROM Website WHERE EntityId IS NULL`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_websites_without_user = async () => {
  try {
    const query = `SELECT * FROM Website WHERE UserId IS NULL`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_websites_info = async () => {
  try {
    const query = `
      SELECT 
        w.WebsiteId,
        w.Name, 
        w.Creation_Date,
        e.Long_Name as Entity,
        u.Email as User,
        d.Url as Current_Domain,
        COUNT(distinct p.PageId) as Pages,
        COUNT(distinct tw.TagId) as Tags
      FROM 
          Website as w
      LEFT OUTER JOIN Entity as e ON e.EntityId =  w.EntityId
      LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
      LEFT OUTER JOIN Page as p ON p.DomainId = d.DomainId
      LEFT OUTER JOIN TagWebsite as tw ON tw.WebsiteId = w.WebsiteId
      GROUP BY w.WebsiteId, d.Url`;

    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    return error(err)
  }
}

module.exports.get_website_active_domain = async (id) => {
  try {
    const query = `SELECT Url FROM Domain WHERE WebsiteId = "${id}" AND Active = 1 LIMIT 1`;
    const domain = await execute_query(query);
    return success(domain);
  } catch(err) {
    return error(err)
  }
}

module.exports.get_all_user_websites = async (user_id) => {
  try {
    const query = `SELECT w.*, COUNT(distinct p.PageId) as Pages 
      FROM 
        Website as w, 
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
        LEFT OUTER JOIN Page as p ON p.DomainId = d.DomainId
      WHERE 
        w.UserId = "${user_id}"
      LIMIT 1`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    return error(err)
  }
}

/**
 * ACCESS STUDIES
 */

module.exports.get_access_studies_user_tag_websites = async (user_id, tag) => {
  try {
    const query = `SELECT 
        w.WebsiteId,
        w.Name,
        d.Url,
        COUNT(distinct p.PageId) as Pages,
        AVG(distinct e.Score) as Score
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId
        LEFT OUTER JOIN Evaluation as e ON e.Evaluation_Date IN (
          SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId
        )
      WHERE
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId
      GROUP BY w.WebsiteId, d.Url`;
    const websites = await execute_query(query);

    return success(websites);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.add_access_studies_user_tag_website = async (user_id, tag, name, domain, pages) => {
  console.log(pages);
  try {
    let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let query = `INSERT INTO Website (UserId, Name, Creation_Date) VALUES ("${user_id}", "${name}", "${date}")`;
    const website = await execute_query(query);

    query = `INSERT INTO TagWebsite (TagId, WebsiteId) SELECT TagId, "${website.insertId}" FROM Tag WHERE Name = "${tag}"`;
    await execute_query(query);

    query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) VALUES ("${website.insertId}", "${domain}", "${date}", "1")`;
    const _domain = await execute_query(query);

    const _size = size(pages);
    for (let i = 0 ; i < _size ; i++) {
      query = `SELECT PageId FROM Page WHERE Uri = "${pages[i]}" LIMIT 1`;
      let page = await execute_query(query);

      if (size(page) === 0) {
        query = `INSERT INTO Page (Uri, Creation_Date) VALUES ("${pages[i]}", "${date}")`;
        let newPage = await execute_query(query);
        
        await evaluate_url_and_save(newPage.insertId, pages[i]);

        query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${_domain.insertId}", "${newPage.insertId}")`;
        await execute_query(query);
      } else {
        query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${_domain.insertId}", "${page[0].PageId}")`;
        await execute_query(query);
      }
    }

    return await this.get_access_studies_user_tag_websites(user_id, tag);
  } catch(err) {
    console.log(err);
    throw error(error);
  }
}

module.exports.access_studies_user_remove_tag_websites = async (user_id, tag, websitesId) => {
  try {
    const query = `DELETE FROM Website WHERE WebsiteId IN ("${websitesId}")`;
    await execute_query(query);

    return await this.get_access_studies_user_tag_websites(user_id, tag);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.access_studies_user_tag_website_name_exists = async (user_id, tag, name) => {
  try {
    const query = `SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = "${user_id}" AND
        w.Name = "${name}"
      LIMIT 1`;
    const websites = await execute_query(query);

    return success(size(websites) > 0);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.access_studies_user_tag_website_domain_exists = async (user_id, tag, domain) => {
  try {
    const query = `SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = "${user_id}" AND
        d.DomainId = w.WebsiteId AND
        d.Url = "${domain}"
      LIMIT 1`;
    const websites = await execute_query(query);

    return success(size(websites) > 0);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.get_access_studies_user_tag_website_domain = async (user_id, tag, website) => {
  try {
    const query = `SELECT d.Url FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        t.Name = "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = "${user_id}" AND
        w.Name = "${website}" AND
        d.DomainId = w.WebsiteId
      LIMIT 1`;
    const domain = await execute_query(query);

    return success(size(domain) > 0 ? domain[0].Url : null);
  } catch(err) {
    console.log(err);
    throw error(err);
  } 
}