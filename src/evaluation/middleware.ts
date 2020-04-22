import * as htmlparser from 'htmlparser2';
import * as CSSselect from 'css-select';
import clone from 'lodash.clone';
import * as qualweb from './qualweb';

import tests from './tests';
import testsColors from './testsColors';

import { generateMd5Hash } from '../lib/security';
import { getElementsMapping } from './mapping';

function generateScore(report: any): string {

  let SS = 0;
  let PP = 0;

  for (const test in tests || {}) {
    const value = tests[test];

    if (report.data.elems.frame) {
      if (test in ['a_01b', 'a_02a', 'hx_01a', 'layout_01a', 'layout_02a']) {
        continue;
      }
    }

    let calc = false;
    switch (value['type']) {
      case 'true':
      case 'decr':
        if ((value['elem'] === 'all') || report.data['elems'][test] !== undefined) {
          if (report.data['elems'][value['test']] !== undefined) {
            calc = true;
          }
        }
        break;
      case 'fals':
        if ((value['elem'] === 'all') || report.data['elems'][test]) {
          if (report.data['elems'][value['test']] === undefined) {
            calc = true;
          }
        }
        break;
      case 'prop':
        if (report.data['elems'][test] && report.data['elems'][value['test']]) {
          calc = true;
        }
        break;
    }

    if (calc) {
      const C = parseFloat(tests[test]['trust']);

      const E = report['data'].elems[test];
      const S = report['data'].elems[tests[test]['test']];

      let R = 0;
      let N = 0;
      for (const w of value['dis']) {
        if (w > 1) {
          if (tests[test]['type'] === 'prop') {
            R += +(w * C).toFixed(2);
            const op = tests[test]['score'] * (1 - (S / E));
            N = op < 1 ? 1 : op;
          } else if (tests[test]['type'] === 'decr') {
            const T = tests[test]['top'];
            const F = tests[test]['steps'];
    
            const errors = S > T ? (S - T) / F : 0;
            
            R += +(w * C).toFixed(2);
            const op = (tests[test]['score'] - errors);
            N = op < 1 ? 1 : op;
          } else if (tests[test]['type'] === 'true' || tests[test]['type'] === 'fals') {
            R += +(w * C).toFixed(2);
            N = tests[test]['score'];
          }
        }
      }

      PP += +(R / 5).toFixed(2);
      SS += +(N * +(R / 5).toFixed(2)).toFixed(1);
    }
  }

  return (SS / PP).toFixed(1);
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

  const { elements, results, nodes } = getElementsMapping(evaluation);

  const report: any = {};
    
  report.pagecode = evaluation.system.page.dom.processed.html.plain;
  report['data'] = {};
  report['data'].title = evaluation.system.page.dom.processed.title;
  report['data'].rawUrl = evaluation.system.url.completeUrl;
  report['data'].elems = clone(elements);
  report['data'].nodes = clone(nodes);
  report['data'].date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  report['data'].tot = {};
  report['data'].tot.info = {};
  report['data'].tot.info.url = clone(report['data'].rawUrl);
  report['data'].tot.info.title = clone(report['data'].title);
  report['data'].tot.info.date = clone(report['data'].date);
  report['data'].tot.info.htmlTags = evaluation.system.page.dom.processed.elementCount; //count_html_tags(evaluation.postProcessingHTML);
  report['data'].tot.info.size = encodeURI(report.pagecode).split(/%..|./).length - 1;
  report['data'].tot.info.cssRules = calculateCssRules(evaluation);
  report['data'].tot.info.encoding = 'utf-8';
  report['data'].tot.info.lang = getHtmlLang(evaluation.system.page.dom.processed.html.plain);
  report['data'].tot.info.content = 'text/html';
  report['data'].tot.info.hash = generateMd5Hash(report['data'].date);
  report['data'].tot.info.tests = Object.keys(results).length;
  report['data'].tot.elems = clone(report['data'].elems);
  report['data'].tot.results = clone(results);
  report['data'].conform = calculateConform(report['data'].tot.results);
  report['data'].tot.info.conform = clone(report['data'].conform);

  report['data'].score = generateScore(report);
  report['data'].tot.info.score = clone(report['data'].score);

  return report;
}

export async function executeUrlEvaluation(url: string): Promise<any> {
  const evaluation = await qualweb.init({ url });
  return parseEvaluation(evaluation);
}

export async function executeHtmlEvaluation(html: string): Promise<any> {
  //TODO: implementar no qualweb - avaliar codigo HTML enviado
}