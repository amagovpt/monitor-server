'use strict';

const _ = require('lodash');

const act_mapping = {
  'QW-ACT-R1': QW_ACT_R1,
  'QW-ACT-R2': QW_ACT_R2,
  'QW-ACT-R3': QW_ACT_R3,
  'QW-ACT-R4': QW_ACT_R4,
  'QW-ACT-R5': QW_ACT_R5,
  'QW-ACT-R6': QW_ACT_R6,
  'QW-ACT-R9': QW_ACT_R9,
  'QW-ACT-R16': QW_ACT_R16,
  'QW-ACT-R17': QW_ACT_R17,
  'QW-ACT-R18': QW_ACT_R18,
  'QW-ACT-R19': QW_ACT_R19
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
  'QW-HTML-T17': QW_HTML_T17,
  'QW-HTML-T19': QW_HTML_T19,
  'QW-HTML-T20': QW_HTML_T20,
  'QW-HTML-T23': QW_HTML_T23,
  'QW-HTML-T25': QW_HTML_T25,
  'QW-HTML-T28': QW_HTML_T28,
  'QW-HTML-T29': QW_HTML_T29,
  'QW-HTML-T30': QW_HTML_T30,
  'QW-HTML-T32': QW_HTML_T32,
  'QW-HTML-T34': QW_HTML_T34,
  'QW-HTML-T35': QW_HTML_T35,
  'QW-HTML-T37': QW_HTML_T37,
  'QW-HTML-T38': QW_HTML_T38,
  'QW-HTML-T40': QW_HTML_T40,
  'QW-HTML-T41': QW_HTML_T41,
  'QW-HTML-T43': QW_HTML_T43
};

const css_mapping = {
  'QW-CSS-T1': QW_CSS_T1,
  'QW-CSS-T2': QW_CSS_T2,
  'QW-CSS-T3': QW_CSS_T3,
  'QW-CSS-T5': QW_CSS_T5,
  'QW-CSS-T6': QW_CSS_T6,
  'QW-CSS-T7': QW_CSS_T7
};

const bp_mapping = {
  'QW-BP1': QW_BP1,
  'QW-BP2': QW_BP2,
  'QW-BP3': QW_BP3,
  'QW-BP4': QW_BP4,
  'QW-BP5': QW_BP5,
  'QW-BP6': QW_BP6,
  'QW-BP7': QW_BP7,
  'QW-BP8': QW_BP8,
  'QW-BP9': QW_BP9,
  'QW-BP10': QW_BP10,
  'QW-BP11': QW_BP11
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
  const failRefresh = rule.results.filter(r => r.resultCode === 'RC9');
  if (failRefresh.length !== 0) {
    addToElements(elements, 'metaRefresh', failRefresh.length);
    addToResults(results, 'meta_01');
    addToNodes(nodes, 'meta_01', failRefresh[0].pointer);
  }

  const failRedirect = rule.results.filter(r => r.resultCode === 'RC14');
  if (failRedirect.length !== 0) {
    addToElements(elements, 'metaRedir', failRedirect.length);
    addToResults(results, 'meta_02');
    addToNodes(nodes, 'meta_02', failRedirect[0].pointer);
  }
}

