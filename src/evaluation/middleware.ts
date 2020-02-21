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

const STATIC_EVALUATION = {"pagecode":"<!doctype html><html class=home lang=en><meta charset=utf-8><meta content=\"A JavaScript utility library delivering consistency, modularity, performance, & extras.\" name=description><meta content=#3492ff name=theme-color><meta content=\"width=device-width,initial-scale=1\" name=viewport><title>Lodash</title><link href=/icons/apple-touch-180x180.png rel=apple-touch-icon sizes=180x180><link href=https://github.com/lodash/lodash/commits/master.atom rel=feed type=application/atom+xml><link href=/icons/favicon-32x32.png rel=icon sizes=32x32 type=image/png><link href=\"data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEVMaXExk//ImxjuAAAAAXRSTlMAQObYZgAAAA9JREFUeAFjIBLU/2MC0wALJgGAaiAmLQAAAABJRU5ErkJggg==\" rel=icon sizes=16x16 type=image/png><link href=/manifest.webmanifest rel=manifest><link href=/icons/safari-pinned-tab-16x16.svg rel=mask-icon color=#3492ff><link href=/docs/4.17.15 rel=prerender pr=1.0><link href=/assets/css/main.css rel=stylesheet><noscript><link href=/vendor/cdn.jsdelivr.net/fontawesome/4.7.0/css/font-awesome.min.css rel=stylesheet></noscript><script async src=/assets/js/boot.js></script><body class=layout-default><header><div class=container><div class=\"header-section logo-section\"><div class=logo><a href=/ title=Lodash>Lodash</a></div><div class=header-group><h1>Lodash</h1><h2>A modern JavaScript utility library delivering modularity, performance & extras.</h2></div></div><div class=header-section><a href=/docs/ class=\"btn primary\">Documentation</a> <a href=https://github.com/lodash/lodash/wiki/FP-Guide class=btn>FP Guide</a></div></div></header><div class=\"container main\"><section><div class=\"highlight js intro\"><pre><div>_<span class=\"delimiter method\">.</span><span class=name>defaults</span>({ <span class=string>'a'</span>: <span class=numeric>1</span> }<span class=delimiter>,</span> { <span class=string>'a'</span>: <span class=numeric>3</span><span class=delimiter>,</span> <span class=string>'b'</span>: <span class=numeric>2</span> });</div><div><span class=comment>// → { 'a': 1, 'b': 2 }</span></div><div>_<span class=\"delimiter method\">.</span><span class=name>partition</span>([<span class=numeric>1</span><span class=delimiter>,</span> <span class=numeric>2</span><span class=delimiter>,</span> <span class=numeric>3</span><span class=delimiter>,</span> <span class=numeric>4</span>]<span class=delimiter>,</span> n <span class=type>=></span> n % <span class=numeric>2</span>);</div><div><span class=comment>// → [[1, 3], [2, 4]]</span></div></pre></div></section><section><p id=social></section><section><h2>Download</h2><ul id=download-links><li><i class=\"fa fa-download\" aria-hidden=true></i><a href=https://raw.githubusercontent.com/lodash/lodash/4.17.15-npm/core.js>Core build</a> (<a href=https://raw.githubusercontent.com/lodash/lodash/4.17.15-npm/core.min.js>~4kB gzipped</a>)<li><i class=\"fa fa-download\" aria-hidden=true></i><a href=https://raw.githubusercontent.com/lodash/lodash/4.17.15-npm/lodash.js>Full build</a> (<a href=https://raw.githubusercontent.com/lodash/lodash/4.17.15-npm/lodash.min.js>~24kB gzipped</a>)<li><i class=\"fa fa-link\" aria-hidden=true></i><a href=https://www.jsdelivr.com/projects/lodash>CDN copies</a></ul><p><span class=rwd-line>Lodash is released under the <a href=https://raw.githubusercontent.com/lodash/lodash/4.17.15-npm/LICENSE>MIT license</a> & supports modern environments.</span> <span class=rwd-line>Review the <a href=https://github.com/lodash/lodash/wiki/Build-Differences>build differences</a> & pick one that’s right for you.</span></section><section><h2>Installation</h2><p>In a browser:<div class=\"highlight html\"><pre>&lt;script src=<span class=string>\"lodash.js\"</span>>&lt;/script></pre></div><p>Using npm:<div class=\"highlight shell\"><pre><div>$ npm i -g npm</div><div>$ npm i --save lodash</div></pre></div><p>In Node.js:<div class=\"highlight js\"><pre><div><span class=comment>// Load the full build.</span></div><div><span class=type>var</span> _ = <span class=support>require</span>(<span class=string>'lodash'</span>);</div><div><span class=comment>// Load the core build.</span></div><div><span class=type>var</span> _ = <span class=support>require</span>(<span class=string>'lodash/core'</span>);</div><div><span class=comment>// Load the FP build for immutable auto-curried iteratee-first data-last methods.</span></div><div><span class=type>var</span> fp = <span class=support>require</span>(<span class=string>'lodash/fp'</span>);</div><div> </div><div><span class=comment>// Load method categories.</span></div><div><span class=type>var</span> array = <span class=support>require</span>(<span class=string>'lodash/array'</span>);</div><div><span class=type>var</span> object = <span class=support>require</span>(<span class=string>'lodash/fp/object'</span>);</div><div> </div><div><span class=comment>// Cherry-pick methods for smaller browserify/rollup/webpack bundles.</span></div><div><span class=type>var</span> at = <span class=support>require</span>(<span class=string>'lodash/at'</span>);</div><div><span class=type>var</span> curryN = <span class=support>require</span>(<span class=string>'lodash/fp/curryN'</span>);</div></pre></div><p><strong>Note:</strong><br>Install <a href=https://www.npmjs.com/package/n_>n_</a> for Lodash use in the Node.js &lt; 6 REPL.</section><section><h2>Why Lodash?</h2><p><span class=rwd-line>Lodash makes JavaScript easier by taking the hassle out of working with arrays, numbers, objects, strings, etc.</span> <span class=rwd-line>Lodash’s modular methods are great for:</span><ul class=chevron><li>Iterating arrays, objects, & strings<li>Manipulating & testing values<li>Creating composite functions</ul></section><section><h2>Module Formats</h2><p>Lodash is available in a <a href=/custom-builds>variety of builds</a> & module formats.<ul class=chevron><li><a href=https://www.npmjs.com/package/lodash>lodash</a> & <a href=/per-method-packages>per method packages</a><li><a href=https://www.npmjs.com/package/lodash-es>lodash-es</a>, <a href=https://www.npmjs.com/package/babel-plugin-lodash>babel-plugin-lodash</a>, & <a href=https://www.npmjs.com/package/lodash-webpack-plugin>lodash-webpack-plugin</a><li><a href=https://github.com/lodash/lodash/tree/4.17.15-npm/fp>lodash/fp</a><li><a href=https://www.npmjs.com/package/lodash-amd>lodash-amd</a></ul></section><section><h2>Complementary Tools</h2><ul class=chevron><li><a href=https://github.com/smartprocure/futil-js>futil-js</a> is a set of functional utilities designed to complement lodash</ul></section><section><h2>Further Reading</h2><ul class=chevron><li><a href=https://github.com/lodash/lodash/blob/master/.github/CONTRIBUTING.md>Contributing</a><li><a href=https://github.com/lodash/lodash/releases/tag/4.0.0>Release Notes</a><li><a href=https://github.com/lodash/lodash/wiki>Wiki (Changelog, Roadmap, etc.)</a></ul></section><section><h2>Support</h2><p><span class=rwd-line>Tested in Chrome 74-75, Firefox 66-67, IE 11, Edge 18, Safari 11-12, & Node.js 8-12.</span></section><script async src=/assets/js/home.js></script></div><footer><div class=container><p>Site made with <i class=\"fa fa-heart\" aria-label=love></i> by <a href=https://twitter.com/veksenn>@veksenn</a> & <a href=https://twitter.com/ZTHall>@zthall</a>.<p>Maintained by the <a href=https://github.com/orgs/lodash/people>core team</a> with help from <a href=https://github.com/lodash/lodash/graphs/contributors>our contributors</a>.</div></footer><script async src=/vendor/cdn.jsdelivr.net/npm/lodash@4.17.15/lodash.min.js></script>","data":{"title":"Lodash","score":"7.1","rawUrl":"https://www.lodash.com/","tot":{"info":{"url":"https://lodash.com/","hash":"6b10c8f54802e17a96926e831b685adf","encoding":"utf-8","content":"text/html","size":2473,"date":"2020-02-21 11:35:50","htmlTags":195,"lang":"en","title":"Lodash","score":"7.1","tests":9,"conform":"0@1@0","time":"0.88"},"elems":{"id":2,"dtd":"","html":1,"title":1,"a":27,"aTitleMatch":1,"h1":1,"hx":9,"fontHtml":4,"lang":1,"titleOk":1},"results":{"font_01":"1@1.2@1.2@4","a_01b":"3@2.88@8.6@0","a_02a":"3@2.88@8.6@0","a_05":"5@2.4@12@1","hx_01b":"10@3.42@34.2@9","layout_02a":"10@3.2@32@0","layout_01a":"10@2.2@22@0","lang_01":"10@1.8@18@en","title_06":"10@1.62@16.2@titleOk"},"users":{"ubli":"9@7.0","ulow":"9@7.3","uphy":"5@6.0","ucog":"5@7.2","uage":"8@7.9"}},"nodes":{"aTitleMatch":"/html/body/header/div/div[1]/div[1]/a"},"conform":"3@1@0","elems":{"id":2,"dtd":"","html":1,"title":1,"a":27,"aTitleMatch":1,"h1":1,"hx":9,"fontHtml":4,"lang":1,"titleOk":1},"date":"2020-02-21 12:35:51"}};

export async function executeUrlEvaluation(url: string): Promise<any> {
  //const evaluation = await qualweb.init({ url });
  //return parseEvaluation(evaluation);
  return STATIC_EVALUATION;
}

export async function executeHtmlEvaluation(html: string): Promise<any> {
  //TODO: implementar no qualweb - avaliar codigo HTML enviado
}