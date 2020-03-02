"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    'QW-HTML-T8': QW_HTML_T8,
    'QW-HTML-T9': QW_HTML_T9,
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
    'QW-HTML-T42': QW_HTML_T42,
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
    'QW-BP11': QW_BP11,
    'QW-BP13': QW_BP13,
    'QW-BP14': QW_BP14,
    'QW-BP15': QW_BP15
};
function QW_ACT_R1(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'failed') {
        const noTitle = rule.results.filter((r) => r.resultCode === 'RC1');
        if (noTitle.length !== 0) {
            addToElements(elements, 'titleNo', noTitle.length);
            addToResults(results, 'title_02');
            addToNodes(nodes, 'titleNo', noTitle.map((r) => r.pointer));
        }
        const titleEmpty = rule.results.filter((r) => r.resultCode === 'RC2');
        if (titleEmpty.length !== 0) {
            addToElements(elements, 'titleNull', titleEmpty.length);
            addToResults(results, 'title_03');
            addToNodes(nodes, 'titleNull', titleEmpty.map((r) => r.pointer));
        }
    }
    else if (rule.metadata.outcome === 'passed') {
        addToElements(elements, 'titleOk', rule.metadata.passed);
        addToResults(results, 'title_06');
        addToNodes(nodes, 'titleOk', rule.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_ACT_R2(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'failed') {
        addToElements(elements, 'langCodeNo', rule.metadata.failed);
        addToResults(results, 'lang_02');
        addToNodes(nodes, 'langCodeNo', rule.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
    else if (rule.metadata.outcome === 'passed') {
        addToElements(elements, 'lang', rule.metadata.passed);
        addToResults(results, 'lang_01');
        addToNodes(nodes, 'lang', rule.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_ACT_R3(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'failed') {
        addToElements(elements, 'langMatchNo', rule.metadata.failed);
        addToResults(results, 'lang_04');
        addToNodes(nodes, 'langMatchNo', rule.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_ACT_R4(elements, results, nodes, rule) {
    const failRefresh = rule.results.filter((r) => r.resultCode === 'RC9');
    if (failRefresh.length !== 0) {
        addToElements(elements, 'metaRefresh', failRefresh.length);
        addToResults(results, 'meta_01');
        addToNodes(nodes, 'metaRefresh', failRefresh.map((r) => r.pointer));
    }
    const failRedirect = rule.results.filter((r) => r.resultCode === 'RC14');
    if (failRedirect.length !== 0) {
        addToElements(elements, 'metaRedir', failRedirect.length);
        addToResults(results, 'meta_02');
        addToNodes(nodes, 'metaRedir', failRedirect.map((r) => r.pointer));
    }
}
function QW_ACT_R5(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'failed') {
        addToElements(elements, 'langNo', 'xml:lang');
        addToResults(results, 'lang_03');
        addToNodes(nodes, 'langNo', rule.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_ACT_R6(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'passed') {
        addToElements(elements, 'inpImgAltNo', rule.metadata.passed);
        addToResults(results, 'inp_img_01a');
        addToNodes(nodes, 'inpImgAltNo', rule.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_ACT_R9(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'warning') {
        addToElements(elements, 'aSameText', rule.metadata.warning);
        addToResults(results, 'a_09');
        addToNodes(nodes, 'aSameText', rule.results.filter((r) => r.verdict === 'warning').map((r) => r.pointer));
    }
}
function QW_ACT_R16(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'failed') {
        addToElements(elements, 'inputLabelNo', rule.metadata.failed);
        addToResults(results, 'input_02b');
        addToNodes(nodes, 'inputLabelNo', rule.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
    else if (rule.metadata.outcome === 'passed') {
        addToElements(elements, 'inputLabelNo', rule.metadata.passed);
        addToResults(results, 'input_02');
        addToNodes(nodes, 'inputLabelNo', rule.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_ACT_R17(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'passed') {
        addToElements(elements, 'imgAltNo', rule.metadata.passed);
        addToResults(results, 'img_01a');
        addToNodes(nodes, 'imgAltNo', rule.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
    else if (rule.metadata.outcome === 'failed') {
        const imgNoAlt = rule.results.filter((r) => r.resultCode === 'RC1');
        if (imgNoAlt.length > 0) {
            addToElements(elements, 'imgAltNo', imgNoAlt.length);
            addToResults(results, 'img_01b');
            addToNodes(nodes, 'imgAltNo', imgNoAlt.map((r) => r.pointer));
        }
    }
    const imgEmptyAlt = rule.results.filter((r) => r.resultCode === 'RC6');
    if (imgEmptyAlt.length > 0) {
        addToElements(elements, 'imgAltNull', imgEmptyAlt.length);
        addToResults(results, 'img_02');
        addToNodes(nodes, 'imgAltNull', imgEmptyAlt.map((r) => r.pointer));
    }
}
function QW_ACT_R18(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'failed') {
        addToElements(elements, 'idRep', rule.metadata.failed);
        addToResults(results, 'id_01');
        addToNodes(nodes, 'idRep', rule.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_ACT_R19(elements, results, nodes, rule) {
    if (rule.metadata.outcome === 'failed') {
        addToElements(elements, 'iframeTitleNo', rule.metadata.failed);
        addToResults(results, 'iframe_01');
        addToNodes(nodes, 'iframeTitleNo', rule.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T1(elements, results, nodes, technique) {
    const outsideFieldset = technique.results.filter((r) => r.resultCode === 'RC1');
    if (outsideFieldset.length !== 0) {
        addToElements(elements, 'fieldNoForm', outsideFieldset.length);
        addToResults(results, 'field_02');
        addToNodes(nodes, 'fieldNoForm', outsideFieldset.map((r) => r.pointer));
    }
    const fieldsetNoLegend = technique.results.filter((r) => (r.resultCode === 'RC2' || r.resultCode === 'RC3'));
    if (fieldsetNoLegend.length !== 0) {
        addToElements(elements, 'fieldLegNo', fieldsetNoLegend.length);
        addToResults(results, 'field_01');
        addToNodes(nodes, 'fieldLegNo', fieldsetNoLegend.map((r) => r.pointer));
    }
}
function QW_HTML_T2(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'tableDataCaption', technique.metadata.failed);
        addToResults(results, 'table_02');
        addToNodes(nodes, 'tableDataCaption', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T3(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'areaAltNo', technique.metadata.failed);
        addToResults(results, 'area_01b');
        addToNodes(nodes, 'areaAltNo', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'passed' || technique.metadata.outcome === 'warning') {
        addToElements(elements, 'areaAltNo', technique.metadata.passed + technique.metadata.warning);
        addToResults(results, 'area_01a');
        addToNodes(nodes, 'areaAltNo', technique.results.filter((r) => (r.verdict === 'passed' || r.verdict === 'warning')).map((r) => r.pointer));
    }
}
function QW_HTML_T5(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'inpImgAltNo', technique.metadata.failed);
        addToResults(results, 'inp_img_01b');
        addToNodes(nodes, 'inpImgAltNo', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T6(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'ehandBoth', technique.metadata.failed);
        addToResults(results, 'ehandler_03');
        addToNodes(nodes, 'ehandBoth', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'passed') {
        addToElements(elements, 'ehandBothNo', technique.metadata.passed);
        addToResults(results, 'ehandler_02');
        addToNodes(nodes, 'ehandBothNo', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_HTML_T7(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'abbrNo', technique.metadata.failed);
        addToResults(results, 'abbr_01');
        addToNodes(nodes, 'abbrNo', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T8(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'imgAltNot', technique.metadata.failed);
        addToResults(results, 'img_03');
        addToNodes(nodes, 'imgAltNot', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T9(elements, results, nodes, technique) {
    const failsH1Results = technique.results.filter((r) => r.resultCode === 'RC3');
    if (failsH1Results.length > 0) {
        addToElements(elements, 'h1', failsH1Results.length);
        addToResults(results, 'hx_01c');
        addToNodes(nodes, 'h1', failsH1Results.map((r) => r.pointer));
    }
    const incorrectOrderResults = technique.results.filter((r) => r.resultCode === 'RC1');
    if (incorrectOrderResults.length > 0) {
        addToElements(elements, 'hxNo', incorrectOrderResults.length);
        addToResults(results, 'hx_02');
        addToNodes(nodes, 'hxNo', incorrectOrderResults.map((r) => r.pointer));
    }
}
function QW_HTML_T17(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'tableComplexError', technique.metadata.failed);
        addToResults(results, 'table_06');
        addToNodes(nodes, 'tableComplexError', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T19(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'warning') {
        addToElements(elements, 'linkRel', technique.metadata.warning);
        addToResults(results, 'link_01');
        addToNodes(nodes, 'linkRel', technique.results.filter((r) => r.verdict === 'warning').map((r) => r.pointer));
    }
}
function QW_HTML_T20(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'w3cValidatorErrors', technique.metadata.failed);
        addToResults(results, 'w3c_validator_01b');
        addToNodes(nodes, 'w3cValidatorErrors', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'passed') {
        addToElements(elements, 'w3cValidatorErrors', technique.metadata.passed);
        addToResults(results, 'w3c_validator_01a');
        addToNodes(nodes, 'w3cValidatorErrors', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_HTML_T23(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'a', 0);
        addToResults(results, 'a_04');
        addToNodes(nodes, 'a', []);
    }
}
function QW_HTML_T25(elements, results, nodes, technique) {
    const incorrectLabelResults = technique.results.filter((r) => (r.resultCode === 'RC1' || r.resultCode === 'RC2' || r.resultCode === 'RC3'));
    if (incorrectLabelResults.length > 0) {
        addToElements(elements, 'w3cValidatorErrors', incorrectLabelResults);
        addToResults(results, 'label_02');
        addToNodes(nodes, 'w3cValidatorErrors', incorrectLabelResults.map((r) => r.pointer));
    }
}
function QW_HTML_T28(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'liNoList', technique.metadata.failed);
        addToResults(results, 'list_01');
        addToNodes(nodes, 'liNoList', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T29(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'warning') {
        addToElements(elements, 'ehandMouse', technique.metadata.warning);
        addToResults(results, 'ehandler_01');
        addToNodes(nodes, 'ehandMouse', technique.results.filter((r) => r.verdict === 'warning').map((r) => r.pointer));
    }
}
function QW_HTML_T30(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'tableLayout', technique.metadata.failed);
        addToResults(results, 'table_05a');
        addToNodes(nodes, 'tableLayout', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T32(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'passed') {
        addToElements(elements, 'formSubmitNo', technique.metadata.passed);
        addToResults(results, 'form_01a');
        addToNodes(nodes, 'formSubmitNo', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'formSubmitNo', technique.metadata.failed);
        addToResults(results, 'form_01b');
        addToNodes(nodes, 'formSubmitNo', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T34(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'aImgAltNo', technique.metadata.failed);
        addToResults(results, 'a_03');
        addToNodes(nodes, 'aImgAltNo', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T35(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'newWinOnLoad', technique.metadata.failed);
        addToResults(results, 'win_01');
        addToNodes(nodes, 'newWinOnLoad', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T37(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'warning') {
        addToElements(elements, 'aSkip', technique.metadata.warning);
        addToResults(results, 'a_02b');
        addToNodes(nodes, 'aSkip', technique.results.filter((r) => r.verdict === 'warning').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'aSkip', 0);
        addToResults(results, 'a_02a');
        addToNodes(nodes, 'aSkip', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T38(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'passed') {
        addToElements(elements, 'aSkipFirst', technique.metadata.passed);
        addToResults(results, 'a_01a');
        addToNodes(nodes, 'aSkipFirst', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'aSkipFirst', 0);
        addToResults(results, 'a_01b');
        addToNodes(nodes, 'aSkipFirst', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T40(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'focusBlur', technique.metadata.failed);
        addToResults(results, 'focus_01');
        addToNodes(nodes, 'focusBlur', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T41(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'scopeNo', technique.metadata.failed);
        addToResults(results, 'scope_01');
        addToNodes(nodes, 'scopeNo', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T42(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'ehandTagNo', technique.metadata.failed);
        addToResults(results, 'ehandler_04');
        addToNodes(nodes, 'ehandTagNo', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_HTML_T43(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'justifiedTxt', technique.metadata.failed);
        addToResults(results, 'justif_txt_01');
        addToNodes(nodes, 'justifiedTxt', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_CSS_T1(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'fontAbsVal', technique.metadata.failed);
        addToResults(results, 'font_02');
        addToNodes(nodes, 'fontAbsVal', undefined);
    }
}
function QW_CSS_T2(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'justifiedCss', technique.metadata.failed);
        addToResults(results, 'justif_txt_02');
        addToNodes(nodes, 'justifiedCss', undefined);
    }
}
function QW_CSS_T3(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'lineHeightNo', technique.metadata.failed);
        addToResults(results, 'css_01');
        addToNodes(nodes, 'lineHeightNo', undefined);
    }
}
function QW_CSS_T5(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'valueAbsCss', technique.metadata.failed);
        addToResults(results, 'values_02a');
        addToNodes(nodes, 'valueAbsCss', undefined);
    }
    if (technique.metadata.passed > 0) {
        addToElements(elements, 'valueRelCss', technique.metadata.passed);
        addToResults(results, 'values_02b');
        addToNodes(nodes, 'valueRelCss', undefined);
    }
}
function QW_CSS_T6(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'cssBlink', technique.metadata.failed);
        addToResults(results, 'blink_02');
        addToNodes(nodes, 'cssBlink', undefined);
    }
}
function QW_CSS_T7(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'colorFgBgNo', technique.metadata.failed);
        addToResults(results, 'color_01');
        addToNodes(nodes, 'colorFgBgNo', undefined);
    }
}
function QW_BP1(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'hx', technique.metadata.failed);
        addToResults(results, 'hx_01a');
        addToNodes(nodes, 'hx', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'warning') {
        addToElements(elements, 'hx', technique.metadata.warning);
        addToResults(results, 'hx_01b');
        addToNodes(nodes, 'hx', undefined);
        addToNodes(nodes, 'hx', technique.results.filter((r) => r.verdict === 'warning').map((r) => r.pointer));
    }
}
function QW_BP2(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'imgAltLong', technique.metadata.failed);
        addToResults(results, 'img_04');
        addToNodes(nodes, 'imgAltLong', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_BP3(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'aTitleMatch', technique.metadata.failed);
        addToResults(results, 'a_05');
        addToNodes(nodes, 'aTitleMatch', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_BP4(elements, results, nodes, technique) {
}
function QW_BP5(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'tableNested', technique.metadata.failed);
        addToResults(results, 'table_04');
        addToNodes(nodes, 'tableNested', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_BP6(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'titleLong', technique.metadata.failed);
        addToResults(results, 'title_04');
        addToNodes(nodes, 'titleLong', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_BP7(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'titleChars', technique.metadata.failed);
        addToResults(results, 'title_05');
        addToNodes(nodes, 'titleChars', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_BP8(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'passed') {
        addToElements(elements, 'hxNo', technique.metadata.passed);
        addToResults(results, 'hx_02');
        addToNodes(nodes, 'hxNo', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_BP9(elements, results, nodes, technique) {
    if (technique.metadata.passed > 0) {
        addToElements(elements, 'tableLayoutCaption', technique.metadata.passed);
        addToResults(results, 'table_01');
        addToNodes(nodes, 'tableLayoutCaption', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_BP10(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'layoutElem', technique.metadata.failed);
        addToResults(results, 'layout_01b');
        addToNodes(nodes, 'layoutElem', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
    else if (technique.metadata.outcome === 'passed') {
        addToElements(elements, 'layoutElem', technique.metadata.passed);
        addToResults(results, 'layout_01a');
        addToNodes(nodes, 'layoutElem', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
}
function QW_BP11(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'brSec', technique.metadata.failed);
        addToResults(results, 'br_01');
        addToNodes(nodes, 'brSec', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_BP13(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'aAdjacentSame', technique.metadata.failed);
        addToResults(results, 'a_06');
        addToNodes(nodes, 'aAdjacentSame', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_BP14(elements, results, nodes, technique) {
    if (technique.metadata.outcome === 'failed') {
        addToElements(elements, 'layoutFixed', technique.metadata.failed);
        addToResults(results, 'layout_03');
        addToNodes(nodes, 'layoutFixed', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function QW_BP15(elements, results, nodes, technique) {
    const passedResults = technique.results.filter((r) => r.verdict === 'passed');
    const failedResults = technique.results.filter((r) => r.verdict === 'failed');
    if (passedResults.length > 0) {
        addToElements(elements, 'valueRelHtml', passedResults.length);
        addToResults(results, 'values_01b');
        addToNodes(nodes, 'valueRelHtml', technique.results.filter((r) => r.verdict === 'passed').map((r) => r.pointer));
    }
    if (failedResults.length > 0) {
        addToElements(elements, 'valueAbsHtml', failedResults.length);
        addToResults(results, 'values_01a');
        addToNodes(nodes, 'valueAbsHtml', technique.results.filter((r) => r.verdict === 'failed').map((r) => r.pointer));
    }
}
function addToElements(elements, key, value) {
    if (elements[key] === undefined) {
        elements[key] = value;
    }
    else {
        elements[key] += value;
    }
}
function addToResults(results, key) {
    results[key] = 'something';
}
function addToNodes(nodes, key, selectors) {
    const { xpath } = require('./xpath');
    for (const selector of selectors || []) {
        if (selector !== undefined && !nodes[key]) {
            nodes[key] = convert_css_selector_to_xpath(selector);
        }
        else if (selector !== undefined) {
            nodes[key] += '|' + convert_css_selector_to_xpath(selector);
        }
        else if (xpath[key]) {
            nodes[key] = xpath[key];
        }
    }
}
function convert_css_selector_to_xpath(selector) {
    let xpath = selector.replace(new RegExp(' > ', 'g'), '/');
    xpath = xpath.replace(/\:/g, '[');
    xpath = xpath.replace(/nth-of-type/g, '');
    xpath = xpath.replace(/\(/g, '');
    xpath = xpath.replace(/\)/g, ']');
    return '/' + xpath;
}
function getElementsMapping(evaluation) {
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
exports.getElementsMapping = getElementsMapping;
//# sourceMappingURL=mapping.js.map