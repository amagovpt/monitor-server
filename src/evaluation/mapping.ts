const act_mapping = {
  "QW-ACT-R1": QW_ACT_R1,
  "QW-ACT-R2": QW_ACT_R2,
  "QW-ACT-R4": QW_ACT_R4,
  "QW-ACT-R5": QW_ACT_R5,
  "QW-ACT-R6": QW_ACT_R6,
  "QW-ACT-R7": QW_ACT_R7,
  "QW-ACT-R9": QW_ACT_R9,
  "QW-ACT-R10": QW_ACT_R10,
  "QW-ACT-R11": QW_ACT_R11,
  "QW-ACT-R12": QW_ACT_R12,
  "QW-ACT-R13": QW_ACT_R13,
  "QW-ACT-R14": QW_ACT_R14,
  "QW-ACT-R15": QW_ACT_R15,
  "QW-ACT-R16": QW_ACT_R16,
  "QW-ACT-R17": QW_ACT_R17,
  "QW-ACT-R19": QW_ACT_R19,
  "QW-ACT-R20": QW_ACT_R20,
  "QW-ACT-R21": QW_ACT_R21,
  "QW-ACT-R22": QW_ACT_R22,
  "QW-ACT-R23": QW_ACT_R23,
  "QW-ACT-R24": QW_ACT_R24,
  "QW-ACT-R25": QW_ACT_R25,
  "QW-ACT-R26": QW_ACT_R26,
  "QW-ACT-R27": QW_ACT_R27,
  "QW-ACT-R28": QW_ACT_R28,
  "QW-ACT-R30": QW_ACT_R30,
  "QW-ACT-R33": QW_ACT_R33,
  "QW-ACT-R34": QW_ACT_R34,
  "QW-ACT-R35": QW_ACT_R35,
  "QW-ACT-R36": QW_ACT_R36,
  "QW-ACT-R37": QW_ACT_R37,
  "QW-ACT-R38": QW_ACT_R38,
  "QW-ACT-R39": QW_ACT_R39,
  "QW-ACT-R40": QW_ACT_R40,
  "QW-ACT-R42": QW_ACT_R42,
  "QW-ACT-R43": QW_ACT_R43,
  "QW-ACT-R44": QW_ACT_R44,
  "QW-ACT-R48": QW_ACT_R48,
  "QW-ACT-R62": QW_ACT_R62,
  "QW-ACT-R65": QW_ACT_R65,
  "QW-ACT-R66": QW_ACT_R66,
  "QW-ACT-R67": QW_ACT_R67,
  "QW-ACT-R68": QW_ACT_R68,
  "QW-ACT-R69": QW_ACT_R69,
  "QW-ACT-R70": QW_ACT_R70,
  "QW-ACT-R71": QW_ACT_R71,
  "QW-ACT-R76": QW_ACT_R76,
  "QW-ACT-R77": QW_ACT_R77,
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
  "QW-WCAG-T33": QW_WCAG_T33,
  "QW-WCAG-T34": QW_WCAG_T34,
  "QW-WCAG-T35": QW_WCAG_T35,
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
  // "QW-BP15": QW_BP15,
  "QW-BP17": QW_BP17,
  // "QW-BP18": QW_BP18,
  "QW-BP19": QW_BP19,
  "QW-BP20": QW_BP20,
  "QW-BP21": QW_BP21,
  "QW-BP22": QW_BP22,
  "QW-BP23": QW_BP23,
  "QW-BP24": QW_BP24,
  "QW-BP25": QW_BP25,
  "QW-BP26": QW_BP26,
  "QW-BP27": QW_BP27,
  "QW-BP28": QW_BP28,
  "QW-BP29": QW_BP29,
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
    addToElements(elements, "inpImgAltYes", undefined);
    addToResults(results, "inp_img_01a");
    addToNodes(
      nodes,
      "inpImgAltYes",
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
function QW_ACT_R7(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "orientationCSS", rule.metadata.passed);
    addToResults(results, "orientation_01");
    addToNodes(
      nodes,
      "orientationCSS",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "orientationCSSNot", rule.metadata.failed);
    addToResults(results, "orientation_02");
    addToNodes(
      nodes,
      "orientationCSSNot",
      rule.results.filter((r: any) => r.verdict === "failed")
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
function QW_ACT_R10(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "iframeSame", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "iframeSameAName", rule.metadata.passed);
    addToResults(results, "iframe_02");
    addToNodes(
      nodes,
      "iframeSameAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "iframeSameANameDiferent", rule.metadata.failed);
    addToResults(results, "iframe_03");
    addToNodes(
      nodes,
      "iframeSameANameDiferent",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R11(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "button", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "buttonAname", rule.metadata.passed);
    addToResults(results, "button_01");
    addToNodes(
      nodes,
      "buttonAname",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "buttonNotAname", rule.metadata.failed);
    addToResults(results, "button_02");
    addToNodes(
      nodes,
      "buttonNotAname",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R12(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "a", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "linkAName", rule.metadata.passed);
    addToResults(results, "a_10");
    addToNodes(
      nodes,
      "linkAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "linkNotAName", rule.metadata.failed);
    addToResults(results, "a_11");
    addToNodes(
      nodes,
      "linkNotAName",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R13(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "elementDec", rule.metadata.passed);
    addToResults(results, "element_02");
    addToNodes(
      nodes,
      "elementDec",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "elementNotDec", rule.metadata.failed);
    addToResults(results, "element_03");
    addToNodes(
      nodes,
      "elementNotDec",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R14(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "metaViewport", rule.metadata.passed);
    addToResults(results, "meta_05");
    addToNodes(
      nodes,
      "metaViewport",
      rule.results.filter((r: any) => r.verdict === "passed")
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
    addToElements(elements, "inputLabel", undefined);
    addToResults(results, "input_02b");
    addToNodes(
      nodes,
      "inputLabel",
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
  addToElements(elements, "img", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "imgAlt", undefined);
    addToResults(results, "img_01a");
    addToNodes(
      nodes,
      "imgAlt",
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
function QW_ACT_R21(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "svg", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "svgAName", rule.metadata.passed);
    addToResults(results, "svg_01");
    addToNodes(
      nodes,
      "svgAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "svgNotAName", rule.metadata.failed);
    addToResults(results, "svg_02");
    addToNodes(
      nodes,
      "svgNotAName",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R20(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "roleValid", rule.metadata.passed);
    addToResults(results, "role_01");
    addToNodes(
      nodes,
      "roleValid",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "roleValidNot", rule.metadata.failed);
    addToResults(results, "role_02");
    addToNodes(
      nodes,
      "roleValidNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R22(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "elementLang", rule.metadata.passed);
    addToResults(results, "element_06");
    addToNodes(
      nodes,
      "elementLang",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "elementNotLang", rule.metadata.failed);
    addToResults(results, "element_07");
    addToNodes(
      nodes,
      "elementNotLang",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R23(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "videoVisual", rule.metadata.passed);
    addToResults(results, "video_02");
    addToNodes(
      nodes,
      "videoVisual",
      rule.results.filter((r: any) => r.verdict === "passed")
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
function QW_ACT_R26(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "videoAudit", rule.metadata.passed);
    addToResults(results, "video_01");
    addToNodes(
      nodes,
      "videoAudit",
      rule.results.filter((r: any) => r.verdict === "passed")
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
function QW_ACT_R28(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "elementRole", rule.metadata.passed);
    addToResults(results, "element_10");
    addToNodes(
      nodes,
      "elementRole",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  }
}
function QW_ACT_R30(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "labelAName", rule.metadata.passed);
    addToResults(results, "label_01");
    addToNodes(
      nodes,
      "labelAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "labelANameNot", rule.metadata.failed);
    addToResults(results, "label_03");
    addToNodes(
      nodes,
      "labelANameNot",
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
function QW_ACT_R36(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "headers", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "headerAtt", rule.metadata.passed);
    addToResults(results, "headers_01");
    addToNodes(
      nodes,
      "headerAtt",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "headerAttNot", rule.metadata.failed);
    addToResults(results, "headers_02");
    addToNodes(
      nodes,
      "headerAttNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R37(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "id", rule.results.length);
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
function QW_ACT_R39(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "tableHdr", rule.metadata.passed);
    addToResults(results, "table_07");
    addToNodes(
      nodes,
      "tableHdr",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "tableHdrNot", rule.metadata.failed);
    addToResults(results, "table_08");
    addToNodes(
      nodes,
      "tableHdrNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R40(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "overflow", rule.metadata.passed);
    addToResults(results, "css_02");
    addToNodes(
      nodes,
      "overflow",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  }
}
function QW_ACT_R42(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "objectAName", rule.metadata.passed);
    addToResults(results, "object_01");
    addToNodes(
      nodes,
      "objectAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "objectANameNot", rule.metadata.failed);
    addToResults(results, "object_02");
    addToNodes(
      nodes,
      "objectANameNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R43(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "scrollable", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "scrollableAccess", rule.metadata.passed);
    addToResults(results, "scrollable_01");
    addToNodes(
      nodes,
      "scrollableAccess",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "scrollableAccessNot", rule.metadata.failed);
    addToResults(results, "scrollable_02");
    addToNodes(
      nodes,
      "scrollableAccessNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R44(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "linkIdentAName", rule.metadata.passed);
    addToResults(results, "a_12");
    addToNodes(
      nodes,
      "linkIdentAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "linkIdentANameNot", rule.metadata.failed);
    addToResults(results, "a_13");
    addToNodes(
      nodes,
      "linkIdentANameNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R48(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "elementHiddenFocus", rule.metadata.passed);
    addToResults(results, "element_04");
    addToNodes(
      nodes,
      "elementHiddenFocus",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "elementNotHiddenFocus", rule.metadata.failed);
    addToResults(results, "element_05");
    addToNodes(
      nodes,
      "elementNotHiddenFocus",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R62(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "seqFocus", rule.metadata.passed);
    addToResults(results, "element_01");
    addToNodes(
      nodes,
      "seqFocus",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  }
}
function QW_ACT_R65(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(
      elements,
      "elementPresentChildrenNoFocus",
      rule.metadata.passed
    );
    addToResults(results, "element_08");
    addToNodes(
      nodes,
      "elementPresentChildrenNoFocus",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(
      elements,
      "elementPresentChildrenFocus",
      rule.metadata.failed
    );
    addToResults(results, "element_09");
    addToNodes(
      nodes,
      "elementPresentChildrenFocus",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R66(elements: any, results: any, nodes: any, rule: any): void {
  addToElements(elements, "menuItem", rule.results.length);
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "menuItemAName", rule.metadata.passed);
    addToResults(results, "menuItem_01");
    addToNodes(
      nodes,
      "menuItemAName",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "menuItemANameNot", rule.metadata.failed);
    addToResults(results, "menuItem_02");
    addToNodes(
      nodes,
      "menuItemANameNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R67(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "letterSpacing", rule.metadata.passed);
    addToResults(results, "letter_01");
    addToNodes(
      nodes,
      "letterSpacing",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "letterSpacingNot", rule.metadata.failed);
    addToResults(results, "letter_02");
    addToNodes(
      nodes,
      "letterSpacingNot",
      rule.results.filter((r: any) => r.verdict === "failed")
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
function QW_ACT_R69(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "wordSpacing", rule.metadata.passed);
    addToResults(results, "word_01");
    addToNodes(
      nodes,
      "wordSpacing",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "wordSpacingNot", rule.metadata.failed);
    addToResults(results, "word_02");
    addToNodes(
      nodes,
      "wordSpacingNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R70(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "iframeNegTabIndex", rule.metadata.passed);
    addToResults(results, "iframe_04");
    addToNodes(
      nodes,
      "iframeNegTabIndex",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "iframeNegTabIndexNot", rule.metadata.failed);
    addToResults(results, "iframe_05");
    addToNodes(
      nodes,
      "iframeNegTabIndexNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R71(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "metaRefresh", rule.metadata.passed);
    addToResults(results, "meta_03");
    addToNodes(
      nodes,
      "metaRefresh",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "metaRefreshNot", rule.metadata.failed);
    addToResults(results, "meta_04");
    addToNodes(
      nodes,
      "metaRefreshNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}
function QW_ACT_R76(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "textContrastH", rule.metadata.passed);
    addToResults(results, "textC_01");
    addToNodes(
      nodes,
      "textContrastH",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "textContrastHNot", rule.metadata.failed);
    addToResults(results, "textC_02");
    addToNodes(
      nodes,
      "textContrastHNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_ACT_R77(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "ariaControlsIdFound", rule.metadata.passed);
    addToResults(results, "aria_10");
    addToNodes(
      nodes,
      "ariaControlsIdFound",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "ariaControlsIdNotFound", rule.metadata.failed);
    addToResults(results, "aria_09");
    addToNodes(
      nodes,
      "ariaControlsIdNotFound",
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
    addToElements(elements, "areaAltYes", undefined);
    addToResults(results, "area_01a");
    addToNodes(
      nodes,
      "areaAltYes",
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
    addToElements(elements, "w3cValidatorErrorsNo", 0);
    addToResults(results, "w3c_validator_01a");
    addToNodes(
      nodes,
      "w3cValidatorErrorsNo",
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
    addToElements(elements, "formSubmit", undefined);
    addToResults(results, "form_01a");
    addToNodes(
      nodes,
      "formSubmit",
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
    addToElements(elements, "aSkipFirstNo", technique.metadata.failed);
    addToResults(results, "a_01b");
    addToNodes(
      nodes,
      "aSkipFirstNo",
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
  addToElements(elements, "fontValues", technique.results.length);
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
      technique.results.filter((r) => r.verdict === "failed"),
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

function QW_WCAG_T33(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  addToElements(elements, "dd,dt", technique.results.length);

  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "descListElement", technique.metadata.passed);
    addToResults(results, "list_04");
    addToNodes(
      nodes,
      "descListElement",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "notDescListElement", undefined);
    addToResults(results, "list_05");
    addToNodes(
      nodes,
      "notDescListElement",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T34(
  elements: any,
  results: any,
  nodes: any,
  technique: any
): void {
  addToElements(elements, "dl", technique.results.length);
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "descList", technique.metadata.passed);
    addToResults(results, "list_06");
    addToNodes(
      nodes,
      "descList",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "notDescList", undefined);
    addToResults(results, "list_07");
    addToNodes(
      nodes,
      "notDescList",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_WCAG_T35(elements: any, results: any, nodes: any, rule: any): void {
  if (rule.metadata.outcome === "passed") {
    addToElements(elements, "idAtt", rule.metadata.passed);
    addToResults(results, "id_01");
    addToNodes(
      nodes,
      "idAtt",
      rule.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (rule.metadata.outcome === "failed") {
    addToElements(elements, "idAttNot", rule.metadata.failed);
    addToResults(results, "id_02");
    addToNodes(
      nodes,
      "idAttNot",
      rule.results.filter((r: any) => r.verdict === "failed")
    );
  }
}

function QW_BP1(elements: any, results: any, nodes: any, technique: any): void {
  if (technique.metadata.outcome === "failed") {
    addToElements(elements, "hxNone", technique.metadata.failed);
    addToResults(results, "hx_01a");
    addToNodes(
      nodes,
      "hxNone",
      technique.results.filter((r: any) => r.verdict === "failed")
    );
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
    addToElements(elements, "layoutElemNo", undefined);
    addToResults(results, "layout_01a");
    addToNodes(nodes, "layoutElemNo", undefined);
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
    addToElements(elements, "a", technique.results.length);
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
    addToElements(elements, "aSkipNo", technique.metadata.failed);
    addToResults(results, "a_02a");
    addToNodes(
      nodes,
      "aSkipNo",
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
      technique.results.filter((r) => r.verdict === "passed"),
    ]);
  }
}

function QW_BP19(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "bannerTopLevel", technique.metadata.passed);
    addToResults(results, "landmark_01");
    addToNodes(
      nodes,
      "bannerTopLevel",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "bannerNotTopLevel", technique.metadata.failed);
    addToResults(results, "landmark_02");
    addToNodes(
      nodes,
      "bannerNotTopLevel",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP20(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "noDuplicateBanner", technique.metadata.passed);
    addToResults(results, "landmark_09");
    addToNodes(
      nodes,
      "noDuplicateBanner",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "duplicateBanner", technique.metadata.failed);
    addToResults(results, "landmark_10");
    addToNodes(
      nodes,
      "duplicateBanner",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP21(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(
      elements,
      "noDuplicateContentinfo",
      technique.metadata.passed
    );
    addToResults(results, "landmark_11");
    addToNodes(
      nodes,
      "noDuplicateContentinfo",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "duplicateContentinfo", technique.metadata.failed);
    addToResults(results, "landmark_12");
    addToNodes(
      nodes,
      "duplicateContentinfo",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP22(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "noDuplicateMain", technique.metadata.passed);
    addToResults(results, "landmark_13");
    addToNodes(
      nodes,
      "noDuplicateMain",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "duplicateMain", technique.metadata.failed);
    addToResults(results, "landmark_14");
    addToNodes(
      nodes,
      "duplicateMain",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP23(elements: any, results: any, nodes: any, technique: any) {
  addToElements(elements, "li", technique.results.length);
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "liSemantically", technique.metadata.passed);
    addToResults(results, "listitem_01");
    addToNodes(
      nodes,
      "liSemantically",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "liNotSemantically", technique.metadata.failed);
    addToResults(results, "listitem_02");
    addToNodes(
      nodes,
      "liNotSemantically",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP24(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "listCorrectly", technique.metadata.passed);
    addToResults(results, "list_02");
    addToNodes(
      nodes,
      "listCorrectly",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "listNotCorrectly", technique.metadata.failed);
    addToResults(results, "list_03");
    addToNodes(
      nodes,
      "listNotCorrectly",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP25(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "complementaryTopLevel", technique.metadata.passed);
    addToResults(results, "landmark_03");
    addToNodes(
      nodes,
      "complementaryTopLevel",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(
      elements,
      "complementaryNotTopLevel",
      technique.metadata.failed
    );
    addToResults(results, "landmark_04");
    addToNodes(
      nodes,
      "complementaryNotTopLevel",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP26(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "contentinfoTopLevel", technique.metadata.passed);
    addToResults(results, "landmark_05");
    addToNodes(
      nodes,
      "contentinfoTopLevel",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(
      elements,
      "contentinfoNotTopLevel",
      technique.metadata.failed
    );
    addToResults(results, "landmark_06");
    addToNodes(
      nodes,
      "contentinfoNotTopLevel",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP27(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "mainTopLevel", technique.metadata.passed);
    addToResults(results, "landmark_07");
    addToNodes(
      nodes,
      "mainTopLevel",
      technique.results.filter((r: any) => r.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    addToElements(elements, "mainNotTopLevel", technique.metadata.failed);
    addToResults(results, "landmark_08");
    addToNodes(
      nodes,
      "mainNotTopLevel",
      technique.results.filter((r) => r.verdict === "failed")
    );
  }
}

function QW_BP28(elements: any, results: any, nodes: any, technique: any) {
  if (technique.metadata.outcome === "passed") {
    addToElements(elements, "onlyOneh1", technique.metadata.passed);
    addToResults(results, "heading_03");
    addToNodes(
      nodes,
      "onlyOneh1",
      technique.results.filter((t: any) => t.verdict === "passed")
    );
  } else if (technique.metadata.outcome === "failed") {
    const noH1 = technique.results.filter((t: any) => t.resultCode === "F1");
    if (noH1.length !== 0) {
      addToElements(elements, "notOneh1", 0);
      addToResults(results, "heading_04");
    }
    const multipleH1 = technique.results.filter((t: any) => t.resultCode === "F2");
    if (multipleH1.length !== 0) {
      addToElements(elements, "notOneh1", technique.metadata.failed);
      addToResults(results, "heading_04");
      addToNodes(
        nodes,
        "notOneh1",
        technique.results.filter((t) => t.resultCode === "F2")
      );
    }
  }
}

function QW_BP29(elements: any, results: any, nodes: any, rule: any): void {
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
      // if (technique === "QW-WCAG-T9")
      //     console.log(technique, "\n*\n", evaluation.modules["wcag-techniques"].assertions[technique])
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
