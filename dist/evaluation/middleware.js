"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const htmlparser = __importStar(require("htmlparser2"));
const CSSselect = __importStar(require("css-select"));
const lodash_clone_1 = __importDefault(require("lodash.clone"));
const qualweb = __importStar(require("./qualweb"));
const tests_1 = __importDefault(require("./tests"));
const testsColors_1 = __importDefault(require("./testsColors"));
const security_1 = require("../lib/security");
const mapping_1 = require("./mapping");
function generateScore(report) {
    const scores = new Array();
    let finalScore = 0;
    for (const test in report['data'].tot.results || {}) {
        const level = tests_1.default[test]['level'].toLowerCase();
        const nSCs = tests_1.default[test]['scs'].includes(',');
        const V = (level === 'a' ? 0.9 : level === 'aa' ? 0.5 : 0.1);
        const VFinal = nSCs ? V + 0.1 : V - 0.1;
        const C = Number.parseFloat(tests_1.default[test]['trust']);
        const P = VFinal * C;
        const E = report['data'].elems[tests_1.default[test]['elem']];
        const S = report['data'].elems[tests_1.default[test]['test']];
        const N = tests_1.default[test]['score'];
        let R = 0;
        if (tests_1.default[test]['type'] === 'prop' && E && S) {
            R = N * (1 - (S / E)) * P;
        }
        else if (tests_1.default[test]['type'] === 'decr') {
            const T = tests_1.default[test]['top'];
            const F = tests_1.default[test]['steps'];
            const errors = S - T > 0 ? Math.round(((S - T) / F)) : 0;
            R = (N - errors) * P;
        }
        else {
            R = N * P;
        }
        scores.push(R);
        finalScore += R;
    }
    console.log(scores);
    console.log(finalScore / scores.length);
    return (Math.round((finalScore / scores.length) * 10) / 10).toString();
}
function calculateCssRules(evaluation) {
    const cssReport = evaluation.modules['css-techniques'];
    return Object.keys(cssReport.techniques).length;
}
function getHtmlLang(html) {
    let lang = '';
    let _dom = {};
    const handler = new htmlparser.DomHandler((error, dom) => {
        if (error) {
            throw new Error();
        }
        else {
            _dom = lodash_clone_1.default(dom);
        }
    });
    const parser = new htmlparser.Parser(handler);
    parser.write(html.replace(/(\r\n|\n|\r|\t)/gm, ''));
    parser.end();
    const htmlElement = CSSselect.selectOne('html', _dom);
    if (htmlElement && htmlElement.attribs && htmlElement.attribs.lang) {
        lang = htmlElement.attribs.lang;
    }
    return lang;
}
function calculateConform(results) {
    const errors = {
        A: 0,
        AA: 0,
        AAA: 0
    };
    for (const ee in results || {}) {
        if (ee) {
            let level = tests_1.default[ee]['level'].toUpperCase();
            if (testsColors_1.default[ee] === 'R') {
                errors[level]++;
            }
        }
    }
    return `${errors.A}@${errors.AA}@${errors.AAA}`;
}
function parseEvaluation(evaluation) {
    const report = {};
    report.pagecode = evaluation.report.system.page.dom.processed.html.plain;
    report['data'] = {};
    report['data'].title = evaluation.report.system.page.dom.processed.title;
    report['data'].rawUrl = evaluation.report.system.url.completeUrl;
    const { elements, results, nodes } = mapping_1.getElementsMapping(evaluation.report);
    report['data'].elems = lodash_clone_1.default(elements);
    report['data'].nodes = lodash_clone_1.default(nodes);
    report['data'].date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    report['data'].tot = {};
    report['data'].tot.info = {};
    report['data'].tot.info.url = lodash_clone_1.default(report['data'].rawUrl);
    report['data'].tot.info.title = lodash_clone_1.default(report['data'].title);
    report['data'].tot.info.date = lodash_clone_1.default(report['data'].date);
    report['data'].tot.info.htmlTags = evaluation.report.system.page.dom.processed.elementCount;
    report['data'].tot.info.size = encodeURI(report.pagecode).split(/%..|./).length - 1;
    report['data'].tot.info.cssRules = calculateCssRules(evaluation.report);
    report['data'].tot.info.encoding = 'utf-8';
    report['data'].tot.info.lang = getHtmlLang(evaluation.report.system.page.dom.processed.html.plain);
    report['data'].tot.info.content = 'text/html';
    report['data'].tot.info.hash = security_1.generateMd5Hash(report['data'].date);
    report['data'].tot.info.tests = Object.keys(results).length;
    report['data'].tot.elems = lodash_clone_1.default(report['data'].elems);
    report['data'].tot.results = lodash_clone_1.default(results);
    report['data'].conform = calculateConform(report['data'].tot.results);
    report['data'].tot.info.conform = lodash_clone_1.default(report['data'].conform);
    report['data'].score = generateScore(report);
    report['data'].tot.info.score = lodash_clone_1.default(report['data'].score);
    return report;
}
async function executeUrlEvaluation(url) {
    const evaluation = await qualweb.init({ url });
    return parseEvaluation(evaluation);
}
exports.executeUrlEvaluation = executeUrlEvaluation;
async function executeHtmlEvaluation(html) {
}
exports.executeHtmlEvaluation = executeHtmlEvaluation;
//# sourceMappingURL=middleware.js.map