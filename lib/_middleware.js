"use strict";

/**
 * Evaluators API module
 */

const exec = require('child_process').exec;
const _ = require('lodash');
const Promise = require('promise');
const config = require('../evaluators/config.json');

const tests = require('./_tests.json');
const techs = require('./_techs.json');
const txtTechniques = require('./_txt_techniques.json');
const testsResults = require('./_tests_results.json');
const scs = require('./_scs.json');
const elems = require('./_elems.json');
const lang = require('./_lang.json');

function _correct_url(url) {
  if (_.startsWith(url, 'http:') || _.startsWith(url, 'https:'))
    return url;

  return 'http://' + url;
}

function _get_command(_evaluator='examinator') {
  if (!_.includes(config.evaluators, _evaluator)) {
    _evaluator = 'examinator';
  }

  const eval_config = require('../evaluators/' + _evaluator + '/config.json');
  return eval_config.command + ' ' + __dirname + '/../evaluators/' + _evaluator + '/' + eval_config.main;
}

function _evaluate(url, engine) {
  return new Promise((resolve, reject) => {
    exec(_get_command(engine) + ' 1 ' + _correct_url(url), {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      else if (stderr) {
        reject(stderr);
      }
      else 
        resolve(_.trim(stdout));
    });
  });
}

function Convert_Bytes(length) {
  if (length < 1024) {
      return length + ' bytes';
  } else if (length < 1024000) {
      return _.round((length / 1024), 1) + ' KB <em>('+length+' bytes)</em>';
  } else {
      return _.round((length / 1048576), 1) + ' MB <em>('+length+' bytes)</em>';
  }
}

function resIcon(r) {
  switch (parseInt(r)) {
    case 10: return 'A';
    case 9: case 8: return 'B';
    case 7: case 6: return 'C';
    case 5: case 4: return 'D';
    case 3: case 2: return 'E';
    case 1: return 'F';
  }
}

function formatTestText(txt, a) {
  if (a == 1) {
      txt = txt.replace("@\\([^\\)]+\\)@mU", "");
      txt = txt.replace("@\\[([^\\|]+)\\|([^\\]]+)\\]@U", function(matches) {
        return matches[1];
      });
  } else {
      txt = txt.replace("(x)", "~x~");
      txt = txt.replace({
          0: "(",
          1: ")"
      }, "");
      txt = txt.replace("~x~", "(x)");
      txt = txt.replace("@\\[([^\\|]+)\\|([^\\]]+)\\]@U", function(matches) {
        return matches[2];
      });
  }
  return txt;
}

function testView2(ele, txt, tot, id, url) {

  url = url.replace('http://', '');
  url = url.replace('https://', '');

  txt = txt.replace('|<(/)?[^>]+>|U', '');
  txt = txt.replace('"', '');
  let r = '<li>'+txt+': <strong>'+tot+'</strong>';

  if ((ele === 'w3cValidatorErrors') || (ele === 'dtdOld')) {
    return r+'</li>'+"\n";
  }
  if ((tot > 0) || (ele === 'langNo') || (ele === 'langCodeNo') || (ele === 'langExtra') || (ele === 'titleChars')) {
    r += ' <a href="/results/'+encodeURIComponent(url)+'/'+ele+'" target="_blank"> <img src="assets/images/see.png" width="18" height="18" class="ico" alt="'+lang['seeInPage']+'" title="'+lang['seeInPage']+'" /></a></li>'+"\n"; // '.$href.'&amp;e='.$ele.'
  }
  return r;
} // testView

