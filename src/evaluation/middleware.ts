import * as htmlparser from "htmlparser2";
import * as CSSselect from "css-select";
import clone from "lodash.clone";
import * as qualweb from "./qualweb";

import tests from "./tests";
import testsColors from "./testsColors";

import { generateMd5Hash } from "../lib/security";
import { getElementsMapping } from "./mapping";

function completeMissingReportElements(report: any): void {
  let _dom = {};

  const handler = new htmlparser.DomHandler((error, dom) => {
    if (error) {
      throw new Error();
    } else {
      _dom = clone(dom);
    }
  });

  const parser = new htmlparser.Parser(handler);
  parser.write(report.pagecode.replace(/(\r\n|\n|\r|\t)/gm, ""));
  parser.end();

  if (report.data.elems["img"] === undefined) {
    const img = CSSselect.selectAll("img", _dom);
    report.data.elems["img"] = img.length;
  }

  const area = CSSselect.selectAll("area", _dom);
  report.data.elems["area"] = area.length;

  const inpImg = CSSselect.selectAll("a", _dom);
  report.data.elems["inpImg"] = inpImg.length;

  const roles = [
    "checkbox",
    "combobox",
    "listbox",
    "menuitemcheckbox",
    "menuitemradio",
    "radio",
    "searchbox",
    "slider",
    "spinbutton",
    "switch",
    "textbox",
  ];

  const label = CSSselect.selectAll(
    "input, select, textarea, " + roles.map((r) => `[role="${r}"]`).join(", "),
    _dom
  );
  report.data.elems["label"] = label.length;

  const form = CSSselect.selectAll("form", _dom);
  report.data.elems["form"] = form.length;

  const table = CSSselect.selectAll("table", _dom);
  if (report.data.elems["tableData"] === undefined) {
    report.data.elems["tableData"] = table.length;
  }
  if (report.data.elems["tableLayout"] === undefined) {
    report.data.elems["tableLayout"] = table.length;
  }
  if (report.data.elems["tableComplex"] === undefined) {
    report.data.elems["tableComplex"] = table.length;
  }

  //const tabletable = CSSselect.selectAll("table table", _dom);
  //report.data.elems["tableNested"] = tabletable.length;

  const iframe = CSSselect.selectAll("iframe", _dom);
  report.data.elems["iframe"] = iframe.length;

  const ehandler = CSSselect.selectAll(
    "*[onmousedown], *[onmouseup], *[onclick], *[onmouseover], *[onmouseout]",
    _dom
  );
  report.data.elems["ehandler"] = ehandler.length;

  report.data.tot.elems = clone(report.data.elems);
}

function generateScore(report: any): string {
  let rel = 0;
  let pon = 0;

  for (const test in report.data.tot.results) {
    const value = tests[test];

    if (value.result === "warning") {
      continue;
    }

    let calc = false;
    switch (value["type"]) {
      case "true":
      case "decr":
        if (
          value["elem"] === "all" ||
          report.data["elems"][value["elem"]] !== undefined
        ) {
          if (report.data["elems"][value["test"]] !== undefined) {
            calc = true;
          }
        }
        break;
      case "fals":
        if (
          value["elem"] === "all" ||
          report.data["elems"][value["elem"]] !== undefined
        ) {
          if (report.data["elems"][value["test"]] === undefined) {
            calc = true;
          }
        }
        break;
      case "prop":
        if (
          report.data["elems"][value["elem"]] !== undefined &&
          report.data["elems"][value["test"]] !== undefined
        ) {
          calc = true;
        }
        break;
    }

    if (calc) {
      let temp = null;
      if (tests[test]["type"] === "prop") {
        temp = calculateProp(value, report);
      } else if (tests[test]["type"] === "decr") {
        temp = calculateDecr(value, report);
      } else {
        temp = calculateTrueFalse(value);
      }

      const pp = temp["p"] / 5;
      const ss = temp["s"] * pp;
      rel += ss;
      pon += pp;

      report.data.tot.results[test] = value["score"] + "@" + ss;
    }
  }

  return (rel / pon).toFixed(1);
}

function calculateTrueFalse(v: any): any {
  const score = v["score"];
  const ret = { s: score, p: 0 };
  for (const w in v["dis"]) {
    if (parseInt(v.dis[w]) > 1) {
      const p = +v["trust"] * parseInt(v.dis[w]);
      ret["p"] += p;
    }
  }
  return ret;
}

function calculateDecr(v: any, report: any): any {
  const test = report.data.elems[v["test"]];
  const limit = v["top"];
  const steps = v["steps"];
  const score = v["score"];
  const errors = test - limit;
  const minus = errors > 0 ? Math.round(errors / steps) : 0;
  const op = score - minus;
  const rr = op < 1 ? 1 : op;
  const ret = { s: rr, p: 0 };
  for (const w in v["dis"]) {
    if (parseInt(v.dis[w]) > 1) {
      const p = +v["trust"] * parseInt(v.dis[w]);
      ret["p"] += p;
    }
  }
  return ret;
}