function QW_ACT_R5(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'failed') {
    addToElements(elements, 'langNo', rule.metadata.failed);
    addToResults(results, 'lang_03');
    addToNodes(nodes, 'lang_03', rule.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_ACT_R6(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'passed') {
    addToElements(elements, 'inpImgAltNo', rule.metadata.passed);
    addToResults(results, 'inp_img_01a');
    addToNodes(nodes, 'inp_img_01a', rule.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_ACT_R9(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'warning') {
    addToElements(elements, 'aSameText', rule.metadata.warning);
    addToResults(results, 'a_09');
    addToNodes(nodes, 'a_09', rule.results.filter(r => r.verdict === 'warning')[0].pointer);
  }
}

function QW_ACT_R16(elements, results, nodes, rule) { 
  if (rule.metadata.outcome === 'failed') {
    addToElements(elements, 'inputLabelNo', rule.metadata.failed);
    addToResults(results, 'input_02b');
    addToNodes(nodes, 'input_02b', rule.results.filter(r => r.verdict === 'failed')[0].pointer);
  } else if (rule.metadata.outcome === 'passed') {
    addToElements(elements, 'inputLabelNo', rule.metadata.passed);
    addToResults(results, 'input_02');
    addToNodes(nodes, 'input_02', rule.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_ACT_R17(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'passed') {
    addToElements(elements, 'imgAltNo', rule.metadata.passed);
    addToResults(results, 'img_01a');
    addToNodes(nodes, 'img_01a', rule.results.filter(r => r.verdict === 'passed')[0].pointer);
  } else if (rule.metadata.outcome === 'failed') { 
    const imgNoAlt = technique.results.filter(r => r.resultCode === 'RC2');
    if (imgNoAlt.length > 0) {
      addToElements(elements, 'imgAltNo', imgNoAlt.length);
      addToResults(results, 'img_01b');
      addToNodes(nodes, 'img_01b', imgNoAlt[0].pointer);
    }
    const imgEmptyAlt = technique.results.filter(r => r.resultCode === 'RC?');
    if (imgEmptyAlt.length > 0) {
      addToElements(elements, 'imgAltNull', imgEmptyAlt.length);
      addToResults(results, 'img_02');
      addToNodes(nodes, 'img_02', imgEmptyAlt[0].pointer);
    }
  }
}

function QW_ACT_R18(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'failed') {
    addToElements(elements, 'idRep', rule.metadata.failed);
    addToResults(results, 'id_01');
    addToNodes(nodes, 'id_01', rule.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_ACT_R19(elements, results, nodes, rule) {
  if (rule.metadata.outcome === 'failed') {
    addToElements(elements, 'iframeTitleNo', rule.metadata.failed);
    addToResults(results, 'iframe_01');
    addToNodes(nodes, 'iframe_01', rule.results.filter(r => r.verdict === 'failed')[0].pointer);
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

function QW_HTML_T17(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'tableComplexError', technique.metadata.failed);
    addToResults(results, 'table_06');
    addToNodes(nodes, 'table_06', technique.results.filter(r => r.verdict === 'failed')[0].pointer); 
  }
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

function QW_HTML_T28(elements, results, nodes, technique) {
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

function QW_HTML_T34(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'aImgAltNo', technique.metadata.failed);
    addToResults(results, 'a_03');
    addToNodes(nodes, 'a_03', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T35(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'newWinOnLoad', technique.metadata.failed);
    addToResults(results, 'win_01');
    addToNodes(nodes, 'win_01', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T37(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'warning') {
    addToElements(elements, 'aSkip', technique.metadata.warning);
    addToResults(results, 'a_02b');
    addToNodes(nodes, 'a_02b', technique.results.filter(r => r.verdict === 'warning')[0].pointer);
  } else if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'aSkip', 0);
    addToResults(results, 'a_02a');
    addToNodes(nodes, 'a_02a', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T38(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'passed') {
    addToElements(elements, 'aSkipFirst', technique.metadata.passed);
    addToResults(results, 'a_01a');
    addToNodes(nodes, 'a_01a', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  } else if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'aSkipFirst', 0);
    addToResults(results, 'a_01b');
    addToNodes(nodes, 'a_01b', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T40(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'focusBlur', technique.metadata.failed);
    addToResults(results, 'focus_01');
    addToNodes(nodes, 'focus_01', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T41(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'scopeNo', technique.metadata.failed);
    addToResults(results, 'scope_01');
    addToNodes(nodes, 'scope_01', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T42(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'ehandTagNo', technique.metadata.failed);
    addToResults(results, 'ehandler_04');
    addToNodes(nodes, 'ehandler_04', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_HTML_T43(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'justifiedTxt', technique.metadata.failed);
    addToResults(results, 'justif_txt_01');
    addToNodes(nodes, 'justif_txt_01', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_CSS_T1(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'fontAbsVal', technique.metadata.failed);
    addToResults(results, 'font_02');
    addToNodes(nodes, 'font_02', undefined);
  }
}

function QW_CSS_T2(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'justifiedCss', technique.metadata.failed);
    addToResults(results, 'justif_txt_02');
    addToNodes(nodes, 'justif_txt_02', undefined);
  }
}

function QW_CSS_T3(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'lineHeightNo', technique.metadata.failed);
    addToResults(results, 'css_01');
    addToNodes(nodes, 'css_01', undefined);
  }
}

function QW_CSS_T5(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'valueAbsCss', technique.metadata.failed);
    addToResults(results, 'values_02a');
    addToNodes(nodes, 'values_02a', undefined);
  }
  if (technique.metadata.passed > 0) {
    addToElements(elements, 'valueRelCss', technique.metadata.passed);
    addToResults(results, 'values_02b');
    addToNodes(nodes, 'values_02b', undefined);
  }
}

function QW_CSS_T6(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'cssBlink', technique.metadata.failed);
    addToResults(results, 'blink_02');
    addToNodes(nodes, 'blink_02', undefined);
  }
}

function QW_CSS_T7(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'colorFgBgNo', technique.metadata.failed);
    addToResults(results, 'color_01');
    addToNodes(nodes, 'color_01', undefined);
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

function QW_BP2(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'imgAltLong', technique.metadata.failed);
    addToResults(results, 'img_04');
    addToNodes(nodes, 'img_04', technique.results.filter(r => r.verdict === 'failed')[0].pointer);  
  } 
}

function QW_BP3(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'aTitleMatch', technique.metadata.failed);
    addToResults(results, 'a_05');
    addToNodes(nodes, 'a_05', technique.results.filter(r => r.verdict === 'failed')[0].pointer);  
  } 
}

function QW_BP4(elements, results, nodes, technique) {
 //TODO: não sei onde está o mapping
}

function QW_BP5(elements, results, nodes, technique) {
 if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'tableNested', technique.metadata.failed);
    addToResults(results, 'table_04');
    addToNodes(nodes, 'table_04', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_BP6(elements, results, nodes, technique) {
 if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'titleLong', technique.metadata.failed);
    addToResults(results, 'title_04');
    addToNodes(nodes, 'title_04', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_BP7(elements, results, nodes, technique) {
 if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'titleChars', technique.metadata.failed);
    addToResults(results, 'title_05');
    addToNodes(nodes, 'title_05', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
  }
}

function QW_BP8(elements, results, nodes, technique) {
  if (technique.metadata.outcome === 'passed') {
    addToElements(elements, 'hxNo', technique.metadata.passed);
    addToResults(results, 'hx_02');
    addToNodes(nodes, 'hx_02', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_BP9(elements, results, nodes, technique) {
  if (technique.metadata.passed > 0) {
    addToElements(elements, 'tableLayoutCaption', technique.metadata.passed);
    addToResults(results, 'table_01');
    addToNodes(nodes, 'table_01', technique.results.filter(r => r.verdict === 'passed')[0].pointer);
  }
}

function QW_BP10(elements, results, nodes, technique) {
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

function QW_BP11(elements, results, nodes, technique) {
 if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'brSec', technique.metadata.failed);
    addToResults(results, 'br_01');
    addToNodes(nodes, 'br_01', technique.results.filter(r => r.verdict === 'failed')[0].pointer);
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