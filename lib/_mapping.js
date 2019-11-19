'use strict';

const _ = require('lodash');

const act_mapping = {
  'QW-ACT-R1': QW_ACT_R1,
  'QW-ACT-R2': QW_ACT_R2,
  'QW-ACT-R3': QW_ACT_R3,
  'QW-ACT-R4': QW_ACT_R4,
  'QW-ACT-R5': QW_ACT_R5
};

const html_mapping = {
  'QW-HTML-T1': QW_HTML_T1,
  'QW-HTML-T2': QW_HTML_T2,
  'QW-HTML-T3': QW_HTML_T3,
  'QW-HTML-T5': QW_HTML_T5,
  'QW-HTML-T6': QW_HTML_T6,
  'QW-HTML-T7': QW_HTML_T7,
  'QW-HTML-T9': QW_HTML_T9,
  'QW-HTML-T11': QW_HTML_T11,
  'QW-HTML-T15': QW_HTML_T15,
  'QW-HTML-T19': QW_HTML_T19,
  'QW-HTML-T20': QW_HTML_T20,
  'QW-HTML-T21': QW_HTML_T21,
  'QW-HTML-T23': QW_HTML_T23,
  'QW-HTML-T25': QW_HTML_T25,
  'QW-HTML-T27': QW_HTML_T27,
  'QW-HTML-T28': QW_HTML_T28,
  'QW-HTML-T29': QW_HTML_T29,
  'QW-HTML-T30': QW_HTML_T30,
  'QW-HTML-T32': QW_HTML_T32,
  'QW-HTML-T37': QW_HTML_T37
};

const css_mapping = {
  'QW-CSS-C1': QW_CSS_C1,
  'QW-CSS-C3': QW_CSS_C3
};

const bp_mapping = {
  'QW-BP1': QW_BP1
};

function QW_ACT_R1(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'failed') {
    const noTitle = rule.results.filter(r => r.resultCode === 'RC1');
    if (noTitle.length !== 0) {
      addToElements(elements, 'titleNo', noTitle.length);
      addToResults(results, 'title_02');
      addToNodes(nodes, 'title_02', noTitle[0].pointer);
    }

    const titleEmpty = rule.results.filter(r => r.resultCode === 'RC2');
    if (titleEmpty.length !== 0) {
      addToElements(elements, 'titleNull', titleEmpty.length);
      addToResults(results, 'title_03');
      addToNodes(nodes, 'title_03', titleEmpty[0].pointer);
    }
  } else if (rule.metadata.outcome === 'passed') {
    addToElements(elements, 'titleOk', rule.metadata.passed);
    addToResults(results, 'title_06');
    addToNodes(nodes, 'title_06', rule.results.filter(r => r.verdict === 'passed')[0].pointer);  
  }
}

