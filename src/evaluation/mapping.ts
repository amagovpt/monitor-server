const act_mapping = {
  "QW-ACT-R1": QW_ACT_R1,
  "QW-ACT-R2": QW_ACT_R2,
  "QW-ACT-R3": QW_ACT_R3,
  "QW-ACT-R4": QW_ACT_R4,
  "QW-ACT-R5": QW_ACT_R5,
  "QW-ACT-R6": QW_ACT_R6,
  "QW-ACT-R9": QW_ACT_R9,
  "QW-ACT-R15": QW_ACT_R15,
  "QW-ACT-R16": QW_ACT_R16,
  "QW-ACT-R17": QW_ACT_R17,
  "QW-ACT-R19": QW_ACT_R19,
  "QW-ACT-R24": QW_ACT_R24,
  "QW-ACT-R25": QW_ACT_R25,
  "QW-ACT-R27": QW_ACT_R27,
  "QW-ACT-R33": QW_ACT_R33,
  "QW-ACT-R34": QW_ACT_R34,
  "QW-ACT-R35": QW_ACT_R35,
  "QW-ACT-R37": QW_ACT_R37,
  "QW-ACT-R38": QW_ACT_R38,
  "QW-ACT-R68": QW_ACT_R68,
};

const wcag_mapping = {
  "QW-WCAG-T1": QW_WCAG_T1,
  "QW-WCAG-T2": QW_WCAG_T2,
  "QW-WCAG-T3": QW_WCAG_T3,
  "QW-WCAG-T6": QW_WCAG_T6,
  "QW-WCAG-T7": QW_WCAG_T7,
  "QW-WCAG-T8": QW_WCAG_T8,
  "QW-WCAG-T9": QW_WCAG_T9,
  "QW-WCAG-T14": QW_WCAG_T14,
  "QW-WCAG-T15": QW_WCAG_T15,
  "QW-WCAG-T16": QW_WCAG_T16,
  "QW-WCAG-T17": QW_WCAG_T17,
  "QW-WCAG-T18": QW_WCAG_T18,
  "QW-WCAG-T19": QW_WCAG_T19,
  "QW-WCAG-T20": QW_WCAG_T20,
  "QW-WCAG-T21": QW_WCAG_T21,
  "QW-WCAG-T22": QW_WCAG_T22,
  "QW-WCAG-T23": QW_WCAG_T23,
  "QW-WCAG-T24": QW_WCAG_T24,
  "QW-WCAG-T25": QW_WCAG_T25,
  "QW-WCAG-T26": QW_WCAG_T26,
  "QW-WCAG-T27": QW_WCAG_T27,
  "QW-WCAG-T28": QW_WCAG_T28,
  "QW-WCAG-T29": QW_WCAG_T29,
  "QW-WCAG-T30": QW_WCAG_T30,
  "QW-WCAG-T31": QW_WCAG_T31,
  "QW-WCAG-T32": QW_WCAG_T32,
};

const bp_mapping = {
  "QW-BP1": QW_BP1,
  "QW-BP2": QW_BP2,
  "QW-BP4": QW_BP4,
  "QW-BP5": QW_BP5,
  "QW-BP6": QW_BP6,
  "QW-BP7": QW_BP7,
  "QW-BP8": QW_BP8,
  "QW-BP9": QW_BP9,
  "QW-BP10": QW_BP10,
  "QW-BP11": QW_BP11,
  "QW-BP13": QW_BP13,
  "QW-BP14": QW_BP14,
  "QW-BP15": QW_BP15,
  "QW-BP17": QW_BP17,
  "QW-BP18": QW_BP18,
};

function QW_ACT_R1(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "failed") {
    const noTitle = rule.results.filter((r: any) => r.resultCode === "F1");
    if (noTitle.length !== 0) {
      addToElements(elements, "titleNo", noTitle.length);
      addToResults(results, "title_02");
      addToNodes(nodes, "titleNo", null);
    }

    const titleEmpty = rule.results.filter((r: any) => r.resultCode === "F2");
    if (titleEmpty.length !== 0) {
      addToElements(elements, "titleNull", titleEmpty.length);
      addToResults(results, "title_03");
      addToNodes(nodes, "titleNull", titleEmpty);
    }
  } else if (rule.metadata.outcome === "passed") {
    addToElements(elements, "titleOk", rule.metadata.passed);
    addToResults(results, "title_06");
    addToNodes(
      nodes,
      "titleOk",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  }
}