function calculateProp(v: any, report: any): any {
  const elem = report.data.elems[v["elem"]];
  const test = report.data.elems[v["test"]];
  const score = v["score"];
  const op = score - (score / elem) * test;
  const rr = op < 1 ? 1 : op;
  const ret = { s: rr, p: 0 };
  for (const w in v["dis"]) {
    if (parseInt(v.dis[w]) > 1) {
      const p = +v["trust"] * parseInt(v.dis[w]);
      ret["p"] += p;
    }
  }
  return clone(ret);
}

function getHtmlLang(html: string): string {
  let lang = "";
  let _dom = {};

  const handler = new htmlparser.DomHandler((error, dom) => {
    if (error) {
      throw new Error();
    } else {
      _dom = clone(dom);
    }
  });

  const parser = new htmlparser.Parser(handler);
  parser.write(html.replace(/(\r\n|\n|\r|\t)/gm, ""));
  parser.end();

  const htmlElement: any = CSSselect.selectOne("html", _dom);

  if (htmlElement && htmlElement.attribs && htmlElement.attribs.lang) {
    lang = htmlElement.attribs.lang;
  }

  return lang;
}

function calculateConform(results: any): string {
  const errors = {
    A: 0,
    AA: 0,
    AAA: 0,
  };
  for (const ee in results || {}) {
    if (ee) {
      let level = tests[ee]["level"].toUpperCase();
      if (testsColors[ee] === "R") {
        errors[level]++;
      }
    }
  }

  return `${errors.A}@${errors.AA}@${errors.AAA}`;
}

function parseEvaluation(evaluation: any): any {
  const { elements, results, nodes } = getElementsMapping(evaluation);

  const report: any = {};

  report.pagecode = evaluation.system.page.dom.html;
  report["data"] = {};
  report["data"].title = evaluation.system.page.dom.title;
  report["data"].rawUrl = evaluation?.system?.url?.completeUrl || "";
  report["data"].elems = clone(elements);
  report["data"].nodes = clone(nodes);
  report["data"].date = new Date()
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "");
  report["data"].tot = {};
  report["data"].tot.info = {};
  report["data"].tot.info.url = clone(report["data"].rawUrl);
  report["data"].tot.info.title = clone(report["data"].title);
  report["data"].tot.info.date = clone(report["data"].date);
  report["data"].tot.info.htmlTags = evaluation.system.page.dom.elementCount; //count_html_tags(evaluation.postProcessingHTML);
  report["data"].tot.info.roles = evaluation.modules.counter.data.roles;
  report["data"].tot.info.cTags = evaluation.modules.counter.data.tags;
  report["data"].tot.info.size =
    encodeURI(report.pagecode).split(/%..|./).length - 1;
  //report['data'].tot.info.cssRules = calculateCssRules(evaluation);
  report["data"].tot.info.encoding = "utf-8";
  report["data"].tot.info.lang = getHtmlLang(evaluation.system.page.dom.html);
  report["data"].tot.info.content = "text/html";
  report["data"].tot.info.hash = generateMd5Hash(report["data"].date);
  report["data"].tot.info.tests = Object.keys(results).length;
  report["data"].tot.elems = clone(report["data"].elems);
  report["data"].tot.results = clone(results);
  report["data"].conform = calculateConform(report["data"].tot.results);
  report["data"].tot.info.conform = clone(report["data"].conform);

  completeMissingReportElements(report);

  report["data"].score = generateScore(report);
  report["data"].tot.info.score = clone(report["data"].score);
  return report;
}

export async function executeUrlEvaluation(url: string): Promise<any> {
  const params = {
    url,
  };

  params.url = params.url.trim();
  if (!params.url.startsWith("http://") && !params.url.startsWith("https://")) {
    params.url = "http://" + params.url;
  }

  const reports = await qualweb.evaluate(params);
  return parseEvaluation(reports[params.url]);
}

export async function executeUrlsEvaluation(urls: string[]): Promise<any> {
  const normalized = new Array<string>();

  for (const url of urls ?? []) {
    const _url = url.trim();
    if (!_url.startsWith("http://") && !_url.startsWith("https://")) {
      normalized.push("http://" + _url);
    } else {
      normalized.push(_url);
    }
  }

  const params = {
    urls: normalized,
  };

  const reports = await qualweb.evaluate(params);
  for (const url in reports ?? {}) {
    if (url && reports[url]) {
      reports[url] = parseEvaluation(reports[url]);
    }
  }
  return reports;
}

export async function executeHtmlEvaluation(html: string): Promise<any> {
  const reports = await qualweb.evaluate({ html });
  return parseEvaluation(reports["customHtml"]);
}