function QW_ACT_R2(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'failed') {
    addToElements(elements, 'langCodeNo', rule.metadata.failed);
    addToResults(results, 'lang_02');
    addToNodes(nodes, 'lang_02', rule.results.filter(r => r.verdict === 'failed')[0].pointer);
  } else if (rule.metadata.outcome === 'passed') {
    addToElements(elements, 'lang', rule.metadata.passed);
    addToResults(results, 'lang_01');
    addToNodes(nodes, 'lang_01', rule.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_ACT_R3(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'failed') {
    addToElements(elements, 'langMatchNo', rule.metadata.failed);
    addToResults(results, 'lang_04');
    addToNodes(nodes, 'lang_04', rule.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_ACT_R4(elements, results, nodes, rule) {
  const passRefresh = rule.results.filter(r => (r.resultCode === 'RC7' || r.resultCode === 'RC8'));
  if (passRefresh.length !== 0) {
    addToElements(elements, 'metaRefresh', passRefresh.length);
    addToResults(results, 'meta_01');
    addToNodes(nodes, 'meta_01', passRefresh[0].pointer);
  }

  const passRedirect = rule.results.filter(r => (r.resultCode === 'RC12' || r.resultCode === 'RC13'));
  if (passRedirect.length !== 0) {
    addToElements(elements, 'metaRedir', passRedirect.length);
    addToResults(results, 'meta_02');
    addToNodes(nodes, 'meta_02', passRedirect[0].pointer);
  }
}

function QW_ACT_R5(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'failed') {
    addToElements(elements, 'langNo', rule.metadata.failed);
    addToResults(results, 'lang_03');
    addToNodes(nodes, 'lang_03', rule.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T1(elements, results, nodes, technique) {
  const outsideFieldset = technique.results.filter(r => r.resultCode === 'RC1');
  if (outsideFieldset.length !== 0) {
    addToElements(elements, 'fieldNoForm', outsideFieldset.length);
    addToResults(results, 'field_02');
    addToNodes(nodes, 'field_02', outsideFieldset[0].pointer);
  }

  const fieldsetNoLegend = technique.results.filter(r => (r.resultCode === 'RC2' || r.resultCode === 'RC3'));
  if (fieldsetNoLegend.length !== 0) {
    addToElements(elements, 'fieldLegNo', fieldsetNoLegend.length);
    addToResults(results, 'field_01');
    addToNodes(nodes, 'field_01', fieldsetNoLegend[0].pointer);
  }
}

function QW_HTML_T2(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'tableDataCaption', technique.metadata.failed);
    addToResults(results, 'table_02');
    addToNodes(nodes, 'table_02', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T3(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'areaAltNo', technique.metadata.failed);
    addToResults(results, 'area_01b');
    addToNodes(nodes, 'area_01b', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  } else if (technique.metadata.outcome === 'passed' || technique.metadata.outcome === 'warning') {
    addToElements(elements, 'areaAltNo', technique.metadata.passed + technique.metadata.warning);
    addToResults(results, 'area_01a');
    addToNodes(nodes, 'area_01a', technique.results.filter(r => (r.verdict === 'passed' || r.verdict === 'warning'))[0].pointer);
  }
}

function QW_HTML_T5(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'inpImgAltNo', technique.metadata.failed);
    addToResults(results, 'inp_img_01b');
    addToNodes(nodes, 'inp_img_01b', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T6(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'ehandBoth', technique.metadata.failed);
    addToResults(results, 'ehandler_03');
    addToNodes(nodes, 'ehandler_03', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  } else if (technique.metadata.outcome === 'passed') {
    addToElements(elements, 'ehandBothNo', technique.metadata.passed);
    addToResults(results, 'ehandler_02');
    addToNodes(nodes, 'ehandler_02', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_HTML_T7(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'abbrNo', technique.metadata.failed);
    addToResults(results, 'abbr_01');
    addToNodes(nodes, 'abbr_01', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T9(elements, results, nodes, technique) {
  const failsH1Results = technique.results.filter(r => r.resultCode === 'RC3');
  if (failsH1Results.length > 0) {
    addToElements(elements, 'h1', failsH1Results.length);
    addToResults(results, 'hx_01c');
    addToNodes(nodes, 'hx_01c', failsH1Results[0].pointer);
  }

  const incorrectOrderResults = technique.results.filter(r => r.resultCode === 'RC1');
  if (incorrectOrderResults.length > 0) {
    addToElements(elements, 'hxNo', incorrectOrderResults.length);
    addToResults(results, 'hx_02');
    addToNodes(nodes, 'hx_02', incorrectOrderResults[0].pointer);
  }
}

function QW_HTML_T11(elements, results, nodes, technique) { //TODO: wut?
  /*if (technique.metadata.failed !== 0) {
    addToElements(elements, 'aAdjacentSame', technique.metadata.failed);
  }*/
}

function QW_HTML_T15(elements, results, nodes, technique) { //TODO: o mapping está correto?
  /*if (technique.metadata.failed !== 0) {
    addToElements(elements, 'aAdjacentSame', technique.metadata.failed);
  }*/
}

function QW_HTML_T19(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'warning') {
    addToElements(elements, 'linkRel', technique.metadata.warning);
    addToResults(results, 'link_01');
    addToNodes(nodes, 'link_01', technique.results.filter(r => r.verdict === 'warning')[0].pointer); 
  }
}

function QW_HTML_T20(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'w3cValidatorErrors', technique.metadata.failed);
    addToResults(results, 'w3c_validator_01b');
    addToNodes(nodes, 'w3c_validator_01b', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  } else if (technique.metadata.outcome === 'passed') {
    addToElements(elements, 'w3cValidatorErrors', technique.metadata.passed);
    addToResults(results, 'w3c_validator_01a');
    addToNodes(nodes, 'w3c_validator_01a', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_HTML_T21(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'layoutElem', technique.metadata.failed);
    addToResults(results, 'layout_01b');
    addToNodes(nodes, 'layout_01b', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  } else if (technique.metadata.outcome === 'passed') {
    addToElements(elements, 'layoutElem', technique.metadata.passed);
    addToResults(results, 'layout_01a');
    addToNodes(nodes, 'layout_01a', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_HTML_T23(elements, results, nodes, technique) {
  addToElements(elements, 'a', technique.metadata.warning + technique.metadata.failed);
  addToResults(results, 'a_04');
  addToNodes(nodes, 'a_04', 'a');
}

function QW_HTML_T25(elements, results, nodes, technique) {
  const incorrectLabelResults = technique.results.filter(r => (r.resultCode === 'RC1' || r.resultCode === 'RC2' || r.resultCode === 'RC3'));
  if (incorrectLabelResults.length > 0) {
    addToElements(elements, 'labelPosNo', incorrectLabelResults);
    addToResults(results, 'label_02');
    addToNodes(nodes, 'label_02', incorrectLabelResults[0].pointer);
  }
}

function QW_HTML_T27(elements, results, nodes, technique) { //TODO: wut? vai passar a best practice QW-BP8
  //addToElements(elements, 'a', technique.metadata.warning + technique.metadata.failed);
}

function QW_HTML_T28(elements, results, nodes, technique) { //TODO: parte dos <br>? examinator regra 18
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'liNoList', technique.metadata.failed);
    addToResults(results, 'list_01');
    addToNodes(nodes, 'list_01', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T29(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'warning') {
    addToElements(elements, 'ehandMouse', technique.metadata.warning);
    addToResults(results, 'ehandler_01');
    addToNodes(nodes, 'ehandler_01', technique.results.filter(r => r.verdict === 'warning')[0].pointer);
  }
}

function QW_HTML_T30(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'tableLayout', technique.metadata.failed);
    addToResults(results, 'table_05a');
    addToNodes(nodes, 'table_05a', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T32(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'passed') {
    addToElements(elements, 'formSubmitNo', technique.metadata.passed);
    addToResults(results, 'form_01b');
    addToNodes(nodes, 'form_01b', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  } else if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'formSubmitNo', technique.metadata.failed);
    addToResults(results, 'form_01a');
    addToNodes(nodes, 'form_01a', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T37(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'warning') {
    addToElements(elements, 'aSkip', technique.metadata.warning);
    addToResults(results, 'a_02b');
    addToNodes(nodes, 'a_02b', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  } else if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'aSkip', 0);
    addToResults(results, 'a_02a');
    addToNodes(nodes, 'a_02a', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_CSS_C1(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'fontAbsVal', technique.metadata.failed);
    addToResults(results, 'font_02');
    addToNodes(nodes, 'font_02', undefined);
  }
}

function QW_CSS_C3(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'lineHeightNo', technique.metadata.failed);
    addToResults(results, 'css_01');
    addToNodes(nodes, 'css_01', undefined);
  }
}

function QW_BP1(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'hx', technique.metadata.failed);
    addToResults(results, 'hx_01a');
    addToNodes(nodes, 'hx_01a', technique.results.filter(r => r.verdict === 'failed')[0].pointer);  
  } else if (technique.metadata.outcome === 'warning') {
    addToElements(elements, 'hx', technique.metadata.warning);
    addToResults(results, 'hx_01b');
    addToNodes(nodes, 'hx_01b', undefined);
    addToNodes(nodes, 'hx_01b', technique.results.filter(r => r.verdict === 'warning')[0].pointer);
  }
}

function addToElements(elements, key, value) {
  if (elements[key] === undefined) {
    elements[key] = value;
  } else {
    elements[key] += value;
  }
}

function addToResults(results, key) {
  results[key] = 'something';
}

function addToNodes(nodes, key, selector) {
  const { xpath } = require('./xpath');
  if (xpath[key]) {
    nodes[key] = xpath[key];
  } else if (selector !== undefined && !nodes[key]) {
    nodes[key] = convert_css_selector_to_xpath(selector);
  } else if (selector !== undefined) {
    nodes[key] += '|' + convert_css_selector_to_xpath(selector);
  }
}

function convert_css_selector_to_xpath(selector) {
  let xpath = _.replace(selector, new RegExp(' > ', 'g'), '/');

  xpath = _.replace(xpath, /\:/g, '[');
  xpath = _.replace(xpath, /nth-of-type/g, '');
  xpath = _.replace(xpath, /\(/g, '');
  xpath = _.replace(xpath, /\)/g, ']');
  
  return '/' + xpath;
}

module.exports.getElementsMapping = evaluation => {
  const elements = {};
  const results = {};
  const nodes = {};

  for (const rule of Object.keys(evaluation.modules['act-rules'].rules) || []) {
    if (act_mapping[rule] !== undefined) {
      act_mapping[rule](elements, results, nodes, evaluation.modules['act-rules'].rules[rule]);
    }
  }

  for (const technique of Object.keys(evaluation.modules['html-techniques'].techniques) || []) {
    if (html_mapping[technique] !== undefined) {
      html_mapping[technique](elements, results, nodes, evaluation.modules['html-techniques'].techniques[technique]);
    }
  }

  for (const technique of Object.keys(evaluation.modules['css-techniques'].techniques) || []) {
    if (css_mapping[technique] !== undefined) {
      css_mapping[technique](elements, results, nodes, evaluation.modules['css-techniques'].techniques[technique]);
    }
  }
  
  for (const technique of Object.keys(evaluation.modules['best-practices']['best-practices']) || []) {
    if (bp_mapping[technique] !== undefined) {
      bp_mapping[technique](elements, results, nodes, evaluation.modules['best-practices']['best-practices'][technique]);
    }
  }

  return { elements, results, nodes };
}