function _process(tot, pagecode, nodes, url) {
  
  let data = {};
  data.metadata = {};
  data.metadata.url = tot.info.url;
  data.metadata.title = tot.info.title;
  data.metadata.n_elements = tot.info.htmlTags;
  data.metadata.score = tot.info.score;
  data.metadata.size = Convert_Bytes(tot.info.size);
  data.metadata.last_update = tot.info.date;
  data.metadata.count_results = _.size(tot.results);

  data.tabs = {};
  data.results = {"A":[],"B":[],"C":[],"D":[],"E":[],"F":[]};
  //data.table = "";
  data.tableTest = [];
  data.elems = [];

  let userdisc = {'0': "ubli", '1': "ulow", '2': "uphy", '3': "ucog", '4': "uage"};

  let cantidades = {"A": 0, "B": 0, "C": 0, "D": 0, "E": 0, "F": 0};

  let A = ""; let B = ""; let C = ""; let D = ""; let E = ""; let F = "";
  let AA = ""; let BB = ""; let CC = ""; let DD = ""; let EE = ""; let FF = "";

  let hidden = ["all", "w3cValidator"];

  let table = {
    "A": {
      "A": [],
      "a": [],
      "rows": 0
    },
    "AA": {
      "AA": [],
      "aa": [],
      "rows": 0
    },
    "AAA": {
      "AAA": [],
      "aaa": [],
      "rows": 0
    },
    "r": 0,
    "p": 0,
    "tot": 0
  };
  

  //let rownum = 1;

  for (let ee in tot.results) {
    let r = tot.results[ee];

    let split = _.split(r, '@');
    let sco = split[0];
    let pond = split[1];
    let res = split[2];
    let cant = split[3];

    let ele = tests[ee]['elem'];
    let tes = tests[ee]['test'];
    let refs = tests[ee]['ref'];
    let lev = tests[ee]['level'];
    let techfail = refs[0] ==='F' ? lang['relationF'] : lang['relationT'];

    let tnum;

    if (tot.elems[tes]) {
      if (tes === 'titleOk') {
        tnum = tot.info.title;
      } else if (tes === 'lang') {
        tnum = tot.info.lang;
      } else {
        tnum = tot.info[tes];
      }
    } else {
      tnum = 0;
    }
    
    let scrcrd = resIcon(sco);
    
    cantidades[scrcrd]++;

    let row = scrcrd + '' + scrcrd; // Alternate color foreach result
    //let row2 = (row2 === '')? ' rowcolor' : '';
    let msg = formatTestText(testsResults[ee], cant);
    
    let result = {};
    result["title"] = _.clone(msg);
    result["score"] = _.clone(sco);
    result["tech"] = _.clone(refs);
    result["tech_desc"] = _.clone(techs[refs]);
    result["tech_panel_description"] = _.clone(txtTechniques[refs]);
    result["tech_website"] = _.clone("http://www.acessibilidade.gov.pt/w3/TR/WCAG20-TECHS/"+refs+".html");
    result["tech_fail"] = _.clone(techfail);
    result["tech_related_sc"] = new Array();
    result["tech_list"] = new Array();

    let li = [];
    let sctable='';
    let scstmp = tests[ee]['scs'].split(',');
    
    for (let s in scstmp) {
      s = _.trim(scstmp[s]);
      if (s !== '') {
        li[0] = s;
        li[1] = scs[s]['1'];
        li[2] = "http://www.acessibilidade.gov.pt/w3/TR/UNDERSTANDING-WCAG20/"+scs[s]['0']+".html";
        sctable += sctable === '' ? s : ', ' + s;

        result["tech_related_sc"].push(_.clone(li));
      }
    }

    let item = !_.includes(hidden, ele) ? testView2(ele, elems[ele], tot['elems'][ele], ee, url) : '';
    item += testView2(tes, elems[tes], tnum, ee, url);
    
    result["tech_list"].push(_.clone(item));
    
    data['results'][scrcrd].push(_.clone(result));
    data['elems'].push(ele);
    data['elems'].push(tes);
    
    let key;
    let _class;
    let prio;
    
    if (lev.indexOf('A') !== -1) {
      key = lev;
      if (sco == 10) {
          _class = "scoreok";
          prio = 3;
      } else {
        if (sco < 6) {
            _class = "scorerror";
            prio = 1;
        } else {
            _class = "scorewar";
            prio = 2;
        }
      }
    } else {
      key = _.toUpper(lev);
      if (sco == 10) {
          _class = "scoreok";
          prio = 3;
      } else {
          _class = "scorewar";
          prio = 2
      }
    }

    //if (_.includes(['A', 'AA', 'AAA'], lev))
    data.tableTest.push({'class': _class, 'level': _.toUpper(lev), 'sc': sctable, 'desc': msg, 'prio': prio});

    table[key][lev].push("<tr class=\"" + _class + "\"><td>" + sctable + "</td><td class=\"left\">" + msg + "</td>" + "\n");
    
    table[key]["rows"]++;
    table["p"] += pond;
    table["r"] += res;
    table["tot"]++;
  }

  data.tableTest = _.orderBy(data.tableTest, ['level', 'prio'], ['asc', 'asc']);

  for (let k in cantidades) {
    let v = cantidades[k];
    if (v > 0) {
      data["tabs"][k] = v;
    }
  }

  /*let levels = {
      "A": "a",
      "AA": "aa",
      "AAA": "aaa"
  };

  let p = (table["p"] / table["tot"]).toFixed(3);

  let r = (table["r"] / table["tot"]).toFixed(3);

  data["table"] += "<div class=\"tab-pane\" id=\"scorecrd\">" + "<table id=\"scorcard\" class=\"table table-bordered table-sm\">" + "<tr><th scope=\"col\"><abbr title=\"Prioridade\">Prio.</abbr></th><th scope=\"col\"><abbr title=\"Critério(s) de sucesso(s)\">CS</abbr></th><th scope=\"col\">" + lang["testCase"] + "</th>" + "\n";  

  let row;
  for (let k in levels) {
      let v = levels[k];
      let first = true;
      if (table[k]["rows"] === 0) {
          continue;
      }
      if (table[k]["rows"] === 1) {
          row = table[k][k][0] ? table[k][k][0] : table[k][v][0];
          // Tiene que ser A o a
          data["table"] += row.replace("@^(<tr[^>]*>)@", "$1<th scope=\"row\">" + k + "</th>");
      } else {
          if (_.size(table[k][k]) > 0) {
            for (let key in table[k][k]) {
                row = table[k][k][key];
                if (key === 0) {
                    data["table"] += row.replace("@^(<tr[^>]*>)@", "$1<th scope=\"rowgroup\" rowspan=\"" + table[k]["rows"] + "\">" + k + "</th>");
                    first = false;
                } else {
                    data["table"] += row;
                }
            }
          }
          if (_.size(table[k][v]) > 0) {
              for (let key in table[k][v]) {
                  row = table[k][v][key];
                  if (first && key === 0) {
                      data["table"] += row.replace("@^(<tr[^>]*>)@", "$1<th scope=\"rowgroup\" rowspan=\"" + table[k]["rows"] + "\">" + k + "</th>");
                      first = false;
                  } else {
                      data["table"] += row;
                  }
              }
          }
      }
  }

  data["table"] += '</div></div>'+"\n";*/
  
  return data;
}

module.exports.evaluate = (url, engine) => {
  return _evaluate(url, engine);
}

module.exports.evaluate_and_process = async (url, engine) => {
  const evaluation = JSON.parse(await _evaluate(url, engine));
  evaluation.processed = _process(evaluation.data.tot, evaluation.pagecode, evaluation.data.nodes, url);
  return evaluation;
}