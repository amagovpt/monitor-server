'use strict';

/**
 * Evaluation Model
 */

/**
 * Libraries and modules
 */
const _ = require('lodash');
const { success, error } = require('../lib/_response');
const { execute_query } = require('../lib/_database');
const { execute_url_evaluation, execute_html_evaluation } = require('../lib/_middleware');

module.exports.evaluate_url = async (url, evaluator) => {
  try {
    const evaluation = await execute_url_evaluation(url, evaluator);
    return evaluation;
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.evaluate_html = async (html, evaluator) => {
  try {
    const evaluation = await execute_html_evaluation(html, evaluator);
    return success(evaluation);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}
//AQUI
module.exports.evaluate_url_and_save = async (page_id, url, show_to) => {
  try {
    let evaluation_result = await execute_url_evaluation(url, 'examinator');

    if (evaluation_result.success === 1) {
      let evaluation = evaluation_result.result;
      const webpage = Buffer.from(evaluation.pagecode).toString('base64');
      const data = evaluation.data;

      data.title = data.title.replace(/"/g, '');

      const conform = _.split(data.conform, '@');
      const tot = Buffer.from(JSON.stringify(data.tot)).toString('base64');
      const nodes = Buffer.from(JSON.stringify(data.nodes)).toString('base64');
      const elems = Buffer.from(JSON.stringify(data.elems)).toString('base64');

      const query = `
        INSERT INTO 
          Evaluation (PageId, Title, Score, Pagecode, Tot, Nodes, Errors, A, AA, AAA, Evaluation_Date,Show_To)
        VALUES 
          ("${page_id}", "${data.title}", "${data.score}", "${webpage}", "${tot}", "${nodes}", "${elems}", "${conform[0]}", 
          "${conform[1]}", "${conform[2]}", "${data.date}","${show_to}")`;

      await execute_query(query);
      return evaluation_result;
    } else {
      return evaluation_result;
    }
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}
//AQUI diferenca entre este e de baixo
module.exports.get_newest_evaluation = async (user_id, tag, website, url) => {
  try {
    const query = `SELECT e.* 
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
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
        LOWER(p.Uri) = "${_.toLower(url)}" AND 
        e.PageId = p.PageId
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`;
    let evaluation = await execute_query(query);
    evaluation = evaluation[0];
    
    const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());

    return success(
      { pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date
    }});
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.get_my_monitor_newest_evaluation = async (user_id, website, url) => {
  try {
    const query = `SELECT e.* 
      FROM
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p,
        Evaluation as e
      WHERE
        LOWER(w.Name) = "${_.toLower(website)}" AND
        w.UserId = "${user_id}" AND
        d.WebsiteId = w.WebsiteId AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        LOWER(p.Uri) = "${_.toLower(url)}" AND 
        e.PageId = p.PageId AND 
        e.Show_To LIKE '_1'
      ORDER BY e.Evaluation_Date DESC 
      LIMIT 1`;
    let evaluation = await execute_query(query);
    evaluation = evaluation[0];
    
    const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());

    return success(
      { pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date
    }});
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}
//AQUI
//perguntar se 11 eh possivel
module.exports.get_all_page_evaluations = async (page, type) => {
  try {
    let query = '';
    
    if (type === 'admin') {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = "${_.toLower(page)}" AND
          p.Show_In LIKE "1%%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "1_" AND
          dp.PageId = p.PageId AND
          d.DomainId = dp.DomainId AND
          w.WebsiteId = d.WebsiteId AND
          w.Deleted = "0" AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) = "monitor"))
        ORDER BY e.Evaluation_Date DESC`;
    } else if (type === 'monitor') {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          User as u,
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = "${_.toLower(page)}" AND
          p.Show_In LIKE "11%" AND
          e.PageId = p.PageId AND
          e.Show_To LIKE "_1" AND
          dp.PageId = p.PageId AND
          d.DomainId = dp.DomainId AND
          w.WebsiteId = d.WebsiteId AND
          u.UserId = w.UserId AND 
          LOWER(u.Type) = "monitor"
        ORDER BY e.Evaluation_Date DESC`;
    } else if (type === 'studies') {
      query = `SELECT distinct e.EvaluationId, e.Score, e.A, e.AA, e.AAA, e.Evaluation_Date
        FROM
          Page as p,
          Evaluation as e
        WHERE
          LOWER(p.Uri) = "${_.toLower(page)}" AND
          e.PageId = p.PageId
        ORDER BY e.Evaluation_Date DESC
        LIMIT 1`;
    } else {
      query = `SELECT * FROM Evaluation WHERE EvaluationId = -1`;
    }

    const evaluations = await execute_query(query);

    return success(evaluations);
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.get_evaluation = async (url, id) => {
  try {
    const query = `SELECT * FROM Evaluation WHERE EvaluationId = "${id}" LIMIT 1`;
    
    let evaluation = await execute_query(query);
    evaluation = evaluation[0];
   
    const tot = JSON.parse(Buffer.from(evaluation.Tot, 'base64').toString());

    return success(
      { pagecode: Buffer.from(evaluation.Pagecode, 'base64').toString(),
        data: {
          title: evaluation.Title,
          score: evaluation.Score,
          rawUrl: url,
          tot: tot,
          nodes: JSON.parse(Buffer.from(evaluation.Nodes, 'base64').toString()),
          conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
          elems: tot.elems,
          date: evaluation.Evaluation_Date
    }});
  } catch(err) {
    console.log(err);
    throw error(err);
  }
}

module.exports.delete_evaluation = async (evaluation_id) => {
  try {
    const query = `DELETE FROM Evaluation WHERE EvaluationId = "${evaluation_id}"`;
    await execute_query(query);

    return success(evaluation_id);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

module.exports.save_url_evaluation = async (url, evaluation, show_to) => {
  try {
    evaluation = evaluation.result;

    url = _.replace(url, 'http://', '');
    url = _.replace(url, 'https://', '');
    url = _.replace(url, 'www.', '');

    let domain = '';
    if (_.includes(url, '/')) {
      domain = _.split(url, '/')[0];
    } else {
      domain = url;
    }

    let query = `
      SELECT distinct d.DomainId, d.Url 
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
    const domains = await execute_query(query);

    if (_.size(domains) > 0) {
      let existing_domain = domains[0];

      query = `SELECT PageId FROM Page WHERE LOWER(Uri) = "${_.toLower(url)}" LIMIT 1`;
      let pages = await execute_query(query);

      let page_id = -1;

      if (_.size(pages) > 0) {
        page_id = pages[0].PageId;
      } else {
        const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        query = `INSERT INTO Page (Uri, Show_In, Creation_Date) VALUES ("${url}", "000", "${date}")`;
        let newPage = await execute_query(query);

        query = `INSERT INTO DomainPage (DomainId, PageId) VALUES ("${existing_domain.DomainId}", "${newPage.insertId}")`;
        await execute_query(query);

        page_id = newPage.insertId;
      }

      const webpage = Buffer.from(evaluation.pagecode).toString('base64');
      const data = evaluation.data;
      
      data.title = data.title.replace(/"/g, '');

      const conform = _.split(data.conform, '@');
      const tot = Buffer.from(JSON.stringify(data.tot)).toString('base64');
      const nodes = Buffer.from(JSON.stringify(data.nodes)).toString('base64');
      const elems = Buffer.from(JSON.stringify(data.elems)).toString('base64');

      query = `
        INSERT INTO 
          Evaluation (PageId, Title, Score, Pagecode, Tot, Nodes, Errors, A, AA, AAA, Evaluation_Date, Show_To)
        VALUES 
          ("${page_id}", "${data.title}", "${data.score}", "${webpage}", "${tot}", "${nodes}", "${elems}", "${conform[0]}", 
           "${conform[1]}", "${conform[2]}", "${data.date}", "${show_to}")`;

      await execute_query(query);
    }

    return success();
  } catch(err) {
    console.log(err);
    return error(err);
  }
}

module.exports.save_page_evaluation = async (page_id, evaluation, show_to) => {
  try {
    evaluation = evaluation.result;

    const webpage = Buffer.from(evaluation.pagecode).toString('base64');
    const data = evaluation.data;

    data.title = data.title.replace(/"/g, '');
    console.log('1 ' + data.title);

    const conform = _.split(data.conform, '@');
    const tot = Buffer.from(JSON.stringify(data.tot)).toString('base64');
    const nodes = Buffer.from(JSON.stringify(data.nodes)).toString('base64');
    const elems = Buffer.from(JSON.stringify(data.elems)).toString('base64');

    const query = `
      INSERT INTO 
        Evaluation (PageId, Title, Score, Pagecode, Tot, Nodes, Errors, A, AA, AAA, Evaluation_Date, Show_To)
      VALUES 
        ("${page_id}", "${data.title}", "${data.score}", "${webpage}", "${tot}", "${nodes}", "${elems}", "${conform[0]}", 
          "${conform[1]}", "${conform[2]}", "${data.date}","${show_to}")`;

    const newEvaluation = await execute_query(query);

    return success(newEvaluation.insertId);
  } catch(err) {
    console.log(err);
    return error(err);
  }
}
