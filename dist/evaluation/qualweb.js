"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate = void 0;
const core_1 = require("@qualweb/core");
const invalid_url_error_1 = require("../lib/invalid-url.error");
async function evaluate(params) {
    const options = {
        "act-rules": {
            rules: [
                "QW-ACT-R1",
                "QW-ACT-R2",
                "QW-ACT-R3",
                "QW-ACT-R4",
                "QW-ACT-R5",
                "QW-ACT-R6",
                "QW-ACT-R9",
                "QW-ACT-R16",
                "QW-ACT-R17",
                "QW-ACT-R18",
                "QW-ACT-R19",
                "QW-ACT-R37",
                "QW-ACT-R47",
            ],
        },
        "wcag-techniques": {
            techniques: [
                "QW-WCAG-T1",
                "QW-WCAG-T2",
                "QW-WCAG-T3",
                "QW-WCAG-T6",
                "QW-WCAG-T7",
                "QW-WCAG-T8",
                "QW-WCAG-T9",
                "QW-WCAG-T14",
                "QW-WCAG-T15",
                "QW-WCAG-T16",
                "QW-WCAG-T17",
                "QW-WCAG-T32",
                "QW-WCAG-T18",
                "QW-WCAG-T19",
                "QW-WCAG-T20",
                "QW-WCAG-T21",
                "QW-WCAG-T22",
                "QW-WCAG-T23",
                "QW-WCAG-T24",
                "QW-WCAG-T25",
                "QW-WCAG-T26",
                "QW-WCAG-T27",
                "QW-WCAG-T28",
                "QW-WCAG-T29",
                "QW-WCAG-T30",
                "QW-WCAG-T31",
            ],
        },
        "best-practices": {
            bestPractices: [
                "QW-BP1",
                "QW-BP2",
                "QW-BP3",
                "QW-BP5",
                "QW-BP6",
                "QW-BP7",
                "QW-BP8",
                "QW-BP9",
                "QW-BP10",
                "QW-BP11",
                "QW-BP13",
                "QW-BP14",
                "QW-BP15",
                "QW-BP17",
                "QW-BP18",
            ],
        },
    };
    if (params.url) {
        if (!params.url.startsWith("http://") &&
            !params.url.startsWith("https://")) {
            params.url = "http://" + params.url;
        }
        options["url"] = params.url;
    }
    else if (params.html) {
        options["html"] = params.html;
    }
    const qualweb = new core_1.QualWeb();
    await qualweb.start({ args: ["--no-sandbox"] });
    const reports = await qualweb.evaluate(options);
    await qualweb.stop();
    if (Object.keys(reports).length === 0 && params.url) {
        throw new invalid_url_error_1.InvalidUrl(params.url);
    }
    let report;
    if (params.url) {
        report = reports[params.url];
    }
    else if (params.html) {
        report = reports["customHtml"];
    }
    return report;
}
exports.evaluate = evaluate;
//# sourceMappingURL=qualweb.js.map