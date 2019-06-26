'use strict';

/**
 * Evaluators API module
 */

const _ = require('lodash');
const URL = require('url');
const htmlparser = require('htmlparser2');
const stew = new(require('stew-select')).Stew();

const {
  success,
  error
} = require('../lib/_response');

const {
  generate_hash
} = require('./_security');
const {
  write_file
} = require('./_util');
const evaluators = require('./_evaluators');

/**
 * PRIVATE FUNCTIONS
 */

function correct_url(url, https, www) {
  url = _.replace(url, 'http://', '');
  url = _.replace(url, 'https://', '');
  url = _.replace(url, 'www.', '');

  if (www) {
    if (https) {
      url = 'https://www.' + url;
    } else {
      url = 'http://www.' + url;
    }
  } else {
    if (https) {
      url = 'https://' + url;
    } else {
      url = 'http://' + url;
    }
  }

  const myUrl = URL.parse(url);

  return myUrl.protocol + '//' + myUrl.hostname + myUrl.pathname;
}

function generate_score(evaluation) {
  return '7.5';
}

function count_html_tags(html) {
  let html_tags = 0;

  const handler = new htmlparser.DomHandler((error, dom) => {
    if (error) {
      throw new Error();
    } else {
      let n = 0;
      const count = elem => {
        n++;
        for (let i = 0; i < _.size(elem['children']); i++) {
          if (elem['children'][i]['type'] === 'tag') {
            count(elem['children'][i]);
          }
        }
      }

      for (let i = 0; i < _.size(dom); i++) {
        if (dom[i]['type'] === 'tag') {
          count(dom[i]);
        }
      }
      html_tags = _.clone(n);
    }
  });

  const parser = new htmlparser.Parser(handler);
  parser.write(_.replace(html, /(\r\n|\n|\r|\t)/gm, ''));
  parser.end();

  return html_tags;
}

function calculate_css_rules(evaluation) {
  return 6;
}

function get_html_lang(html) {
  let lang = '';
  let _dom = {};

  const handler = new htmlparser.DomHandler((error, dom) => {
    if (error) {
      throw new Error();
    } else {
      _dom = _.clone(dom);
    }
  });

  const parser = new htmlparser.Parser(handler);
  parser.write(_.replace(html, /(\r\n|\n|\r|\t)/gm, ''));
  parser.end();

  const _html = stew.select(_dom, 'html')[0];

  if (_html && _html.attribs && _html.attribs.lang) {
    lang = _html.attribs.lang;
  }

  return lang;
}

function calculate_conform(results) {
  const tests = require('./tests.json');
  const tests_colors = require('./tests_colors.json');
  const errors = {
    A: 0,
    AA: 0,
    AAA: 0
  };
  for (const ee in results) {
    if (ee) {
      let level = _.toUpper(tests[ee]['level']);
      if (tests_colors[ee] === 'R') {
        errors[level]++;
      }
    }
  }

  return `${errors.A}@${errors.AA}@${errors.AAA}`;
}

function map_elems(evaluation) {
  const tests = require('./tests.json');
  const mapping = require('./rule-mapping.json');
  const elems = {};

  for (const assertion of evaluation.Assertion || []) {
    const test = assertion.test;
    const outcome = assertion.result.outcome;

    if (mapping[test] && mapping[test][outcome]) {
      const elem = mapping[test][outcome];
      const map_test = tests[elem]['test'];
      if (map_test) {
        if (elems[map_test]) {
          elems[map_test]++;
        } else {
          elems[map_test] = 1;
        }
      }
    }
  }

  return elems;
}

function convert_css_selector_to_xpath(selector) {
  let xpath = _.replace(selector, new RegExp(' > ', 'g'), '/');

  xpath = _.replace(xpath, /\:/g, '[');
  xpath = _.replace(xpath, /nth-of-type/g, '');
  xpath = _.replace(xpath, /\(/g, '');
  xpath = _.replace(xpath, /\)/g, ']');
  
  return '/' + xpath;
}

function map_nodes(evaluation) {
  const tests = require('./tests.json');
  const mapping = require('./rule-mapping.json');
  const { xpath } = require('./xpath');
  const nodes = {};

  for (const assertion of evaluation.Assertion || []) {
    const test = assertion.test;
    const outcome = assertion.result.outcome;

    if (mapping[test] && mapping[test][outcome]) {
      const elem = mapping[test][outcome];
      const map_test = tests[elem]['test'];
      if (map_test) {
        if (xpath[map_test]) {
          nodes[map_test] = xpath[map_test];
        } else {
          if (!nodes[map_test]) {
            nodes[map_test] = convert_css_selector_to_xpath(assertion.result.source[0].result.pointer);
          } else {
            nodes[map_test] += '|' + convert_css_selector_to_xpath(assertion.result.source[0].result.pointer);
          }
        }
      }
    }
  }

  return nodes;
}