function QW_ACT_R2(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "failed") {
    addToElements(elements, "langNo", rule.metadata.failed);
    addToResults(results, "lang_03");
    addToNodes(
      nodes,
      "langNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  } else if (rule.metadata.outcome === "passed") {
    addToElements(elements, "lang", rule.metadata.passed);
    addToResults(results, "lang_01");
    addToNodes(
      nodes,
      "lang",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  }
}

function QW_ACT_R3(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "failed") {
    addToElements(elements, "langMatchNo", rule.metadata.failed);
    addToResults(results, "lang_04");
    addToNodes(
      nodes,
      "langMatchNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R4(elements: any, results: any, nodes: any, rule: any): void {
  const failRefresh = rule.results.filter((r: any) => r.resultCode === "F1");
  if (failRefresh.length !== 0) {
    addToElements(elements, "metaRefresh", failRefresh.length);
    addToResults(results, "meta_01");
    addToNodes(nodes, "metaRefresh", failRefresh);
  }

  const failRedirect = rule.results.filter((r: any) => r.resultCode === "F2");
  if (failRedirect.length !== 0) {
    addToElements(elements, "metaRedir", failRedirect.length);
    addToResults(results, "meta_02");
    addToNodes(nodes, "metaRedir", failRedirect);
  }
}

function QW_ACT_R5(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "failed") {
    addToElements(elements, "langCodeNo", "lang");
    addToResults(results, "lang_02");
    addToNodes(
      nodes,
      "langCodeNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R6(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "inpImgAltNo", undefined);
    addToResults(results, "inp_img_01a");
    addToNodes(
      nodes,
      "inpImgAltNo",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "inpImgAltNo", rule.metadata.failed);
    addToResults(results, "inp_img_01b");
    addToNodes(
      nodes,
      "inpImgAltNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
    addToElements(
      elements,
      "inp_img_01b",
      rule.results.filter((r: any) => r.verdict !== "inapplicable").length
    );
  }
}

function QW_ACT_R9(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "warning") {
    addToElements(elements, "aSameText", rule.metadata.warning);
    addToResults(results, "a_09");
    addToNodes(
      nodes,
      "aSameText",
      rule.results.filter((r: any) => r.verdict === "warning")
    );
  }
}
function QW_ACT_R15(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "audioAvoidsAutoPlay", undefined);
    addToResults(results, "audio_video_01");
    addToNodes(
      nodes,
      "audioAvoidsAutoPlay",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "audioAutoPlay", rule.metadata.failed);
    addToResults(results, "audio_video_02");
    addToNodes(
      nodes,
      "audioAutoPlay",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R16(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "inputLabelNo", undefined);
    addToResults(results, "input_02b");
    addToNodes(
      nodes,
      "inputLabelNo",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "inputLabelNo", rule.metadata.failed);
    addToResults(results, "input_02");
    addToNodes(
      nodes,
      "inputLabelNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R17(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "imgAltNo", undefined);
    addToResults(results, "img_01a");
    addToNodes(
      nodes,
      "img",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "imgAltNo", rule.metadata.failed);
    addToResults(results, "img_01b");
    addToNodes(
      nodes,
      "imgAltNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }

  const imgEmptyAlt = rule.results.filter((r: any) => r.resultCode === "P1");

  if (imgEmptyAlt.length > 0) {
    addToElements(elements, "imgAltNull", imgEmptyAlt.length);
    addToResults(results, "img_02");
    addToNodes(nodes, "imgAltNull", imgEmptyAlt);
  }
}

function QW_ACT_R19(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "failed") {
    addToElements(elements, "iframeTitleNo", rule.metadata.failed);
    addToResults(results, "iframe_01");
    addToNodes(
      nodes,
      "iframeTitleNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R24(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "autoCmpltValid", rule.metadata.passed);
    addToResults(results, "autocomplete_01");
    addToNodes(
      nodes,
      "autoCmpltValid",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "autoCmpltNotValid", rule.metadata.failed);
    addToResults(results, "autocomplete_02");
    addToNodes(
      nodes,
      "autoCmpltNotValid",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R25(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "ariaStPermitted", rule.metadata.passed);
    addToResults(results, "aria_05");
    addToNodes(
      nodes,
      "ariaStPermitted",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "ariaStNotPermitted", rule.metadata.failed);
    addToResults(results, "aria_06");
    addToNodes(
      nodes,
      "ariaStNotPermitted",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R27(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "ariaAtribDefined", rule.metadata.passed);
    addToResults(results, "aria_07");
    addToNodes(
      nodes,
      "ariaAtribDefined",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "ariaAtribNotDefined", rule.metadata.failed);
    addToResults(results, "aria_08");
    addToNodes(
      nodes,
      "ariaAtribNotDefined",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R33(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "ariaCntxRole", rule.metadata.passed);
    addToResults(results, "aria_01");
    addToNodes(
      nodes,
      "ariaCntxRole",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } 
}
function QW_ACT_R34(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "ariaStValid", rule.metadata.passed);
    addToResults(results, "aria_03");
    addToNodes(
      nodes,
      "ariaStValid",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "ariaStNotValid", rule.metadata.failed);
    addToResults(results, "aria_04");
    addToNodes(
      nodes,
      "ariaStNotValid",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R35(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "hxHasAName", rule.metadata.passed);
    addToResults(results, "heading_01");
    addToNodes(
      nodes,
      "hxHasAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "hxWithoutAName", rule.metadata.failed);
    addToResults(results, "heading_02");
    addToNodes(
      nodes,
      "hxWithoutAName",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R37(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "failed") {
    addToElements(elements, "colorContrast", rule.metadata.failed);
    addToResults(results, "color_02");
    addToNodes(
      nodes,
      "colorContrast",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R38(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "ariaReqElem", rule.metadata.passed);
    addToResults(results, "aria_02");
    addToNodes(
      nodes,
      "ariaReqElem",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  }
}

function QW_ACT_R68(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "failed") {
    addToElements(elements, "lineHeightNo", rule.metadata.failed);
    addToResults(results, "css_01");
    addToNodes(
      nodes,
      "lineHeightNo",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T1(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "areaAltNo", technique.metadata.failed);
    addToResults(results, "area_01b");
    addToNodes(
      nodes,
      "areaAltNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  } else if (
    technique.metadata.outcome === "passed" ||
    technique.metadata.outcome === "warning"
  ) {
    addToElements(elements, "areaAltNo", undefined);
    addToResults(results, "area_01a");
    addToNodes(
      nodes,
      "areaAltNo",
      technique.results.filter(
        (r: any) => r.verdict === "passed" || r.verdict === "warning"
      )
    );
  }
}

function QW_WCAG_T2(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "tableDataCaption", technique.metadata.failed);
    addToResults(results, "table_02");
    addToNodes(
      nodes,
      "tableDataCaption",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T3(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  const outsideFieldset = technique.results.filter(
    (r: any) => r.resultCode === "W1"
  );
  if (outsideFieldset.length !== 0) {
    addToElements(elements, "fieldNoForm", outsideFieldset.length);
    addToResults(results, "field_02");
    addToNodes(nodes, "fieldNoForm", outsideFieldset);
  }

  const fieldsetNoLegend = technique.results.filter(
    (r: any) => r.resultCode === "F1" || r.resultCode === "F2"
  );
  if (fieldsetNoLegend.length !== 0) {
    addToElements(elements, "fieldLegNo", fieldsetNoLegend.length);
    addToResults(results, "field_01");
    addToNodes(nodes, "fieldLegNo", fieldsetNoLegend);
  }
}

function QW_WCAG_T6(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  const passed = technique.results.filter((r: any) => r.verdict === "passed");
  if (passed.length > 0) {
    addToElements(elements, "ehandBoth", passed.length);
    addToResults(results, "ehandler_03");
    addToNodes(nodes, "ehandBoth", passed);
  }

  const failed = technique.results.filter((r: any) => r.verdict === "failed");
  if (failed.length > 0) {
    addToElements(elements, "ehandBothNo", failed.length);
    addToResults(results, "ehandler_02");
    addToNodes(nodes, "ehandBothNo", failed);
  }
}

function QW_WCAG_T7(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "abbrNo", technique.metadata.failed);
    addToResults(results, "abbr_01");
    addToNodes(
      nodes,
      "abbrNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T8(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "imgAltNot", technique.metadata.failed);
    addToResults(results, "img_03");
    addToNodes(
      nodes,
      "imgAltNot",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T9(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  const failsH1Results = technique.results.filter(
    (r: any) => r.resultCode === "F3"
  );
  if (failsH1Results.length > 0) {
    addToElements(elements, "h1", undefined);
    addToResults(results, "hx_01c");
    addToNodes(nodes, "h1", failsH1Results);
  }

  const incorrectOrderResults = technique.results.filter(
    (r: any) => r.resultCode === "F1"
  );
  if (incorrectOrderResults.length > 0) {
    addToElements(elements, "hxSkip", incorrectOrderResults.length);
    addToResults(results, "hx_03");
    addToNodes(nodes, "hxSkip", incorrectOrderResults);
  }
}

function QW_WCAG_T14(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "tableComplexError", technique.metadata.failed);
    addToResults(results, "table_06");
    addToNodes(
      nodes,
      "tableComplexError",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T15(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "linkRel", technique.metadata.failed);
    addToResults(results, "link_01");
    addToNodes(
      nodes,
      "linkRel",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T16(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "w3cValidator", "true");
    addToElements(elements, "w3cValidatorErrors", technique.metadata.failed);
    addToResults(results, "w3c_validator_01b");
    addToNodes(
      nodes,
      "w3cValidatorErrors",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  } else if (
    technique.metadata.outcome === "passed" ||
    technique.metadata.outcome === "warning"
  ) {
    addToElements(elements, "w3cValidator", "true");
    addToElements(elements, "w3cValidatorErrors", 0);
    addToResults(results, "w3c_validator_01a");
    addToNodes(
      nodes,
      "w3cValidatorErrors",
      technique.results.filter(
        (r: any) => r.verdict === "passed" || r.verdict === "warning"
      )
    );
  }
}

function QW_WCAG_T17(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  const incorrectLabelResults = technique.results.filter(
    (r: any) => r.verdict === "failed"
  );
  if (incorrectLabelResults.length > 0) {
    addToElements(elements, "labelPosNo", incorrectLabelResults.length);
    addToResults(results, "label_02");
    addToNodes(nodes, "labelPosNo", incorrectLabelResults);
  }
}

function QW_WCAG_T32(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "liNoList", technique.metadata.failed);
    addToResults(results, "list_01");
    addToNodes(
      nodes,
      "liNoList",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T18(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "tableLayout", technique.metadata.failed);
    addToResults(results, "table_05a");
    addToNodes(
      nodes,
      "tableLayout",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T19(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "formSubmitNo", undefined);
    addToResults(results, "form_01a");
    addToNodes(
      nodes,
      "formSubmitNo",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "formSubmitNo", technique.metadata.failed);
    addToResults(results, "form_01b");
    addToNodes(
      nodes,
      "formSubmitNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T20(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  const titleMatchResults = technique.results.filter(
    (r: any) => r.resultCode === "F2"
  );
  if (titleMatchResults.length > 0) {
    addToElements(elements, "aTitleMatch", titleMatchResults.length);
    addToResults(results, "a_05");
    addToNodes(nodes, "aTitleMatch", titleMatchResults);
  }
}

function QW_WCAG_T21(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "aImgAltNo", technique.metadata.failed);
    addToResults(results, "a_03");
    addToNodes(
      nodes,
      "aImgAltNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T22(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "newWinOnLoad", technique.metadata.failed);
    addToResults(results, "win_01");
    addToNodes(
      nodes,
      "newWinOnLoad",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

/*function QW_WCAG_T37(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === 'warning') {
    addToElements(elements, 'aSkip', technique.metadata.warning);
    addToResults(results, 'a_02b');
    addToNodes(nodes, 'aSkip', technique.results.filter((r: any) => r.verdict === 'warning'));
  } else if (technique.metadata.outcome === 'failed') {
    addToElements(elements, 'aSkip', undefined);
    addToResults(results, 'a_02a');
    addToNodes(nodes, 'aSkip', technique.results.filter((r: any) => r.verdict === 'failed'));
  }
}*/

function QW_WCAG_T23(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "warning") {
    addToElements(elements, "aSkipFirst", technique.metadata.warning);
    addToResults(results, "a_01a");
    addToNodes(
      nodes,
      "aSkipFirst",
      technique.results.filter((r: any) => r.verdict === "warning")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "aSkipFirst", undefined);
    addToResults(results, "a_01b");
    addToNodes(
      nodes,
      "aSkipFirst",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T24(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "focusBlur", technique.metadata.failed);
    addToResults(results, "focus_01");
    addToNodes(
      nodes,
      "focusBlur",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T25(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  const incorrectScope = technique.results.filter(
    (r: any) => r.resultCode === "F2" || r.resultCode === "F3"
  );
  if (incorrectScope.length > 0) {
    addToElements(elements, "scopeNo", incorrectScope.length);
    addToResults(results, "scope_01");
    addToNodes(nodes, "scopeNo", incorrectScope);
  }
}

function QW_WCAG_T26(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "ehandTagNo", technique.metadata.failed);
    addToResults(results, "ehandler_04");
    addToNodes(
      nodes,
      "ehandTagNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T27(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "justifiedTxt", technique.metadata.failed);
    addToResults(results, "justif_txt_01");
    addToNodes(
      nodes,
      "justifiedTxt",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T28(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "fontAbsVal", technique.metadata.failed);
    addToResults(results, "font_02");
    addToNodes(
      nodes,
      "fontAbsVal",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T29(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "justifiedCss", technique.metadata.failed);
    addToResults(results, "justif_txt_02");
    addToNodes(
      nodes,
      "justifiedCss",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T30(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "cssBlink", technique.metadata.failed);
    addToResults(results, "blink_02");
    addToNodes(nodes, "cssBlink", [
      JSON.stringify(technique.results.filter((r) => r.verdict === "failed")),
    ]);
  }
}

function QW_WCAG_T31(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "colorFgBgNo", technique.metadata.failed);
    addToResults(results, "color_01");
    addToNodes(
      nodes,
      "colorFgBgNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP1(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "hx", undefined);
    addToResults(results, "hx_01a");
    addToNodes(nodes, "hx", undefined);
  } else if (technique.metadata.outcome === "warning") {
    addToElements(elements, "hx", technique.metadata.warning);
    addToResults(results, "hx_01b");
    addToNodes(
      nodes,
      "hx",
      technique.results.filter((r: any) => r.verdict === "warning")
    );
  }
}

function QW_BP2(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "imgAltLong", technique.metadata.failed);
    addToResults(results, "img_04");
    addToNodes(
      nodes,
      "imgAltLong",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP4(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "aGroupNo", technique.metadata.failed);
    addToResults(results, "a_07");
    addToNodes(
      nodes,
      "aGroupNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP5(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "tableNested", technique.metadata.failed);
    addToResults(results, "table_04");
    addToNodes(
      nodes,
      "tableNested",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP6(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "titleLong", technique.metadata.failed);
    addToResults(results, "title_04");
    addToNodes(
      nodes,
      "titleLong",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP7(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "titleChars", technique.metadata.failed);
    addToResults(results, "title_05");
    addToNodes(
      nodes,
      "titleChars",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP8(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "hxNo", technique.metadata.failed);
    addToResults(results, "hx_02");
    addToNodes(
      nodes,
      "hxNo",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP9(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.passed > 0) {
    addToElements(elements, "tableLayoutCaption", technique.metadata.passed);
    addToResults(results, "table_01");
    addToNodes(
      nodes,
      "tableLayoutCaption",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  }
}

function QW_BP10(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "layoutElem", technique.metadata.failed);
    addToResults(results, "layout_01b");
    addToNodes(
      nodes,
      "layoutElem",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  } else if (technique.metadata.outcome === "passed") {
    addToElements(elements, "layoutElem", undefined);
    addToResults(results, "layout_01a");
    addToNodes(nodes, "layoutElem", undefined);
  }
}

function QW_BP11(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "brSec", technique.metadata.failed);
    addToResults(results, "br_01");
    addToNodes(
      nodes,
      "brSec",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP13(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "aAdjacentSame", technique.metadata.failed);
    addToResults(results, "a_06");
    addToNodes(
      nodes,
      "aAdjacentSame",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP14(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "layoutFixed", technique.metadata.failed);
    addToResults(results, "layout_03");
    addToNodes(
      nodes,
      "layoutFixed",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP15(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "valueRelHtml", technique.metadata.passed);
    addToResults(results, "values_01b");
    addToNodes(
      nodes,
      "valueRelHtml",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "valueAbsHtml", technique.metadata.failed);
    addToResults(results, "values_01a");
    addToNodes(
      nodes,
      "valueAbsHtml",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP17(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "a", undefined);
    addToResults(results, "a_04");
    addToNodes(nodes, "a", []);
  } else {
    addToElements(elements, "a", technique.results.length);
    addToNodes(nodes, "a", technique.results);
  }

  if (technique.metadata.outcome === "warning") {
    addToElements(elements, "aSkip", technique.metadata.warning);
    addToResults(results, "a_02b");
    addToNodes(
      nodes,
      "aSkip",
      technique.results.filter((r: any) => r.verdict === "warning")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "aSkip", undefined);
    addToResults(results, "a_02a");
    addToNodes(
      nodes,
      "aSkip",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP18(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "valueAbsCss", technique.metadata.failed);
    addToResults(results, "values_02a");
    addToNodes(
      nodes,
      "valueAbsCss",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
  if (technique.metadata.passed > 0) {
    addToElements(elements, "valueRelCss", technique.metadata.passed);
    addToResults(results, "values_02b");
    addToNodes(nodes, "valueRelCss", [
      JSON.stringify(technique.results.filter((r) => r.verdict === "passed")),
    ]);
  }
}

function addToElements(
  elements: any,
  key: string,
  value: string | number
): void {
  if (elements[key] === undefined) {
    elements[key] = value;
  } else {
    elements[key] += value;
  }
}

function addToResults(results: any, key: string): void {
  results[key] = "something";
}

function addToNodes(nodes: any, key: string, elements: any[]): void {
  nodes[key] = elements;
}

export function getElementsMapping(evaluation: any): any {
  const elements = {};
  const results = {};
  const nodes = {};

  for (const rule of Object.keys(evaluation.modules["act-rules"].assertions) ||
    []) {
    if (act_mapping[rule] !== undefined) {
      act_mapping[rule](
        elements,
        results,
        nodes,
        evaluation.modules["act-rules"].assertions[rule]
      );
    }
  }

  for (const technique of Object.keys(
    evaluation.modules["wcag-techniques"].assertions
  ) || []) {
    if (wcag_mapping[technique] !== undefined) {
      wcag_mapping[technique](
        elements,
        results,
        nodes,
        evaluation.modules["wcag-techniques"].assertions[technique]
      );
    }
  }

  for (const technique of Object.keys(
    evaluation.modules["best-practices"].assertions
  ) || []) {
    if (bp_mapping[technique] !== undefined) {
      bp_mapping[technique](
        elements,
        results,
        nodes,
        evaluation.modules["best-practices"].assertions[technique]
      );
    }
  }

  return { elements, results, nodes };
}
