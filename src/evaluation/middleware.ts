import * as htmlparser from 'htmlparser2';
import * as CSSselect from 'css-select';
import clone from 'lodash.clone';
import * as qualweb from './qualweb';

import tests from './tests';
import testsColors from './testsColors';

import { generateMd5Hash } from '../lib/security';
import { getElementsMapping } from './mapping';

function generateScore(report: any): string {
  const tests = require('./tests.json');

  const scores = new Array();

  let finalScore = 0;

  for (const test in report['data'].tot.results || {}) {
    const level = tests[test]['level'].toLowerCase();
    const nSCs = tests[test]['scs'].includes(',');
    const V = (level === 'a' ? 0.9 : level === 'aa' ? 0.5 : 0.1);
    const VFinal = nSCs ? V + 0.1 : V - 0.1;
    const C = Number.parseFloat(tests[test]['trust']);

    const P = VFinal * C;

    const E = report['data'].elems[tests[test]['elem']];
    const S = report['data'].elems[tests[test]['test']];
    const N = tests[test]['score'];

    let R = 0;

    if (tests[test]['type'] === 'prop' && E && S) {
      R = N * (1 - (S / E)) * P;
    } else if (tests[test]['type'] === 'decr') {
      const T = tests[test]['top'];
      const F = tests[test]['steps'];

      const errors = S - T > 0 ? Math.round(((S - T) / F)) : 0;

      R = (N - errors) * P;
    } else {
      R = N * P;
    }

    scores.push(R);
    finalScore += R;
  }

  console.log(scores);
  console.log(finalScore / scores.length);

  return (Math.round((finalScore / scores.length) * 10) / 10).toString();
}

function calculateCssRules(evaluation: any): number {
  const cssReport = evaluation.modules['css-techniques'];
  return Object.keys(cssReport.techniques).length;
}

function getHtmlLang(html: string): string {
  let lang = '';
  let _dom = {};

  const handler = new htmlparser.DomHandler((error, dom) => {
    if (error) {
      throw new Error();
    } else {
      _dom = clone(dom);
    }
  });

  const parser = new htmlparser.Parser(handler);
  parser.write(html.replace(/(\r\n|\n|\r|\t)/gm, ''));
  parser.end();

  const htmlElement: any = CSSselect.selectOne('html', _dom);

  if (htmlElement && htmlElement.attribs && htmlElement.attribs.lang) {
    lang = htmlElement.attribs.lang;
  }

  return lang;
}

function calculateConform(results: any): string {
  const errors = {
    A: 0,
    AA: 0,
    AAA: 0
  };
  for (const ee in results || {}) {
    if (ee) {
      let level = tests[ee]['level'].toUpperCase();
      if (testsColors[ee] === 'R') {
        errors[level]++;
      }
    }
  }

  return `${errors.A}@${errors.AA}@${errors.AAA}`;
}

function parseEvaluation(evaluation: any): any {
  const report: any = {};
    
  report.pagecode = evaluation.report.system.page.dom.processed.html.plain;
  report['data'] = {};
  report['data'].title = evaluation.report.system.page.dom.processed.title;
  report['data'].rawUrl = evaluation.earlReport.graph[0].source;
  const { elements, results, nodes } = getElementsMapping(evaluation.report);
  report['data'].elems = clone(elements);
  report['data'].nodes = clone(nodes);
  report['data'].date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  report['data'].tot = {};
  report['data'].tot.info = {};
  report['data'].tot.info.url = clone(report['data'].rawUrl);
  report['data'].tot.info.title = clone(report['data'].title);
  report['data'].tot.info.date = clone(report['data'].date);
  report['data'].tot.info.htmlTags = evaluation.report.system.page.dom.processed.elementCount; //count_html_tags(evaluation.postProcessingHTML);
  report['data'].tot.info.size = encodeURI(report.pagecode).split(/%..|./).length - 1;
  report['data'].tot.info.cssRules = calculateCssRules(evaluation.report);
  report['data'].tot.info.encoding = 'utf-8';
  report['data'].tot.info.lang = getHtmlLang(evaluation.report.system.page.dom.processed.html.plain);
  report['data'].tot.info.content = 'text/html';
  report['data'].tot.info.hash = generateMd5Hash(report['data'].date);
  report['data'].tot.info.tests = evaluation.earlReport.graph[0].assertions.length;
  report['data'].tot.elems = clone(report['data'].elems);
  report['data'].tot.results = clone(results); // map_results(evaluation.earlReport);
  report['data'].conform = calculateConform(report['data'].tot.results);
  report['data'].tot.info.conform = clone(report['data'].conform);

  report['data'].score = generateScore(report);
  report['data'].tot.info.score = clone(report['data'].score);

  return report;
}

/**
 * PUBLIC FUNCTIONS
 */

export async function executeUrlEvaluation(url: string): Promise<any> {
  const evaluation = await qualweb.init({ url });
  return parseEvaluation(evaluation);
}

export async function executeHtmlEvaluation(html: string): Promise<any> {
  //TODO: implementar no qualweb - avaliar codigo HTML enviado
}