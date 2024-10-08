const xpath: any = {
  a: "//a[@href]",
  aSkipFirst: "//a",
  abbrNo:
    '//abbr[not(@title) or normalize-space(@title)=""]|//acronym[not(@title) or normalize-space(@title)=""]',
  applet: "//applet",
  area: "//area",
  areaAltNo: '//area[not(@alt) or normalize-space(@alt)=""]',
  blink: "//blink",
  dl: "//dl",
  "dd,dt": "//dd,dt",
  ehandMouse:
    "//*[@onmousedown]|//*[@onmouseup]|//*[@onmouseout]|//*[@onmouseover]",
  ehandler:
    "//*[@onfocus]|//*[@onblur]|//*[@onkeypress]|//*[@onkeydown]|//*[@onkeyup]|//*[@onsubmit]|//*[@onreset]|//*[@onselect]|//*[@onchange]|//*[@onload]|//*[@onunload]|//*[@onclick]|//*[@ondblclick]|//*[@onmousedown]|//*[@onmouseup]|//*[@onmouseover]|//*[@onmousemove]|//*[@onmouseout]",
  embed: "//embed",
  fieldLegNo:
    '//fieldset[not(.//legend) or not(.//legend[normalize-space(.)!=""])]',
  fieldNoForm: "//fieldset[not(ancestor::form)]",
  fontHtml:
    "//b|//basefont[@*]|//body[@text or @link or @alink or @vlink]|//font[@*]|//i|//s|//strike|//u",
  form: "//form",
  formSubmitNo:
    '//form[not(.//input[@type="submit"]) and not(.//input[@type="image"]) and not(.//button[@type="submit"])]',
  frame: "//frame",
  frameTitleNo: '//frame[not(@title) or normalize-space(@title)=""]',
  frameset: "//frameset",
  hx: '//h1|//h2|//h3|//h4|//h5|//h6|//[@aria-level][@role="heading"]',
  id: "//*[@id]",
  iframe: "//iframe",
  iframeTitleNo: '//iframe[not(@title) or normalize-space(@title)=""]',
  img: "//img",
  imgAltNo: "//img[not(@alt)]",
  imgAltNull: '//img[normalize-space(@alt)=""]',
  inpImg: '//input[@type="image"]',
  inpImgAltNo: '//input[@type="image"][not(@alt)]',
  inputAltNo: '//input[not(@type="image")][(@alt]',
  inputLabel:
    '//input[@type="text"]|//input[@type="checkbox"]|//input[@type="radio"]|//input[@type="file"]|//input[@type="password"]|//textarea|//select',
  justifiedTxt: '//*[translate(@align,"JUSTIFY","justify")="justify"]',
  label: "//label",
  labelForNo: '//label[not(@for) or normalize-space(@for)=""]',
  labelTextNo: '//label[normalize-space(text())=""]',
  lang: "//html",
  langCodeNo: "//html",
  langExtra: "//html",
  langMatchNo: "//html",
  langNo: "//html",
  layoutAttr:
    "//*[@align]|//*[@hspace]|//*[@vspace]|//*[@color]|//*[@face]|//basefont[@size]|//*[@text]|//*[@link]|//*[@alink]|//*[@vlink]|//*[@bgcolor]|//*[@background]|//font[@size]",
  layoutElem: "//blink|//center",
  li: "//li",
  listNotCorrectly: "//li",
  liNoList: "//li[not(ancestor::ol) and not(ancestor::ul)]",
  linkRel:
    '//link[@rel="alternate" or @rel="appendix" or @rel="bookmark" or @rel="chapter" or @rel="contents" or @rel="copyright" or @rel="glossary" or @rel="help" or @rel="index" or @rel="next" or @rel="prev" or @rel="section" or @rel="start" or @rel="subsection"]|//link[@rev="alternate" or @rev="appendix" or @rev="bookmark" or @rev="chapter" or @rev="contents" or @rev="copyright" or @rev="glossary" or @rev="help" or @rev="index" or @rev="next" or @rev="prev" or @rev="section" or @rev="start" or @rev="subsection"]',
  longDImg: "//img[@longdesc]",
  longDNo:
    '//img[normalize-space(@longdesc)="" or normalize-space(@longdesc)="#" or contains(@longdesc, " ")]',
  marquee: "//marquee",
  metaRedir:
    '//meta[translate(@http-equiv,"REFSH","refsh")="refresh"][contains(translate(@content, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "url")]',
  metaRefresh:
    '//meta[translate(@http-equiv,"REFSH","refsh")="refresh"][@content > 0]',
  newWinOnLoad:
    '//body[contains(@onload, "window.open") or contains(@onload, "MM_openBrWindow")]',
  object: "//object",
  table: "//table",
  tableData: "//table[child::tr[th] or child::tr[td[@scope]]]",
  tableDataCaption:
    "//table[child::tr[th] or child::tr[td[@scope]]][not(caption)][not(@summary)]",
  tableLayout: "//table[not(child::tr[th]) and not(child::tr[td[@scope]])]",
  tableLayoutCaption:
    "//table[not(child::tr[th]) and not(child::tr[td[@scope]])][caption or @summary]",
  tableNested: "//table[descendant::table]",
  titleChars: "//title",
  titleLong: "//title",
  titleNull: "//title",
  titleSame: "//title",
  titleVrs: "//title",
  titleOk: "//title",
};

export default xpath;
