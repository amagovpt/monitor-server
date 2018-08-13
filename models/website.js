'use strict';

/**
 * Website Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');

const { evaluate_url_and_save } = require('./evaluation');

/**
 * Create functions
 */

module.exports.create_website = async (name, domain, entity_id, user_id, tags) => {
  try {
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let query = `INSERT INTO Website (Name, Creation_Date) VALUES ("${name}", "${date}")`;
    
    if (entity_id !== 'null' && user_id !== 'null') {
      query = `INSERT INTO Website (EntityId, UserId, Name, Creation_Date) 
      VALUES ("${entity_id}", "${user_id}", "${name}", "${date}")`;
    } else if (entity_id !== 'null') {
       query = `INSERT INTO Website (EntityId, Name, Creation_Date) 
      VALUES ("${entity_id}", "${name}", "${date}")`;
    } else if (user_id !== 'null') {
       query = `INSERT INTO Website (UserId, Name, Creation_Date) 
      VALUES ("${user_id}", "${name}", "${date}")`;
    }

    const website = await execute_query(query);

    domain = _.replace(domain, 'https://', '');
    domain = _.replace(domain, 'http://', '');
    domain = _.replace(domain, 'www.', '');

    if (_.endsWith(domain, '/')) {
      domain = domain.substring(0, _.size(domain)-1);
    }

    query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) 
      VALUES ("${website.insertId}", "${domain}", "${date}", "1")`;

    await execute_query(query);

    for (let t of tags) {
      query = `INSERT INTO TagWebsite (TagId, WebsiteId) VALUES ("${t}", "${website.insertId}")`;
      await execute_query(query);
    }

    return success(website.insertId);
  } catch(err) {
    console.log(err);
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
    return success(_.size(website) === 1);
  } catch(err) {
    return error(err);
  }
}

module.exports.get_all_websites = async () => {
  try {
    const query = `SELECT w.*, e.Long_Name as Entity, u.Email as User 
      FROM Website as w
      LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
      LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      GROUP BY w.WebsiteId`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_official_websites = async () => {
  try {
    const query = `SELECT distinct w.* FROM Website as w, User as u 
      WHERE u.UserId = w.UserId AND u.Type != 'studies' OR w.UserId IS NULL`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_websites_without_entity = async () => {
  try {
    const query = `SELECT * FROM Website WHERE EntityId IS NULL`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_websites_without_user = async () => {
  try {
    const query = `SELECT * FROM Website WHERE UserId IS NULL`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}


module.exports.get_all_user_websites = async (user) => {
  try {
    const query = `SELECT w.*, e.Long_Name as Entity, u.Email as User 
      FROM 
        Website as w
        LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId,
        User as u
      WHERE
        u.Email = "${user}" AND
        w.UserId = u.UserId
      GROUP BY w.WebsiteId`;
    const websites = await execute_query(query);

    return success(websites);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_tag_websites = async (user, tag) => {
  try {
    let query = '';
    if (user === 'admin') {
      query = `SELECT w.*, e.Long_Name as Entity, u.Email as User 
        FROM 
          Website as w
          LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
          LEFT OUTER JOIN User as u ON u.UserId = w.UserId,
          Tag as t,
          TagWebsite as tw
        WHERE
          t.Name = "${tag}" AND
          t.UserId IS NULL AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId
        GROUP BY w.WebsiteId`;
    } else {
      query = `SELECT w.*, e.Long_Name as Entity, u.Email as User 
        FROM 
          Website as w
          LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId,
          User as u,
          Tag as t,
          TagWebsite as tw
        WHERE
          t.Name = "${tag}" AND
          u.Email = "${user}" AND
          t.UserId = u.UserId AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId
        GROUP BY w.WebsiteId`;
    }

    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.get_all_entity_websites = async (entity) => {
  try {
    const query = `SELECT w.*, e.Long_Name as Entity, u.Email as User 
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId,
        Entity as e
      WHERE
        e.EntityId = w.EntityId AND
        e.Long_Name = "${entity}"
      GROUP BY w.WebsiteId`;
    const websites = await execute_query(query);
    return success(websites);
  } catch(err) {
    console.log(err);
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

module.exports.get_website_current_domain = async (websiteId) => {
  try {
    const query = `SELECT Url FROM Domain WHERE WebsiteId = "${websiteId}" AND Active = 1 LIMIT 1`;
    const domain = await execute_query(query);
    return success(_.size(domain) > 0 ? domain[0].Url : '');
  } catch(err) {
    return error(err)
  }
}

/*module.exports.get_all_user_websites = async (user_id) => {
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
}*/

/**
 * ACCESS STUDIES
 */

module.exports.get_access_studies_user_websites_from_other_tags = async (user_id, tag) => {
  try {
    const query = `SELECT
        distinct w.*,
        d.Url,
        t.Name as TagName
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        t.Name != "${tag}" AND
        t.UserId = "${user_id}" AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = "${user_id}" AND
        w.Name NOT IN (
          SELECT 
            w2.Name 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2
          WHERE
            t2.Name = "${tag}" AND
            t2.UserId = "${user_id}" AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = "${user_id}"
        ) AND
        d.WebsiteId = w.WebsiteId AND
        d.Url NOT IN (
          SELECT 
            d2.Url 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2,
            Domain as d2
          WHERE
            t2.Name = "${tag}" AND
            t2.UserId = "${user_id}" AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = "${user_id}" AND
            d2.WebsiteId = w2.WebsiteId
        );`;
    const websites = await execute_query(query);

    return success(websites);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

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

module.exports.get_access_studies_user_tag_websites_data = async (user_id, tag) => {
  try {
    const query = `SELECT
        w.WebsiteId,
        w.Name,
        d.Url,
        p.Uri,
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
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        e.PageId = p.PageId AND
        e.Evaluation_Date IN (SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId);`;
    const websites = await execute_query(query);

    return success(websites);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.add_access_studies_user_tag_existing_website = async (user_id, tag, websitesId) => {
  try {
    for (let id of websitesId) {
      let query = `INSERT INTO TagWebsite (TagId, WebsiteId) 
        SELECT TagId, "${id}" FROM Tag WHERE Name = "${tag}" AND UserId = "${user_id}"`;
      await execute_query(query);
    }

    return await this.get_access_studies_user_tag_websites(user_id, tag);
  } catch(err) {
    console.log(err);
    throw error(error);
  }
}

module.exports.add_access_studies_user_tag_new_website = async (user_id, tag, name, domain, pages) => {
  try {
    let date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let query = `INSERT INTO Website (UserId, Name, Creation_Date) VALUES ("${user_id}", "${name}", "${date}")`;
    const website = await execute_query(query);

    query = `INSERT INTO TagWebsite (TagId, WebsiteId) SELECT TagId, "${website.insertId}" FROM Tag WHERE Name = "${tag}"`;
    await execute_query(query);

    query = `INSERT INTO Domain (WebsiteId, Url, Start_Date, Active) VALUES ("${website.insertId}", "${domain}", "${date}", "1")`;
    const _domain = await execute_query(query);

    const _size = _.size(pages);
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

module.exports.remove_access_studies_user_tag_websites = async (user_id, tag, websitesId) => {
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

    return success(_.size(domain) > 0 ? domain[0].Url : null);
  } catch(err) {
    console.log(err);
    throw error(err);
  } 
}