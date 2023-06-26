export default {
  img_01a: {
    type: "fals",
    elem: "img",
    test: "imgAlt",
    score: 10,
    level: "a",
    trust: "0.9",
    ref: "H37",
    scs: "1.1.1",
    dis: "53322",
    result: "passed",
  },
  img_01b: {
    type: "prop",
    elem: "img",
    test: "imgAltNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "F65",
    scs: "1.1.1",
    dis: "53322",
    result: "failed",
  },
  img_02: {
    type: "prop",
    elem: "img",
    test: "imgAltNull",
    score: 8,
    level: "a",
    trust: "1",
    ref: "C9",
    scs: "1.1.1",
    dis: "41111",
    result: "warning",
  },
  img_03: {
    type: "decr",
    elem: "img",
    test: "imgAltNot",
    score: 3,
    level: "A",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "F30",
    scs: "1.1.1,1.2.1",
    dis: "53211",
    result: "failed",
  },
  img_04: {
    type: "prop",
    elem: "img",
    test: "imgAltLong",
    score: 5,
    level: "a",
    trust: "0.9",
    ref: "H45",
    scs: "1.1.1",
    dis: "54153",
    result: "warning",
  },
  area_01a: {
    type: "fals",
    elem: "area",
    test: "areaAltYes",
    score: 10,
    level: "a",
    trust: "0.9",
    ref: "H24",
    scs: "1.1.1,2.4.4,2.4.9",
    dis: "54222",
    result: "passed",
  },
  area_01b: {
    type: "prop",
    elem: "area",
    test: "areaAltNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "F65",
    scs: "1.1.1",
    dis: "53322",
    result: "failed",
  },
  inp_img_01a: {
    type: "fals",
    elem: "inpImg",
    test: "inpImgAltYes",
    score: 10,
    level: "a",
    trust: "0.9",
    ref: "H36",
    scs: "1.1.1",
    dis: "54211",
    result: "passed",
  },
  inp_img_01b: {
    type: "prop",
    elem: "inpImg",
    test: "inpImgAltNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "F65",
    scs: "1.1.1",
    dis: "53322",
    result: "failed",
  },
  a_04: {
    type: "fals",
    elem: "all",
    test: "a",
    score: 3,
    level: "AA",
    trust: "1",
    ref: "G125",
    scs: "2.4.5",
    dis: "54353",
    result: "failed",
  },
  a_03: {
    type: "decr",
    elem: "a",
    test: "aImgAltNo",
    score: 3,
    level: "A",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "F89",
    scs: "2.4.4,2.4.9,4.1.2",
    dis: "53322",
    result: "failed",
  },
  a_05: {
    type: "prop",
    elem: "a",
    test: "aTitleMatch",
    score: 5,
    level: "a",
    trust: "1",
    ref: "H33",
    scs: "2.4.4,2.4.9",
    dis: "52132",
    result: "failed",
  },
  a_09: {
    type: "decr",
    elem: "a",
    test: "aSameText",
    score: 3,
    level: "AAA",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "F84",
    scs: "2.4.9",
    dis: "52122",
    result: "warning",
  },
  a_06: {
    type: "decr",
    elem: "a",
    test: "aAdjacentSame",
    score: 5,
    level: "A",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "H2",
    scs: "1.1.1,2.4.4,2.4.9",
    dis: "54353",
    result: "failed",
  },
  a_01a: {
    type: "true",
    elem: "a",
    test: "aSkipFirst",
    score: 10,
    level: "a",
    trust: "0.7",
    ref: "G1",
    scs: "2.4.1",
    dis: "43522",
    result: "warning",
  },
  a_01b: {
    type: "fals",
    elem: "a",
    test: "aSkipFirstNo",
    score: 3,
    level: "a",
    trust: "0.9",
    ref: "G1",
    scs: "2.4.1",
    dis: "43522",
    result: "failed",
  },
  a_02a: {
    type: "fals",
    elem: "a",
    test: "aSkipNo",
    score: 3,
    level: "a",
    trust: "0.9",
    ref: "G123",
    scs: "2.4.1",
    dis: "43522",
    result: "failed",
  },
  a_02b: {
    type: "true",
    elem: "a",
    test: "aSkip",
    score: 10,
    level: "a",
    trust: "0.7",
    ref: "G123",
    scs: "2.4.1",
    dis: "43522",
    result: "warning",
  },
  hx_01a: {
    type: "fals",
    elem: "all",
    test: "hxNone",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H42",
    scs: "1.3.1",
    dis: "54322",
    result: "failed",
  },
  hx_01b: {
    type: "true",
    elem: "all",
    test: "hx",
    score: 10,
    level: "aaa",
    trust: "0.9",
    ref: "G141",
    scs: "1.3.1,2.4.10",
    dis: "54343",
    result: "warning",
  },
  hx_01c: {
    type: "fals",
    elem: "hx",
    test: "h1",
    score: 4,
    level: "aaa",
    trust: "1",
    ref: "G141",
    scs: "1.3.1,2.4.10",
    dis: "54343",
    result: "failed",
  },
  hx_03: {
    type: "prop",
    elem: "hx",
    test: "hxSkip",
    score: 3,
    level: "AAA",
    trust: "1",
    ref: "G141",
    scs: "1.3.1,2.4.10",
    dis: "54343",
    result: "failed",
  },
  hx_02: {
    type: "true",
    elem: "hx",
    test: "hxNo",
    score: 3,
    level: "AA",
    trust: "1",
    ref: "G130",
    scs: "2.4.6",
    dis: "54253",
    result: "failed",
  },
  list_01: {
    type: "decr",
    elem: "all",
    test: "liNoList",
    score: 3,
    level: "A",
    trust: "1",
    top: 3,
    steps: 3,
    ref: "H48",
    scs: "1.3.1",
    dis: "53342",
    result: "failed",
  },
  br_01: {
    type: "decr",
    elem: "all",
    test: "brSec",
    score: 3,
    level: "a",
    trust: "0.7",
    top: 1,
    steps: 1,
    ref: "H48",
    scs: "1.3.1",
    dis: "53342",
    result: "failed",
  },
  field_02: {
    type: "decr",
    elem: "all",
    test: "fieldNoForm",
    score: 3,
    level: "A",
    trust: "0.9",
    top: 1,
    steps: 1,
    ref: "H71",
    scs: "1.3.1,3.3.2",
    dis: "54152",
    result: "failed",
  },
  field_01: {
    type: "true",
    elem: "all",
    test: "fieldLegNo",
    score: 4,
    level: "A",
    trust: "1",
    ref: "H71",
    scs: "1.3.1,3.3.2",
    dis: "54152",
    result: "failed",
  },
  label_02: {
    type: "decr",
    elem: "all",
    test: "labelPosNo",
    score: 3,
    level: "A",
    trust: "0.9",
    top: 1,
    steps: 1,
    ref: "G162",
    scs: "1.3.1,3.3.2",
    dis: "43353",
    result: "failed",
  },
  input_02b: {
    type: "fals",
    elem: "all",
    test: "inputLabel",
    score: 10,
    level: "a",
    trust: "0.7",
    ref: "H44",
    scs: "1.1.1,1.3.1,3.3.2,4.1.2",
    dis: "54532",
    result: "passed",
  },
  input_02: {
    type: "prop",
    elem: "label",
    test: "inputLabelNo",
    score: 3,
    level: "a",
    trust: "0.8",
    ref: "H44",
    scs: "1.1.1,1.3.1,3.3.2,4.1.2",
    dis: "54532",
    result: "warning",
  },
  input_01: {
    type: "prop",
    elem: "inputLabel",
    test: "inputIdTitleNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H65",
    scs: "1.1.1,1.3.1,3.3.2,4.1.2",
    dis: "53122",
    result: "failed",
  },
  focus_01: {
    type: "true",
    elem: "all",
    test: "focusBlur",
    score: 3,
    level: "a",
    trust: "0.8",
    ref: "F55",
    scs: "2.1.1,2.4.7,3.2.1",
    dis: "54142",
    result: "failed",
  },
  input_03: {
    type: "true",
    elem: "all",
    test: "inputAltNo",
    score: 5,
    level: "a",
    trust: "1",
    ref: "H36",
    scs: "1.1.1",
    dis: "54211",
    result: "failed",
  },
  form_01a: {
    type: "fals",
    elem: "form",
    test: "formSubmit",
    score: 10,
    level: "a",
    trust: "1",
    ref: "H32",
    scs: "3.2.2",
    dis: "21211",
    result: "passed",
  },
  form_01b: {
    type: "prop",
    elem: "form",
    test: "formSubmitNo",
    score: 3,
    level: "A",
    trust: "0.9",
    ref: "H32",
    scs: "3.2.2",
    dis: "21211",
    result: "failed",
  },
  table_02: {
    type: "prop",
    elem: "tableData",
    test: "tableDataCaption",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H39",
    scs: "1.3.1",
    dis: "52211",
    result: "failed",
  },
  table_03: {
    type: "prop",
    elem: "table",
    test: "tableCaptionSummary",
    score: 4,
    level: "A",
    trust: "1",
    ref: "H73",
    scs: "1.3.1",
    dis: "33152",
    result: "failed",
  },
  table_01: {
    type: "prop",
    elem: "tableLayout",
    test: "tableLayoutCaption",
    score: 3,
    level: "A",
    trust: "1",
    ref: "F46",
    scs: "1.3.1",
    dis: "51421",
    result: "warning",
  },
  table_06: {
    type: "decr",
    elem: "tableComplex",
    test: "tableComplexError",
    score: 4,
    level: "a",
    trust: "0.8",
    top: 1,
    steps: 1,
    ref: "H43",
    scs: "1.3.1",
    dis: "53211",
    result: "failed",
  },
  scope_01: {
    type: "decr",
    elem: "table",
    test: "scopeNo",
    score: 3,
    level: "A",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "H63",
    scs: "1.3.1",
    dis: "53353",
    result: "failed",
  },
  table_05a: {
    type: "decr",
    elem: "all",
    test: "tableLayout",
    score: 4,
    level: "a",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "H51",
    scs: "1.3.1",
    dis: "53352",
    result: "failed",
  },
  table_04: {
    type: "prop",
    elem: "table",
    test: "tableNested",
    score: 3,
    level: "a",
    trust: "0.9",
    ref: "F49",
    scs: "1.3.2",
    dis: "53311",
    result: "failed",
  },
  iframe_01: {
    type: "prop",
    elem: "iframe",
    test: "iframeTitleNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H64",
    scs: "2.4.1,4.1.2",
    dis: "53222",
    result: "failed",
  },
  frame_01: {
    type: "prop",
    elem: "frame",
    test: "frameTitleNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H64",
    scs: "2.4.1,4.1.2",
    dis: "53222",
    result: "failed",
  },
  win_01: {
    type: "true",
    elem: "all",
    test: "newWinOnLoad",
    score: 3,
    level: "A",
    trust: "0.9",
    ref: "F52",
    scs: "3.2.1",
    dis: "53454",
    result: "warning",
  },
  abbr_01: {
    type: "true",
    elem: "all",
    test: "abbrNo",
    score: 3,
    level: "AAA",
    trust: "1",
    ref: "G102",
    scs: "3.1.4",
    dis: "42153",
    result: "failed",
  },
  css_01: {
    type: "decr",
    elem: "all",
    test: "lineHeightNo",
    score: 3,
    level: "aaa",
    trust: "0.8",
    top: 1,
    steps: 1,
    ref: "C21",
    scs: "1.4.8",
    dis: "15153",
    result: "warning",
  },
  justif_txt_01: {
    type: "decr",
    elem: "all",
    test: "justifiedTxt",
    score: 3,
    level: "AAA",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "F88",
    scs: "1.4.8",
    dis: "15152",
    result: "failed",
  },
  justif_txt_02: {
    type: "decr",
    elem: "all",
    test: "justifiedCss",
    score: 3,
    level: "AAA",
    trust: "0.9",
    top: 1,
    steps: 1,
    ref: "C19",
    scs: "1.4.8",
    dis: "14142",
    result: "warning",
  },
  font_02: {
    type: "prop",
    elem: "fontValues",
    test: "fontAbsVal",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "C12",
    scs: "1.4.4",
    dis: "15123",
    result: "failed",
  },
  layout_03: {
    type: "decr",
    elem: "all",
    test: "layoutFixed",
    score: 5,
    level: "aa",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "G146",
    scs: "1.4.4,1.4.8",
    dis: "15222",
    result: "failed",
  },
  values_02a: {
    type: "decr",
    elem: "all",
    test: "valueAbsCss",
    score: 3,
    level: "AAA",
    trust: "0.9",
    top: 1,
    steps: 1,
    ref: "C24",
    scs: "1.4.8",
    dis: "15113",
    result: "warning",
  },
  values_02b: {
    type: "true",
    elem: "all",
    test: "valueRelCss",
    score: 10,
    level: "aaa",
    trust: "1",
    ref: "C24",
    scs: "1.4.8",
    dis: "15113",
    result: "passed",
  },
  values_01a: {
    type: "decr",
    elem: "all",
    test: "valueAbsHtml",
    score: 4,
    level: "AA",
    trust: "0.9",
    top: 1,
    steps: 1,
    ref: "G146",
    scs: "1.4.4",
    dis: "15222",
    result: "warning",
  },
  values_01b: {
    type: "true",
    elem: "all",
    test: "valueRelHtml",
    score: 10,
    level: "aa",
    trust: "0.9",
    ref: "G146",
    scs: "1.4.4",
    dis: "15222",
    result: "passed",
  },
  color_02: {
    type: "decr",
    elem: "all",
    test: "colorContrast",
    score: 4,
    level: "AA",
    trust: "0.8",
    top: 1,
    steps: 1,
    ref: "G145",
    scs: "1.4.3",
    dis: "15113",
    result: "failed",
  },
  color_01: {
    type: "true",
    elem: "all",
    test: "colorFgBgNo",
    score: 5,
    level: "aa",
    trust: "0.9",
    ref: "F24",
    scs: "1.4.3,1.4.6,1.4.8",
    dis: "13113",
    result: "warning",
  },
  blink_02: {
    type: "true",
    elem: "all",
    test: "cssBlink",
    score: 3,
    level: "A",
    trust: "0.9",
    ref: "F4",
    scs: "2.2.2",
    dis: "15152",
    result: "failed",
  },
  /*'ehandler_01': {
    'type': 'true',
    'elem': 'ehandler',
    'test': 'ehandMouse',
    'score': 1,
    'level': 'A',
    'trust': '1',
    'ref': 'F54',
    'scs': '2.1.1',
    'dis': '53512',
    'result': 'warning'
  },*/
  ehandler_03: {
    type: "true",
    elem: "ehandler",
    test: "ehandBoth",
    score: 10,
    level: "a",
    trust: "0.9",
    ref: "G90",
    scs: "2.1.1,2.1.3",
    dis: "52522",
    result: "passed",
  },
  ehandler_02: {
    type: "prop",
    elem: "ehandler",
    test: "ehandBothNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "SCR20",
    scs: "2.1.1,2.1.3",
    dis: "53511",
    result: "failed",
  },
  ehandler_04: {
    type: "prop",
    elem: "ehandler",
    test: "ehandTagNo",
    score: 3,
    level: "A",
    trust: "0.8",
    ref: "F59",
    scs: "4.1.2",
    dis: "43411",
    result: "failed",
  },
  w3c_validator_01a: {
    type: "fals",
    elem: "w3cValidator",
    test: "w3cValidatorErrorsNo",
    score: 10,
    level: "a",
    trust: "1",
    ref: "G134",
    scs: "4.1.1",
    dis: "22232",
    result: "passed",
  },
  w3c_validator_01b: {
    type: "decr",
    elem: "w3cValidator",
    test: "w3cValidatorErrors",
    score: 10,
    level: "A",
    trust: "1",
    top: 10,
    steps: 10,
    ref: "G134",
    scs: "4.1.1",
    dis: "22232",
    result: "failed",
  },
  font_01: {
    type: "decr",
    elem: "all",
    test: "fontHtml",
    score: 4,
    level: "AA",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "C22",
    scs: "1.3.1,1.4.4,1.4.5,1.4.9",
    dis: "33111",
    result: "failed",
  },
  layout_01a: {
    type: "fals",
    elem: "all",
    test: "layoutElemNo",
    score: 10,
    level: "a",
    trust: "1",
    ref: "G115",
    scs: "1.3.1",
    dis: "34212",
    result: "passed",
  },
  layout_01b: {
    type: "decr",
    elem: "all",
    test: "layoutElem",
    score: 5,
    level: "A",
    trust: "1",
    top: 2,
    steps: 2,
    ref: "G115",
    scs: "1.3.1",
    dis: "34212",
    result: "failed",
  },
  lang_01: {
    type: "true",
    elem: "all",
    test: "lang",
    score: 10,
    level: "a",
    trust: "0.9",
    ref: "H57",
    scs: "3.1.1",
    dis: "53112",
    result: "warning",
  },
  lang_03: {
    type: "true",
    elem: "all",
    test: "langNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H57",
    scs: "3.1.1",
    dis: "53112",
    result: "failed",
  },
  lang_02: {
    type: "true",
    elem: "all",
    test: "langCodeNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H57",
    scs: "3.1.1",
    dis: "53112",
    result: "failed",
  },
  lang_04: {
    type: "true",
    elem: "all",
    test: "langMatchNo",
    score: 4,
    level: "A",
    trust: "1",
    ref: "H57",
    scs: "3.1.1",
    dis: "53112",
    result: "failed",
  },
  title_02: {
    type: "true",
    elem: "all",
    test: "titleNo",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H25",
    scs: "2.4.2",
    dis: "52112",
    result: "failed",
  },
  title_03: {
    type: "true",
    elem: "all",
    test: "titleNull",
    score: 3,
    level: "A",
    trust: "1",
    ref: "F25",
    scs: "2.4.2",
    dis: "33151",
    result: "failed",
  },
  title_06: {
    type: "true",
    elem: "all",
    test: "titleOk",
    score: 10,
    level: "a",
    trust: "0.9",
    ref: "H25",
    scs: "2.4.2",
    dis: "52112",
    result: "passed",
  },
  title_04: {
    type: "decr",
    elem: "all",
    test: "titleLong",
    score: 10,
    level: "a",
    trust: "0.9",
    top: 64,
    steps: 10,
    ref: "G88",
    scs: "2.4.2",
    dis: "42253",
    result: "warning",
  },
  title_05: {
    type: "true",
    elem: "all",
    test: "titleChars",
    score: 4,
    level: "a",
    trust: "0.9",
    ref: "G88",
    scs: "2.4.2",
    dis: "42253",
    result: "failed",
  },
  title_01: {
    type: "true",
    elem: "all",
    test: "titleVrs",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H25",
    scs: "2.4.2",
    dis: "52112",
    result: "failed",
  },
  link_01: {
    type: "true",
    elem: "all",
    test: "linkRel",
    score: 10,
    level: "aa",
    trust: "0.9",
    ref: "H59",
    scs: "2.4.5,2.4.8",
    dis: "55554",
    result: "passed",
  },
  meta_01: {
    type: "true",
    elem: "all",
    test: "metaRefresh",
    score: 3,
    level: "A",
    trust: "1",
    ref: "F41",
    scs: "2.2.1,2.2.4,3.2.5",
    dis: "43353",
    result: "warning",
  },
  meta_02: {
    type: "true",
    elem: "all",
    test: "metaRedir",
    score: 3,
    level: "A",
    trust: "1",
    ref: "F40",
    scs: "2.2.1,2.2.4",
    dis: "43353",
    result: "warning",
  },
  heading_01: {
    type: "true",
    elem: "hx",
    test: "hxHasAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "H42",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  heading_02: {
    type: "prop",
    elem: "hx",
    test: "hxWithoutAName",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H42",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  aria_01: {
    type: "true",
    elem: "all",
    test: "ariaCntxRole",
    score: 10,
    level: "A",
    trust: "1",
    ref: "ff89c9",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  aria_02: {
    type: "true",
    elem: "all",
    test: "ariaReqElem",
    score: 10,
    level: "A",
    trust: "1",
    ref: "bc4a75",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  aria_03: {
    type: "true",
    elem: "all",
    test: "ariaStValid",
    score: 10,
    level: "A",
    trust: "1",
    ref: "6a7281",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  aria_04: {
    type: "fals",
    elem: "all",
    test: "ariaStNotValid",
    score: 3,
    level: "A",
    trust: "1",
    ref: "6a7281",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  aria_05: {
    type: "true",
    elem: "all",
    test: "ariaStPermitted",
    score: 10,
    level: "A",
    trust: "1",
    ref: "5c01ea",
    scs: "",
    dis: "43353",
    result: "passed",
  },
  aria_06: {
    type: "fals",
    elem: "all",
    test: "ariaStNotPermitted",
    score: 10,
    level: "A",
    trust: "1",
    ref: "5c01ea",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  aria_07: {
    type: "true",
    elem: "all",
    test: "ariaAtribDefined",
    score: 10,
    level: "A",
    trust: "1",
    ref: "5f99a7",
    scs: "",
    dis: "43353",
    result: "passed",
  },
  aria_08: {
    type: "fals",
    elem: "all",
    test: "ariaAtribNotDefined",
    score: 3,
    level: "A",
    trust: "1",
    ref: "5f99a7",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  audio_video_01: {
    type: "true",
    elem: "all",
    test: "audioAvoidsAutoPlay",
    score: 10,
    level: "A",
    trust: "1",
    ref: "80f0bf",
    scs: "",
    dis: "43353",
    result: "passed",
  },
  audio_video_02: {
    type: "fals",
    elem: "all",
    test: "audioAutoPlay",
    score: 3,
    level: "A",
    trust: "1",
    ref: "80f0bf",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  autocomplete_01: {
    type: "true",
    elem: "all",
    test: "autoCmpltValid",
    score: 10,
    level: "A",
    trust: "1",
    ref: "73f2c2",
    scs: "",
    dis: "43353",
    result: "passed",
  },
  autocomplete_02: {
    type: "fals",
    elem: "all",
    test: "autoCmpltNotValid",
    score: 3,
    level: "A",
    trust: "1",
    ref: "73f2c2",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  button_01: {
    type: "true",
    elem: "button",
    test: "buttonAname",
    score: 10,
    level: "A",
    trust: "1",
    ref: "97a4e1",
    scs: "",
    dis: "43353",
    result: "passed",
  },
  button_02: {
    type: "prop",
    elem: "button",
    test: "buttonNotAname",
    score: 3,
    level: "A",
    trust: "1",
    ref: "97a4e1",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  element_01: {
    type: "true",
    elem: "all",
    test: "seqFocus",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "oj04fd",
    scs: "2.4.7",
    dis: "43353",
    result: "warning",
  },
  element_02: {
    type: "true",
    elem: "all",
    test: "elementDec",
    score: 10,
    level: "A",
    trust: "1",
    ref: "6cfa84",
    scs: "",
    dis: "43353",
    result: "passed",
  },
  element_03: {
    type: "fals",
    elem: "all",
    test: "elementNotDec",
    score: 4,
    level: "A",
    trust: "1",
    ref: "6cfa84",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  element_04: {
    type: "true",
    elem: "all",
    test: "elementHiddenFocus",
    score: 10,
    level: "A",
    trust: "1",
    ref: "46ca7f",
    scs: "4.1.2",
    dis: "43353",
    result: "passed",
  },
  element_05: {
    type: "fals",
    elem: "all",
    test: "elementNotHiddenFocus",
    score: 4,
    level: "A",
    trust: "1",
    ref: "46ca7f",
    scs: "4.1.2",
    dis: "43353",
    result: "fail",
  },
  element_06: {
    type: "true",
    elem: "all",
    test: "elementLang",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "H58",
    scs: "3.1.2",
    dis: "43353",
    result: "passed",
  },
  element_07: {
    type: "fals",
    elem: "all",
    test: "elementNotLang",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "H58",
    scs: "3.1.2",
    dis: "43353",
    result: "fail",
  },
  element_08: {
    type: "true",
    elem: "all",
    test: "elementPresentChildrenNoFocus",
    score: 10,
    level: "A",
    trust: "1",
    ref: "307n5z",
    scs: "4.1.2",
    dis: "43353",
    result: "passed",
  },
  element_09: {
    type: "fals",
    elem: "all",
    test: "elementPresentChildrenFocus",
    score: 4,
    level: "A",
    trust: "1",
    ref: "307n5z",
    scs: "4.1.2",
    dis: "43353",
    result: "fail",
  },
  element_10: {
    type: "true",
    elem: "all",
    test: "elementRole",
    score: 10,
    level: "A",
    trust: "1",
    ref: "4e8ab6",
    scs: "4.1.2",
    dis: "43353",
    result: "passed",
  },
  headers_01: {
    type: "true",
    elem: "headers",
    test: "headerAtt",
    score: 10,
    level: "A",
    trust: "1",
    ref: "H43",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  headers_02: {
    type: "prop",
    elem: "headers",
    test: "headerAttNot",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H43",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  id_01: {
    type: "true",
    elem: "id",
    test: "idAtt",
    score: 10,
    level: "A",
    trust: "1",
    ref: "H93",
    scs: "4.1.1",
    dis: "43353",
    result: "passed",
  },
  id_02: {
    type: "prop",
    elem: "id",
    test: "idAttNot",
    score: 3,
    level: "A",
    trust: "1",
    ref: "H93",
    scs: "4.1.1",
    dis: "43353",
    result: "fail",
  },
  iframe_02: {
    type: "true",
    elem: "iframeSame",
    test: "iframeSameAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "4b1c6c",
    scs: "4.1.2",
    dis: "43353",
    result: "passed",
  },
  iframe_03: {
    type: "prop",
    elem: "iframeSame",
    test: "iframeSameANameDiferent",
    score: 3,
    level: "A",
    trust: "1",
    ref: "4b1c6c",
    scs: "4.1.2",
    dis: "43353",
    result: "warning",
  },
  iframe_04: {
    type: "true",
    elem: "all",
    test: "iframeNegTabIndex",
    score: 10,
    level: "A",
    trust: "1",
    ref: "G202",
    scs: "2.1.1",
    dis: "43353",
    result: "passed",
  },
  iframe_05: {
    type: "fals",
    elem: "all",
    test: "iframeNegTabIndexNot",
    score: 4,
    level: "A",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "G202",
    scs: "2.1.1",
    dis: "43353",
    result: "fail",
  },
  letter_01: {
    type: "true",
    elem: "all",
    test: "letterSpacing",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "24afc2",
    scs: "1.4.12",
    dis: "43353",
    result: "passed",
  },
  letter_02: {
    type: "decr",
    elem: "all",
    test: "letterSpacingNot",
    score: 4,
    level: "AA",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "24afc2",
    scs: "1.4.12",
    dis: "43353",
    result: "fail",
  },
  a_10: {
    type: "true",
    elem: "all",
    test: "linkAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "G91",
    scs: "4.1.2",
    dis: "43353",
    result: "passed",
  },
  a_11: {
    type: "prop",
    elem: "a",
    test: "linkNotAName",
    score: 3,
    level: "A",
    trust: "1",
    ref: "G91",
    scs: "4.1.2",
    dis: "43353",
    result: "fail",
  },
  a_12: {
    type: "true",
    elem: "all",
    test: "linkIdentAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "fd3a94",
    scs: "2.4.4",
    dis: "43353",
    result: "passed",
  },
  a_13: {
    type: "prop",
    elem: "a",
    test: "linkIdentANameNot",
    score: 3,
    level: "A",
    trust: "1",
    ref: "fd3a94",
    scs: "2.4.4",
    dis: "43353",
    result: "warning",
  },
  menuItem_01: {
    type: "true",
    elem: "menuItem",
    test: "menuItemAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "m6b1q3",
    scs: "4.1.2",
    dis: "43353",
    result: "passed",
  },
  menuItem_02: {
    type: "prop",
    elem: "menuItem",
    test: "menuItemANameNot",
    score: 3,
    level: "A",
    trust: "1",
    ref: "m6b1q3",
    scs: "4.1.2",
    dis: "43353",
    result: "fail",
  },
  meta_03: {
    type: "true",
    elem: "all",
    test: "metaRefresh",
    score: 10,
    level: "AAA",
    trust: "1",
    ref: "G110",
    scs: "2.2.4",
    dis: "43353",
    result: "passed",
  },
  meta_04: {
    type: "fals",
    elem: "all",
    test: "metaRefreshNot",
    score: 3,
    level: "AAA",
    trust: "1",
    ref: "G110",
    scs: "2.2.4",
    dis: "43353",
    result: "fail",
  },
  meta_05: {
    type: "true",
    elem: "all",
    test: "metaViewport",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "b4f0c3",
    scs: "1.4.4",
    dis: "43353",
    result: "passed",
  },
  object_01: {
    type: "true",
    elem: "object",
    test: "objectAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "b4f0c3",
    scs: "1.1.1",
    dis: "43353",
    result: "passed",
  },
  object_02: {
    type: "prop",
    elem: "object",
    test: "objectANameNot",
    score: 3,
    level: "A",
    trust: "1",
    ref: "b4f0c3",
    scs: "1.1.1",
    dis: "43353",
    result: "fail",
  },
  orientation_01: {
    type: "true",
    elem: "all",
    test: "orientationCSS",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "b33eff",
    scs: "1.3.4",
    dis: "43353",
    result: "passed",
  },
  orientation_02: {
    type: "fals",
    elem: "all",
    test: "orientationCSSNot",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "b33eff",
    scs: "1.3.4",
    dis: "43353",
    result: "fail",
  },
  role_01: {
    type: "true",
    elem: "all",
    test: "roleValid",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "674b10",
    scs: "1.3.4",
    dis: "43353",
    result: "passed",
  },
  role_02: {
    type: "decr",
    elem: "all",
    test: "roleValidNot",
    score: 3,
    level: "AA",
    trust: "1",
    top: 1,
    steps: 1,
    ref: "674b10",
    scs: "1.3.4",
    dis: "43353",
    result: "fail",
  },
  scrollable_01: {
    type: "true",
    elem: "scrollable",
    test: "scrollableAccess",
    score: 10,
    level: "A",
    trust: "1",
    ref: "G202",
    scs: "2.1.1",
    dis: "43353",
    result: "passed",
  },
  scrollable_02: {
    type: "prop",
    elem: "scrollable",
    test: "scrollableAccessNot",
    score: 3,
    level: "A",
    trust: "1",
    ref: "G202",
    scs: "2.1.1",
    dis: "43353",
    result: "fail",
  },
  svg_01: {
    type: "true",
    elem: "svg",
    test: "svgAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "G202",
    scs: "1.1.1",
    dis: "43353",
    result: "passed",
  },
  svg_02: {
    type: "prop",
    elem: "svg",
    test: "svgNotAName",
    score: 3,
    level: "A",
    trust: "1",
    ref: "G202",
    scs: "1.1.1",
    dis: "43353",
    result: "fail",
  },
  table_07: {
    type: "true",
    elem: "all",
    test: "tableHdr",
    score: 10,
    level: "A",
    trust: "1",
    ref: "d0f69e",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  table_08: {
    type: "prop",
    elem: "tableData",
    test: "tableHdrNot",
    score: 3,
    level: "A",
    trust: "1",
    ref: "d0f69e",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  textC_01: {
    type: "true",
    elem: "all",
    test: "textContrastH",
    score: 10,
    level: "AAA",
    trust: "1",
    ref: "G17",
    scs: "1.4.6",
    dis: "43353",
    result: "passed",
  },
  textC_02: {
    type: "fals",
    elem: "all",
    test: "textContrastHNot",
    score: 10,
    level: "AAA",
    trust: "1",
    ref: "G17",
    scs: "1.4.6",
    dis: "43353",
    result: "warning",
  },
  video_01: {
    type: "true",
    elem: "all",
    test: "videoAudit",
    score: 10,
    level: "A",
    trust: "1",
    ref: "G87",
    scs: "1.2.2",
    dis: "43353",
    result: "warning",
  },
  video_02: {
    type: "true",
    elem: "all",
    test: "videoVisual",
    score: 10,
    level: "A",
    trust: "1",
    ref: "G8",
    scs: "1.2.3",
    dis: "43353",
    result: "warning",
  },
  label_01: {
    type: "true",
    elem: "all",
    test: "labelAName",
    score: 10,
    level: "A",
    trust: "1",
    ref: "G208",
    scs: "2.5.3",
    dis: "43353",
    result: "passed",
  },
  label_03: {
    type: "fals",
    elem: "all",
    test: "labelANameNot",
    score: 4,
    level: "A",
    trust: "1",
    ref: "G208",
    scs: "2.5.3",
    dis: "43353",
    result: "fail",
  },
  word_01: {
    type: "true",
    elem: "all",
    test: "wordSpacing",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "9e45ec",
    scs: "1.4.12",
    dis: "43353",
    result: "passed",
  },
  word_02: {
    type: "fals",
    elem: "all",
    test: "wordSpacingNot",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "9e45ec",
    scs: "1.4.12",
    dis: "43353",
    result: "fail",
  },
  css_02: {
    type: "true",
    elem: "all",
    test: "overflow",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "59br37",
    scs: "1.4.4",
    dis: "43353",
    result: "warning",
  },
  landmark_01: {
    type: "true",
    elem: "all",
    test: "bannerTopLevel",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1,2.4.1",
    dis: "43353",
    result: "passed",
  },
  landmark_02: {
    type: "fals",
    elem: "all",
    test: "bannerNotTopLevel",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1,2.4.1",
    dis: "43353",
    result: "fail",
  },
  landmark_03: {
    type: "true",
    elem: "all",
    test: "complementaryTopLevel",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  landmark_04: {
    type: "fals",
    elem: "all",
    test: "complementaryNotTopLevel",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  landmark_05: {
    type: "true",
    elem: "all",
    test: "contentinfoTopLevel",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  landmark_06: {
    type: "fals",
    elem: "all",
    test: "contentinfoNotTopLevel",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  landmark_07: {
    type: "true",
    elem: "all",
    test: "mainTopLevel",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  landmark_08: {
    type: "fals",
    elem: "all",
    test: "mainNotTopLevel",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  landmark_09: {
    type: "true",
    elem: "all",
    test: "noDuplicateBanner",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1,2.4.1",
    dis: "43353",
    result: "passed",
  },
  landmark_10: {
    type: "fals",
    elem: "all",
    test: "duplicateBanner",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1,2.4.1",
    dis: "43353",
    result: "fail",
  },
  landmark_11: {
    type: "true",
    elem: "all",
    test: "noDuplicateContentinfo",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  landmark_12: {
    type: "fals",
    elem: "all",
    test: "duplicateContentinfo",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  landmark_13: {
    type: "true",
    elem: "all",
    test: "noDuplicateMain",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  landmark_14: {
    type: "fals",
    elem: "all",
    test: "duplicateMain",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "ARIA11",
    scs: "",
    dis: "43353",
    result: "fail",
  },
  listitem_01: {
    type: "true",
    elem: "li",
    test: "liSemantically",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "H48",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  listitem_02: {
    type: "prop",
    elem: "li",
    test: "liNotSemantically",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "H48",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  list_02: {
    type: "true",
    elem: "li",
    test: "listCorrectly",
    score: 10,
    level: "AA",
    trust: "1",
    ref: "H48",
    scs: "1.3.1",
    dis: "43353",
    result: "passed",
  },
  list_03: {
    type: "prop",
    elem: "li",
    test: "listNotCorrectly",
    score: 4,
    level: "AA",
    trust: "1",
    ref: "H48",
    scs: "1.3.1",
    dis: "43353",
    result: "fail",
  },
  list_04: {
    type: "true",
    elem: "dd,dt",
    test: "descListElement",
    score: 10,
    level: "AAA",
    trust: "1",
    ref: "H40",
    scs: "3.1.3",
    dis: "43353",
    result: "passed",
  },
  list_05: {
    type: "prop",
    elem: "dd,dt",
    test: "notDescListElement",
    score: 4,
    level: "AAA",
    trust: "1",
    ref: "H40",
    scs: "3.1.3",
    dis: "43353",
    result: "fail",
  },
  list_06: {
    type: "true",
    elem: "dl",
    test: "descList",
    score: 10,
    level: "AAA",
    trust: "1",
    ref: "H40",
    scs: "3.1.3",
    dis: "43353",
    result: "passed",
  },
  list_07: {
    type: "prop",
    elem: "dl",
    test: "notDescList",
    score: 4,
    level: "AAA",
    trust: "1",
    ref: "H40",
    scs: "3.1.3",
    dis: "43353",
    result: "fail",
  },
};
