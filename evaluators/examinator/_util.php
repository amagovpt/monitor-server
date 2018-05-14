<?php
  
  function get_webpage($url, $time=null)
  {
    try {
      $url = rawurldecode(trim($url));

      $error = '';
      $info = array();
      $pagecode = '';
      $start = microtime(true);

      if (CheckURI($url, $error)) {
        $curl = new myCurl("all", $time);
        $curl->uri = $url;
        $curl->getPage();
        
        //echo $curl->hasError304();
        if ($curl->error != '') {
          return ["success" => "ERROR_EVALUATION", "message" => "GETTING_PAGE_ERROR"];
        } else {
          if ((count($curl->info) == 0) || ($curl->pagecode == '')) {
            return ["success" => "ERROR_EVALUATION", "message" => "GETTING_PAGE_ERROR"];
          } else {
            $pagecode = $curl->pagecode;
            $info = $curl->info;
            if (isset($curl->info['encoding']) && ($curl->info['encoding'] != 'utf-8')) {
              $pagecode = utf8_encode($curl->pagecode);
            }
          }
        }
      } else {
        return ["success" => "ERROR_URL", "message" => "INVALID_URL"];
      }

      return [$info, $pagecode, $start];
    } catch (Exception $e) {
      echo $e->getMessage();
      return null;
    }
  }

  function evaluate_url($url, $info, $pagecode, $start)
  {
    try {
      $rawUrl = str_replace("http://", "", $url);

      $examinator = new eXaminator();
      $examinator->parserPage($info, $pagecode, $start);
      $tot = $examinator->tot;
      $xp = $examinator->nodes;

      $a = array(
        $tot['info']['title'],
        $tot['info']['score'],
        $rawUrl,
        base64_encode(gzcompress($pagecode, 9)),
        base64_encode(gzcompress(serialize($tot), 9)),
        base64_encode(gzcompress(serialize($xp), 9)),
        $tot['info']['conform'],
        json_encode($tot['elems']),
        date('Y-m-d H:i:s')
      );

      return $a;
    } catch (Exception $e) {
      return [];
    } 
  }

  function Lang($txt, $arg=false)
  {
    global $lang;
    if (!$arg) {
      return $lang[$txt];
    } else {
      if (is_array($arg)) {
        eval('$return = sprintf($lang[$txt], "'.implode('","', $arg).'");');
        return $return;
      } else {
        return sprintf($lang[$txt], $arg);
      }
    }
  }

  function pageTitle($txt)
  {
    return ($txt=='') ? Lang('noTitle') : $txt;
  }

  function Convert_Bytes(&$length)
  {
    if ($length < 1024) {
        return $length.' bytes';
    } elseif ($length < 1024000) {
        return round(($length / 1024), 1).' KB <em>('.$length.' bytes)</em>';
    } else {
        return round(($length / 1048576), 1).' MB <em>('.$length.' bytes)</em>';
    }
  }

  function formatTestText($txt, $a)
  {
    if ($a == 1) {
      $txt = preg_replace('@\([^\)]+\)@mU', '', $txt);
      $txt = preg_replace_callback('@\[([^\|]+)\|([^\]]+)\]@U', 'formatTestA', $txt);
    } else {
      $txt = str_replace('(x)', '~x~', $txt);
      $txt = str_replace(array('(',')'), '', $txt);
      $txt = str_replace('~x~', '(x)', $txt);
      $txt = preg_replace_callback('@\[([^\|]+)\|([^\]]+)\]@U', 'formatTestB', $txt);
    }
    return sprintf($txt, $a);
  }

  function cleanCode($txt)
  {
    return str_replace(array('<code>','</code>'), '', $txt);
  }

  function formatTestA($matches)
  {
    return $matches[1];
  }
  
  function formatTestB($matches)
  {
    return $matches[2];
  }

  function testView(&$ele, &$txt, &$tnum, $id)
  {
    global $href, $tot;
    $txt = preg_replace('|<(/)?[^>]+>|U', '', $txt);
    $txt = str_replace('"', '', $txt);
    $r = $txt.': '.$tnum;
    if (defined('OFF')) {
        return;
    }
    if ($ele=='dtdOld') {
        return;
    }
    if ($ele=='w3cValidatorErrors') {
        return '<a href="'.VALIDATOR.'check?uri='.urlencode($tot['info']['url']).'&charset=%28detect+automatically%29&doctype=Inline&group=0" target="_blank" title="'.$r.'"><img src="'.BASELIB.'img/see2.png" alt="'.
      Lang('viewPageTitle').'" width="24" height="24" class="ico" /></a>';
    }

    if (($tnum > 0) || ($ele=='langNo') || ($ele=='langCodeNo') || ($ele=='langExtra') || ($ele=='titleChars')) {
        return $ele;
    }
    return;
  }

  function process_data($tot)
  {
    $pageid = '';
    $href = $pageid;

    $hidden = array('w3cValidatorErrors', 'w3cValidator', 'title', 'titleNo');
    $info = array('ok'=>array(), 'err'=>array(), 'war'=>array());
    $infotot = array('ok'=>0, 'err'=>0, 'war'=>0, 'tot'=>0);
    $infoak = array(
        'A' => array('ok'=>0, 'err'=>0, 'war'=>0),
        'AA' => array('ok'=>0, 'err'=>0, 'war'=>0),
        'AAA' => array('ok'=>0, 'err'=>0, 'war'=>0)
    );
    $classes = array('war'=>'cellY', 'ok'=>'cellG', 'err'=>'cellR');
    $alts = array('ok'=>'alt="Prática aceitável: " title="esta prática parece estar correta"', 'err'=>'alt="Prática não aceitável: " title="esta prática não parece estar correta"', 'war'=>'alt="Prática para ver manualmente: " title="há dúvidas sobre o significado desta prática. Verifique-a manualmente"');

    $alts2 = array('ok'=> array('alt' => "Prática aceitável:", "title" => "esta prática parece estar correta"), 'err'=> array('alt' => "Prática não aceitável:", "title" => "esta prática não parece estar correta"), 'war' => array('alt' => "Prática para ver manualmente:", "title" => "há dúvidas sobre o significado desta prática. Verifique-a manualmente"));

    try {
      global $tests, $testsResults, $testsColors;

      foreach ($tot['results'] as $ee => $r) {
        list($sco, $pond, $res, $cant) = explode("@", $r);
        $ele = $tests[$ee]['elem'];
        $tes = $tests[$ee]['test'];
        $refs = $tests[$ee]['ref'];
        $lev = $tests[$ee]['level'];
        $techfail = ($refs[0] == 'F')? Lang('relationF') : Lang('relationT');
        if (isset($tot['elems'][$tes])) {
          if ($tes=='titleOk') {
            $tnum = $tot['info']['title'];
          } elseif ($tes=='lang') {
            $tnum = $tot['info']['lang'];
          } else {
            $tnum = $tot['elems'][$tes];
          }
        } else {
          $tnum = 0;
        }

        $msg = formatTestText($testsResults[$ee], $cant);
        $txt = cleanCode($msg);
        $result = '';

        if ($testsColors[$ee] == 'R') {
          $result = 'err';
        } elseif ($testsColors[$ee] == 'Y') {
          $result = 'war';
        } elseif ($testsColors[$ee] == 'G') {
          $result = 'ok';
        }

        $level = strtoupper($lev);

        $seeall = (!in_array($ele, $hidden))? testView($ele, $elems[$ele], $tot['elems'][$ele], $ee).' ' : '';

        $info[$ee][$result] = array('txt'=>$txt, 'lev'=>$level, 'see'=>trim(testView($tes, $elems[$tes], $tnum, $ee)), 'seeall'=>trim($seeall));
        $infoak[$level][$result]++;
      }

      $data = array(
        "uri" => $tot["info"]["url"],
        "title" => pageTitle($tot['info']['title']),
        "n_elements" => $tot['info']['htmlTags'],
        "page_size" => Convert_Bytes($tot['info']['size']),
        "last_update" => date(Lang('dateFormat'), strtotime($tot['info']['date'])),
        "score" => (float) $tot['info']['score'],
        "summary" => $infoak,
        "results" => array()
      );

      foreach ($testsResults as $k => $text) {
        if (!isset($info[$k])) {
          continue;
        }
        foreach ($info[$k] as $kk => $vv) {
          $r = array("tr_color" => "tr-".$kk, "icon" => $kk, "alt" => $alts2[$kk]["alt"], "title" => $alts2[$kk]["title"], "text" => $vv['txt'], "level" => $vv['lev'], "seeall" => $vv['seeall'], "see" => $vv['see']);

          array_push($data["results"], $r);
        }
      }
      
      return $data;
    } catch (Exception $e) {
      return null;
    }
  }

  function resIcon(&$r) {
    switch ($r) {
      case 10: return 'A';
      case 9: case 8: return 'B';
      case 7: case 6: return 'C';
      case 5: case 4: return 'D';
      case 3: case 2: return 'E';
      case 1: return 'F';
    }
  }

  function testView2(&$ele, &$txt, &$tot, $id) {
    global $href;
    $txt = preg_replace('|<(/)?[^>]+>|U', '', $txt);
    $txt = str_replace('"', '', $txt);
    $r = '<li>'.$txt.': <strong>'.$tot.'</strong>';
    /*if (defined('OFF')) {
      return $r.'</li>'."\n";
    }*/
    if (($ele=='w3cValidatorErrors') || ($ele=='dtdOld')) {
      return $r.'</li>'."\n";
    }
    if (($tot > 0) || ($ele=='langNo') || ($ele=='langCodeNo') || ($ele=='langExtra') || ($ele=='titleChars')) {
      $r .= ' <a href="#"> 
  <img src="assets/images/see.png" width="18" height="18" class="ico" alt="'.Lang('seeInPage').'" title="'.Lang('seeInPage').'" /></a></li>'."\n"; // '.$href.'&amp;e='.$ele.'
    }
    return $r;
  } // testView

  function process_data_observatorio($tot, $pagecode, $nodes, $url)
  {
    try {
      $data = [];
      $data["metadata"] = [];
      $data["metadata"]["url"] = $tot["info"]["url"];
      $data["metadata"]["title"] = pageTitle($tot['info']['title']);
      $data["metadata"]["n_elements"] = $tot["info"]["htmlTags"];
      $data["metadata"]["score"] = $tot["info"]["score"];
      $data["metadata"]["size"] = Convert_Bytes($tot['info']['size']);
      $data["metadata"]["last_update"] = $tot['info']['date'];
      $data["metadata"]["count_results"] = count($tot['results']);

      $data["tabs"] = [];
      $data["results"] = ['A'=>[],'B'=>[],'C'=>[],'D'=>[],'E'=>[],'F'=>[]];
      $data["table"] = "";
      $data["elems"] = [];

      global $tests, $techs, $txtTechniques, $testsResults, $scs, $elems;

      $userdisc = array('ubli','ulow','uphy','ucog','uage');
      $cantidades = array('A'=>0,'B'=>0,'C'=>0,'D'=>0,'E'=>0,'F'=>0);
      $A = ''; $B =''; $C =''; $D = ''; $E = ''; $F = '';
      $AA = ''; $BB =''; $CC =''; $DD = ''; $EE = ''; $FF = '';
      $hidden = array('all', 'w3cValidator');
      $table = array(
        'A'=>array('A'=>array(), 'a'=>array(), 'rows'=>0),
        'AA'=>array('AA'=>array(), 'aa'=>array(), 'rows'=>0),
        'AAA'=>array('AAA'=>array(), 'aaa'=>array(), 'rows'=>0),
        'r'=>0, 'p'=>0, 'tot'=>0);
      $rownum = 1;
      foreach ($tot['results'] as $ee => $r) {
        $result = [];

        list($sco, $pond, $res, $cant) = explode("@", $r);
        $ele = $tests[$ee]['elem'];
        $tes = $tests[$ee]['test'];
        $refs = $tests[$ee]['ref'];
        $lev = $tests[$ee]['level'];
        $techfail = ($refs[0] == 'F')? Lang('relationF') : Lang('relationT');
        
        if (isset($tot['elems'][$tes])) {
          if ($tes=='titleOk') {
            $tnum = $tot['info']['title'];
          } else if ($tes=='lang') {
            $tnum = $tot['info']['lang'];
          } else {
            $tnum = $tot['elems'][$tes];
          }
        } else {
          $tnum = 0;
        }
        $scrcrd = resIcon($sco);
        $cantidades[$scrcrd]++;

        $row = $scrcrd.$scrcrd; // Alternate color foreach result
        $$row = ($$row == '')? ' rowcolor' : '';
        $msg = formatTestText($testsResults[$ee], $cant);
        
        $result["title"] = $msg;
        $result["score"] = $sco;
        $result["tech"] = $refs;
        $result["tech_desc"] = $techs[$refs];
        $result["tech_panel_description"] = $txtTechniques[$refs];
        $result["tech_website"] = "http://www.acessibilidade.gov.pt/w3/TR/WCAG20-TECHS/".$refs.".html";
        $result["tech_fail"] = $techfail;
        $result["tech_related_sc"] = [];
        $result["tech_list"] = [];

        $li = [];
        $sctable='';
        $scstmp = explode(',', $tests[$ee]['scs']);
        foreach ($scstmp as $s) {
          $s = trim($s);
          if ($s != '') {
            $li[0] = $s;
            $li[1] = $scs[$s][1];
            $li[2] = "http://www.acessibilidade.gov.pt/w3/TR/UNDERSTANDING-WCAG20/".$scs[$s][0].".html";
            $sctable .= ($sctable=='')? '' : ',';
            $sctable .= '<span title="Nivel '.$scs[$s][1].'">'.$s.'</span> ';
            array_push($result["tech_related_sc"], $li);
          }
        }

        $item = (!in_array($ele, $hidden))? testView2($ele, $elems[$ele], $tot['elems'][$ele], $ee) : '';
        $item .= testView2($tes, $elems[$tes], $tnum, $ee);

        array_push($result["tech_list"], $item);

        array_push($data["results"][$scrcrd], $result);

        /*if (!in_array($ele, $hidden)) {
          if (($ele=='langNo') || ($ele=='langCodeNo') || ($ele=='langExtra') || ($ele=='titleChars')) {
            $data['elems'][$ele] = element_evaluation($tot, $pagecode, $nodes, $url, $ele);
          }
        }

        if (($tes=='langNo') || ($tes=='langCodeNo') || ($tes=='langExtra') || ($tes=='titleChars')) {
          $data['elems'][$ele] = element_evaluation($tot, $pagecode, $nodes, $url, $tes);
        }*/

        if (strpos($lev, 'A') !== false) {
          $key=$lev;
          if ($sco==10) {
            $class='scoreok';
          } else if ($sco<6) {
            $class='scorerror';
          } else {
            $class='scorewar';
          }
        } else {
          $key=strtoupper($lev);
          if ($sco==10) {
            $class='scoreok';
          } else {
            $class='scorewar';
          }
        }

        // Scorecard
        $table[$key][$lev][] = '<tr class="'.$class.'">
          <td>'.$sctable.'</td>
          <td class="left">'.$msg.'</td>
          <td>'.$sco.'</td>
          <td>'.$pond.'</td>
          <td>'.$res.'</td>
          </tr>'."\n";
        $table[$key]['rows']++;
        $table['p'] += $pond;
        $table['r'] += $res;
        $table['tot']++;
      }

      foreach ($cantidades as $k => $v) {
        if ($v > 0) {
          $data["tabs"][$k] = $v;
        }
      }

      // scorecard
      $levels = array('A'=>'a','AA'=>'aa','AAA'=>'aaa');
      $p = number_format(($table['p'] / $table['tot']), 3);
      $r = number_format(($table['r'] / $table['tot']), 3);
      $data["table"] .= '<div class="tab-pane" id="scorecrd">
      <h3 class="concept">'.Lang('modeScore').':
      '.$table['tot'].' '.Lang('seeTests').'. '.Lang('score').' '.$tot['info']['score'].'</h3>
      <table id="scorcard" class="table table-bordered table-sm">
      <caption>'.Lang('fullList').'</caption>
      <tr>
      <th scope="col"><abbr title="Prioridade">Prio.</abbr></th>
      <th scope="col"><abbr title="Critério(s) de sucesso(s)">CS</abbr></th>
      <th scope="col">'.Lang('testCase').'</th>
      <th scope="col"><abbr title="'.Lang('testGrade').'">N</abbr></th>
      <th scope="col"><abbr title="'.Lang('testPond').'">P</abbr></th>
      <th scope="col"><abbr title="'.Lang('score').'">N*P</abbr></th>
      </tr>'."\n";
      foreach ($levels as $k => $v) {
        $first=true;
        if ($table[$k]['rows'] == 0) { continue; }
        if ($table[$k]['rows'] == 1) {
          $row = (isset($table[$k][$k][0]))? $table[$k][$k][0] : $table[$k][$v][0]; // Tiene que ser A o a
          $data["table"] .= preg_replace('@^(<tr[^>]*>)@', '$1<th scope="row">'.$k.'</th>', $row);
        } else {
          if (count($table[$k][$k]) > 0) {
            foreach ($table[$k][$k] as $key => $row) {
              if ($key == 0) {
                $data["table"] .= preg_replace('@^(<tr[^>]*>)@', '$1<th scope="rowgroup" rowspan="'.$table[$k]['rows'].'">'.$k.'</th>', $row);
                $first=false;
              } else {
                $data["table"] .= $row;
              }
            }
          }
          if (count($table[$k][$v]) > 0) {
            foreach ($table[$k][$v] as $key => $row) {
              if ($first && ($key == 0)) {
                $data["table"] .= preg_replace('@^(<tr[^>]*>)@', '$1<th scope="rowgroup" rowspan="'.$table[$k]['rows'].'">'.$k.'</th>', $row);
                $first=false;
              } else {
                $data["table"] .= $row;
              }
            }
          }
        }
      }

      $data["table"] .= '<tr class="sortbottom">
      <td colspan="4">&nbsp;</td>
      <td><strong>'.$p.'</strong></td>
      <td><strong>'.$r.'</strong></td>
      </tr>
      </table>
      <p class="scoreop">'.Lang('scorePond').' = round( '.$r.' / '.$p.' ) = '.$tot['info']['score'].'</p>
      <h4>'.Lang('resultsUx').'</h4>
      <ul style="font-size:0.9em">'."\n";
      foreach ($tot['users'] as $k => $v) {
        list($num, $sco) = explode("@", $v);
        if (in_array($k, $userdisc) && ($num > 0)) {
          $data["table"] .= '<li>'.Lang($k).': Score <strong>'.$sco.'</strong> ('.$num.' pruebas)</li>'."\n";
        }
      }
      $data["table"] .= '</ul>
      </div>
      </div>'."\n";

      return $data;
    } catch (Exception $e) {
      return null;
    }
  }

  function boldText($txt, $id)
    {
        return preg_replace("|^([\n\r\s]*)(.*)|sm", '$1<em style="background-color: #d9dfe3;border: 0.3em solid #d9dfe3;font-weight: bold;">$2</em>', $txt);
    } // boldText

    function highlightCssRule($tot, $r, $id)
    {
        global  $contrast, $OPTION;
        
        if (trim($r) == '') {
            return false;
        }
        //Quitar comentarios
        $r = preg_replace("@\[\[\d+\]\]@U", "", $r);
        $return = '';
        $ok = false;
        $dec = explode(';', $r);
        $color = false;
        $bg = false;
        foreach ($dec as $r) {
            $rr = trim($r);
            if ($rr == '') {
                $return .= $r;
                continue;
            }
            if (strpos($rr, ':') !== false) {
                list($a, $b) = explode(":", $rr, 2);
                $a = strtolower(trim($a));
                $b = strtolower(trim($b));

                if (($a == 'text-align') && ($b == 'justify')) {
                    if ($OPTION == 'justifiedCss') {
                        $r = boldText($r, $id);
                        $ok = true;
                    }
                }
                if (($a == 'font') || ($a == 'font-size')) {
                    if ($OPTION == 'fontValues') {
                        $r = boldText($r, $id);
                        $ok = true;
                    }
                    if (preg_match("@[0-9]+(cm|mm|in|pt|pc|px)@i", $b)) {
                        if ($OPTION == 'fontAbsVal') {
                            $r = boldText($r, $id);
                            $ok = true;
                        }
                    }
                }
                if (strpos($a, 'width') !== false) {
                    if (preg_match("@[0-9\.]+(cm|mm|in|pt|pc)@i", $b)) {
                        if ($OPTION == 'valueAbsCss') {
                            $r = boldText($r, $id);
                            $ok = true;
                        }
                    } elseif (preg_match("@([0-9\.]+)px@i", $b, $ou)) {
                        if (($a == 'width') || ($a == 'min-width')) {
                            if ($ou[1] > 120) {
                                if ($OPTION == 'layoutFixed') {
                                    $r = boldText($r, $id);
                                    $ok = true;
                                }
                            }
                        }
                    } elseif (preg_match("@[0-9\.]+(%|em|ex)@i", $b)) {
                        if ($OPTION == 'valueRelCss') {
                            $r = boldText($r, $id);
                            $ok = true;
                        }
                    }
                }
                if ($a == 'line-height') {
                    if (preg_match("@([0-9\.]+)(cm|mm|in|pt|pc|px|%|em|ex)+@i", $b, $out)) {
                        if (($out[2]=='%') || ($out[2]=='em') || ($out[2]=='ex')) {
                            if ($out[1] < 1.5) {
                                if ($OPTION == 'lineHeightNo') {
                                    $r = boldText($r, $id);
                                    $ok = true;
                                }
                            }
                        }
                    }
                }
                if (($a == 'text-decoration') && ($b == 'blink')) {
                    if ($OPTION == 'cssBlink') {
                        $r = boldText($r, $id);
                        $ok = true;
                    }
                }
                if ($a == 'color') {
                    if ($OPTION == 'colorFgBgNo') {
                        $r = boldText($r, $id);
                        $color=true;
                        $ok = true;
                    }
                    if ($OPTION == 'colorContrast') {
                        foreach ($tot['elems']['color_array'] as $k => $v) {
                            if (trim($rr) == $v['c']) {
                                $r = boldText($r, $id);
                                $color=true;
                                $ok = true;
                                $contrast = $v['a'];
                                break;
                            }
                        }
                    }
                }
                if (($a == 'background') || ($a == 'background-color')) {
                    if ($OPTION == 'colorFgBgNo') {
                        $r = boldText($r, $id);
                        $bg=true;
                        $ok = true;
                    }
                    if ($OPTION == 'colorContrast') {
                        foreach ($tot['elems']['color_array'] as $k => $v) {
                            if (trim($rr) == $v['b']) {
                                $r = boldText($r, $id);
                                $bg=true;
                                $ok = true;
                                $contrast = $v['a'];
                                break;
                            }
                        }
                    }
                }
                $return .= $r.';';
            } else { // something else
                $return .= $r.';';
            }
        } // end foreach
        if ($ok) {
            if ($OPTION == 'colorFgBgNo') {
                if ($color && $bg) {
                    return false;
                }
            }
            if ($OPTION == 'colorContrast') {
                if ($color && $bg) {
                    return $return;
                } else {
                    return false;
                }
            }
            return $return;
        } else {
            return false;
        }
    } // highlightCssRule

    function processCSS($tot, $c, $title, $file='')
    {
        global $contrast, $firstab;
        $c = htmlspecialchars($c, ENT_NOQUOTES);
        if ($title == 'inline') {
            $mm = 'i';
            $id = 'cssinline';
        } elseif ($title == 'style') {
            $mm = 's';
            $id = 'cssstyle';
        } else {
            $mm = 'f'.$file;
            $id = 'css'.$file;
        }

        $comments = false;
        if (preg_match_all("|\/\*[^*]*\*+([^/*][^*]*\*+)*\/|smU", $c, $com)) {
            foreach ($com[0] as $k => $s) {
                $s = preg_replace('@([[:punct:]]{1})@sm', "\\\\$1", $s);
                $c = preg_replace('|'.$s.'|smU', '[['.$k.']]', $c);
            }
            $comments = true;
        }
        $css = '';
        $m = 1;
        $write = false;
        preg_match_all("|([^\{]*)\{([^\}]*)\}|smU", $c, $rules);
        for ($i=0; $i < count($rules[0]); $i++) {
            $contrast = '';
            if ($temp = highlightCssRule($tot, $rules[2][$i], $mm.$m)) {
                $selector = preg_replace("|^([\n\r\s]*)(.*)|sm", '$1<strong id="'.$mm.$m.'">$2', $rules[1][$i]);
                $tspan = '';
                if ($contrast != '') {
                  $tspan = ' title="'.Lang('seeContrastTitle').' '.$contrast.'"';
                }
                $css .= $selector.'{</strong><span'.$tspan.'>'.$temp.'</span><strong>}</strong><br>';
                $m++;
                $write = true;
            } else {
                $selector = preg_replace("|^([\n\r\s]*)(.*)|sm", '$1<strong>$2', $rules[1][$i]);
                $css .= $selector.'{</strong>'.$rules[2][$i].'<strong>}</strong><br>';
            }
        }
        if ($comments) {
          foreach ($com[0] as $k => $s) {
            $css = preg_replace('@\[\['.$k.'\]\]@U', $s, $css);
          }
        }
        $finalCss = "";
        if ($write) {
            if ($title == 'inline') {
                $title = ('seeCssTag');
            } elseif ($title == 'style') {
                $title = Lang('seeCssEle');
            } else {
                $title = Lang('seeCssFile').': <a href="'.$title.'">'.$title.'</a>';
            }
            $active = ($firstab==0)? ' active' : '';
            $firstab = 1;
            $finalCss = '<div class="tab-pane'.$active.'" id="'.$id.'"><h3 class="post-title">'.$title.'</h3>'.'\n';
            $finalCss .= '<pre class="exfbcsspre boxed">'."\n".$css.'</pre>'."\n".'</div>'."\n";
            $finalCss = $css;
        }

      return $finalCss;
    } // processCSS

    function show_css($tot, &$pagecode)
    {
        global $doc, $firstab;
        $menu = '';
        $css = '';
        $firstab = 0;

        $allCss = [];

        $doc = new DOMDocument();
        @$doc->loadHTML($pagecode);
        $xpath = new DOMXPath($doc);
        $inline = '';
        $xpinline = $xpath->query("//*[@style][normalize-space(@style)!='']");
        foreach ($xpinline as $nodeinline) {
            $txt = $nodeinline->getAttribute('style');
            $parent = $nodeinline->tagName;
            if ($nodeinline->getAttribute('id') != '') {
                $parent .= '#'.$nodeinline->getAttribute('id');
            } else {
                if ($nodeinline->getAttribute('class') != '') {
                    $parent .= '.'.$nodeinline->getAttribute('class');
                }
            }
            $inline .= $parent.' {'.$txt.'}';
        }
        if ($inline != '') {
          $allCss["inline"] = processCSS($tot, trim($inline), 'inline');
        }

        $embed = '';
        $xpembed = $xpath->query("//style[normalize-space(.)!='']");
        foreach ($xpembed as $nodembed) {
            $txt = trim($nodembed->textContent);
            $embed .= $txt."\n\n";
        }

        if ($embed != '') {
          $allCss["embed"] = processCSS($tot, trim($embed), 'style');
        }

        return $allCss;
    }

    function code(&$tot, &$pagecode)
    {
      global $LANGUAGE;

        if ($tot['info']['encoding'] != 'utf-8') {
            $pagecode = utf8_encode($pagecode);
        }
        $lng = '';
        if (isset($tot['info']['lang']) && ($tot['info']['lang'] != $LANGUAGE)) {
            $lng = ' lang="'.$tot['info']['lang'].'"';
        }
        $title='monitor';

        $lines = preg_split("/\n/", $pagecode);
        foreach ($lines as $k => $v) {
            $tmp = trim($v);
        }
    }

    function base_URL(&$url)
    {
        $parse = parse_url($url);
        $url_b = strtolower($parse['scheme'])."://";
        $url_b .= $parse['host'] ? $parse['host'] : '';
        $url_b .= (isset($parse['port']))? ':'.$parse['port'] : '';
        if (isset($parse['path'])) {
            if ((preg_match("@\.@", $parse['path'])) || isset($parse['query']) || isset($parse['fragment']) || (substr($url, -1) != "/")) {
                $separa = explode("/", $parse['path']);
                $sacar = array_pop($separa);
                $parse['path'] = rtrim($parse['path'], $sacar);
                $url_b .= $parse['path'];
            } else {
                $url_b .= $parse['path'];
            }
        }
        if (substr($url_b, -1) != "/") {
            $url_b .= "/";
        }
        return $url_b;
    }

  $OPTION = null;
  $LANGUAGE = 'pt-PT';

  function element_evaluation($tot, $pagecode, $nodes, $url, $ele)
  {
    try {
      global $OPTION;
      $OPTION = $ele;
      //runkit_constant_redefine('OPTION', $ele);
      //define('OPTION', $ele);
      //runkit_constant_redefine('LANGUAGE', 'pt-PT');
      //define('LANGUAGE', 'pt-PT');

      if ($OPTION == 'code') {
        code($tot, $pagecode);
      }

      $testSee = array(
      'css' => array('colorContrast', 'colorFgBgNo', 'cssBlink', 'fontAbsVal',
      'fontValues', 'justifiedCss', 'layoutFixed', 'lineHeightNo', 'valueAbsCss', 'valueRelCss'),
      'div' => array('aGroupNo', 'applet', 'appletAltNo', 'blink', 'brSec',
      'ehandBoth', 'ehandBothNo', 'ehandMouse', 'ehandTagNo', 'ehandler',
      'charSpacing', 'embed', 'embedAltNo', 'fieldLegNo', 'fieldNoForm', 'form',
      'formSubmitNo', 'hx', 'hxSkip', 'id', 'idRep', 'iframe', 'iframeTitleNo', 'justifiedTxt', 'liNoList', 'marquee',
      'object', 'objectAltNo', 'table',
      'tableCaptionSummary', 'tableComplex', 'tableComplexError', 'tableData', 'tableDataCaption', 'tableLayout',
      'tableLayoutCaption', 'tableNested', 'valueAbsHtml', 'valueRelHtml'),
      'span' => array('a', 'abbrNo', 'aJs', 'aSameText', 'aAdjacent', 'aAdjacentSame', 'aImgAltNo', 'aSkip', 'aSkipFirst',
      'aTitleMatch', 'deprecElem', 'fontHtml', 'img', 'imgAltLong', 'imgAltNo',
      'imgAltNot', 'imgAltNull', 'inpImg', 'inpImgAltNo', 'inputAltNo', 'inputIdTitleNo', 'inputLabel', 'inputLabelNo', 'label', 'labelForNo',
      'labelPosNo', 'labelTextNo', 'layoutElem', 'longDImg', 'longDNo'));

      $css = null;
      if (in_array($OPTION, $testSee['css'])) {
        //if (!VIEW)
         // define('VIEW', 'css');
        $css = show_css($tot, $pagecode);
      }

      require_once(__DIR__."/lib/_test_see.php");

      $inpage = (in_array($OPTION, $testSee['div']) || in_array($OPTION, $testSee['span']))? true : false;

      $data = [];

      if ($css != null) {
        $data["show_css"] = true;
        $data["css"] = $css;
      } else {
        $n = new TestSee($tot, $pagecode, $inpage, $nodes);
        $data = $n->getData();
        $data["show_css"] = false;
      }

      return $data; 
    } catch (Exception $e) {
      return null;
    }
  }