function map_results(evaluation) {
  const mapping = require('./rule-mapping.json');
  const results = {};

  for (const assertion of evaluation.Assertion || []) {
    const test = assertion.test;
    const outcome = assertion.result.outcome;
    if (mapping[test] && mapping[test][outcome]) {
      results[mapping[test][outcome]] = 'something';
    }
  }

  return results;
}

function parse_evaluation(evaluation) {
  try {
    const report = {};
    report.pagecode = evaluation.postProcessingHTML;
    report.data = {};
    report.data.title = evaluation.earl.TestSubject.title;
    report.data.score = generate_score(evaluation.earl);
    report.data.rawUrl = evaluation.earl.TestSubject['@id'];
    report.data.elems = map_elems(evaluation.earl);
    report.data.nodes = map_nodes(evaluation.earl);
    report.data.date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    report.data.tot = {};
    report.data.tot.info = {};
    report.data.tot.info.url = _.clone(report.data.rawUrl);
    report.data.tot.info.title = _.clone(report.data.title);
    report.data.tot.info.score = _.clone(report.data.score);
    report.data.tot.info.date = _.clone(report.data.date);
    report.data.tot.info.htmlTags = count_html_tags(evaluation.postProcessingHTML);
    report.data.tot.info.size = encodeURI(report.pagecode).split(/%..|./).length - 1;
    report.data.tot.info.cssRules = calculate_css_rules(evaluation.earl);
    report.data.tot.info.encoding = 'utf-8';
    report.data.tot.info.lang = get_html_lang(evaluation.postProcessingHTML);
    report.data.tot.info.content = 'text/html';
    report.data.tot.info.hash = generate_hash(report.data.date);
    report.data.tot.info.tests = _.size(evaluation.earl.Assertion);
    report.data.tot.elems = _.clone(report.data.elems);
    report.data.tot.results = map_results(evaluation.earl);
    report.data.conform = calculate_conform(report.data.tot.results);
    report.data.tot.info.conform = _.clone(report.data.conform);

    return report;

    /*
    evaluation = JSON.parse(evaluation);
    evaluation.pagecode = Buffer.from(evaluation.pagecode, 'base64').toString();
    const tests = require('./tests.json');
    const tests_colors = require('./tests_colors.json');
    const errors = { A: 0, AA: 0, AAA: 0};
    for (const ee in evaluation.data.tot.results) {
      if (ee) {
        let level = _.toUpper(tests[ee]['level']);
        if (tests_colors[ee] === 'R') { 
          errors[level]++;
        }
      }
    }
    evaluation.data.conform = `${errors.A}@${errors.AA}@${errors.AAA}`;
    
    return evaluation;
    */
  } catch (err) {
    console.log(err);
    return error(err);
  }
}

/**
 * PUBLIC FUNCTIONS
 */

module.exports.execute_url_evaluation = async (url, evaluator) => {
  let evaluation = null;
  let _success = false;
  let _error = null;
  evaluator = 'qualweb';
  let www = true;
  let https = true;
  let exit = false;

  while (!exit) {
    if (!_success) {
      try {
        evaluation = await evaluators.run_evaluator(evaluator, [correct_url(url, https, www)]);
        _success = true;
        exit = true;
      } catch (err) {
        console.log(err);
        _error = err;

        if (https && www) {
          www = false;
        } else if (https && !www) {
          https = false;
          www = true;
        } else if (!https && www) {
          www = false;
        } else {
          exit = true;
        }
      }
    }
  }

  if (_success) {
    return success(parse_evaluation(evaluation));
  } else {
    return error(_error);
  }
}

module.exports.execute_html_evaluation = async (html, evaluator) => {
  try {
    const fileHash = generate_hash(html);
    const path = `${__dirname}/../evaluators/${evaluator}/${fileHash}.html`;
    await write_file(path, html);
    const evaluation = await evaluators.run_evaluator(evaluator, ['html', file]);

    return parse_evaluation(evaluation);
  } catch (err) {
    console.log(err);
    return error(err);
  }
}