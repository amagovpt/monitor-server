<?php
class TestSee
{
    private $pagecode = '';
    private $newDom;
    private $empty = array('area', 'base', 'basefont', 'br', 'col', 'frame', 'hr', 'img', 'input', 'isindex', 'link', 'meta', 'param');
    private $search = array("@<!--(.*)-->@mU", "|\&\#13\;|", "|(<\/[^>]+>)|smU", "|[\n\r]+|");
    private $replace = array("", "", "$1\n", "\n");
    private $i = 1;
    private $pi = array('href', 'type', 'media', 'version', 'encoding');
    private $code = '';
    private $atts = '';
    private $exce = array();
    private $dialog = false;
    private $data = array("page" => "", "results" => array());

    public function __construct(&$tot, &$pagecode, $inpage, $nodes)
    {
      global $OPTION;

        if (isset($tot['info']['encoding']) && ($tot['info']['encoding'] == 'utf-8')) {
            $this->pagecode = mb_convert_encoding($pagecode, 'HTML-ENTITIES', "UTF-8");
        } else {
            $this->pagecode = $pagecode;
        }
        $pagecode = '';
        $doc = new DOMDocument();
        @$doc->loadHTML($this->pagecode);
        $this->newDom = new DOMDocument;
        if (isset($nodes[$OPTION])) {
            $nodes = $nodes[$OPTION];
        } else {
            global $xpath;
            $nodes = $xpath[$OPTION];
        }
        $nodelist = '';
        if ($nodes != '') {
            $temp = strtr(base64_encode(gzcompress($nodes, 9)), '+/=', '-_,');
            $nodelist = '&b='.$temp;
        }

        if (!defined('VIEW')) {
            $base = '<base href="'.base_URL($tot['info']['url']).'" />'."\n";
        }
        $title = 'monitor';

        $this->loadTestsArray($OPTION);

        $domxpath = new DOMXPath($doc);
        
        $result = $domxpath->query($nodes);

        foreach ($result as $node) {
            $this->addElem($node);
        }
        //$this->data["page"] = $nodelist;
        $this->data["page"] = $this->highlight_page($nodes, $tot, $pagecode);
    }

    public function getData()
    {
        return $this->data;
    }

    private function showInPage(&$doc, &$tot, $prev, &$xpath) {
        $head = $doc->getElementsByTagName("head")->item(0);
        $b = $xpath->query("//base[@href]")->item(0);
        if (!isset($b)) {
          $base = $doc->createElement("base");
          $primero = $xpath->query("//head/*")->item(0);
          $newnode = $head->insertBefore($base, $primero);
          if (isset($tot['info']['url_base'])) {
            $newnode->setAttribute("href", $tot['info']['url_base']);
          } else {
            $newnode->setAttribute("href", $this->base_URL_2($tot['info']['url']));
          }
        }
        $style = $doc->createElement("link");
        $head->appendChild($style);
        $style->setAttribute("rel","stylesheet");
        $style->setAttribute("type","text/css");
        $style->setAttribute("id","examinator");
        $style->setAttribute("href","http://examinator.ws/examinator.css");
        //echo $prev;
        return $doc->saveHTML();
      } // showInPage

      private function base_URL_2(&$url) {
        $parse = parse_url($url);
        $url_b = strtolower($parse['scheme'])."://";
        $url_b .= $parse['host'] ? $parse['host'] : '';
        $url_b .= (isset($parse['port']))? ':'.$parse['port'] : '';
        if (isset($parse['path'])) {
          if((preg_match("@\.@",$parse['path'])) || isset($parse['query']) || isset($parse['fragment']) || (substr($url,-1) != "/")) {
            $separa = explode("/",$parse['path']);
            $sacar = array_pop($separa);
            $parse['path'] = rtrim($parse['path'],$sacar);
            $url_b .= $parse['path'];
          } else {
            $url_b .= $parse['path'];
          }
        }
        if(substr($url_b,-1) != "/") {
          $url_b .= "/";
        }
        return $url_b;
      } // base_URL


    public function highlight_page($xp, $tot, $pagecode)
    {
      
      if (isset($tot['info']['encoding'])) {
        //header("Content-type: text/html; charset=".$tot['info']['encoding']);
        if ($tot['info']['encoding'] == 'utf-8') {
          $pagecode = mb_convert_encoding($pagecode, 'HTML-ENTITIES', "UTF-8");
        }
      }

      if ($xp == '') {
        if (preg_match('@^(.*)(<!DOCTYPE[^>]+>.*)$@isU', $pagecode, $match)) {
          $pagecode = $match[2];
          $prev = trim($match[1])."\n";
        }
        $doc = new DOMDocument();
        @$doc->loadHTML($pagecode);
        $xpath = new DOMXPath($doc);
        $head = $doc->getElementsByTagName("head")->item(0);
        $b = $xpath->query("//base[@href]")->item(0);
        if ($b) {
          echo @$doc->saveHTML();
        } else {
          $base = $doc->createElement("base");
          $primero = $xpath->query("//head/*")->item(0);
          $newnode = $head->insertBefore($base, $primero);
          if (isset($tot['info']['url_base'])) {
            $newnode->setAttribute("href", $tot['info']['url_base']);
          } else {
            $newnode->setAttribute("href", $this->base_URL_2($tot['info']['url']));
          }
          $HTMLdoc = @$doc->saveHTML();
          if ($HTMLdoc) {
            echo (isset($prev))? $prev : '';
            echo $HTMLdoc;
          } else {
            header('Location:'.$tot['info']['url']);
          }
        }
        exit;
      }

      // Hay algo para mostrar
      if (preg_match('@^(.*)(<!DOCTYPE[^>]+>.*)$@isU', $this->pagecode, $match)) {
        $prev = trim($match[1])."\n";
      } else {
        $prev = '';
      }
      $doc = new DOMDocument();
      @$doc->loadHTML($this->pagecode);
      $newDom = new DOMDocument;
      $xpath = new DOMXPath($doc);
      $result = $xpath->query($xp);
      foreach ($result as $node) {
        if ($node->hasAttribute('class')) {
          $class = $node->getAttribute('class').' exfbinpaged';
        } else {
          $class = 'exfbinpaged';
        }
        $node->setAttribute("class", $class);
      }
      
      return $this->showInPage($doc, $tot, $prev, $xpath);
    }

    public function addElem(&$child)
    {
        if (array_key_exists($child->tagName, $this->exce)) {
            $code = $this->exce[$child->tagName];
        } else {
            $code = $this->code;
        }
        $mono = '';
        if ($code == 'label') {
            if ($child->parentNode->tagName == 'label') {
                $tmp = $this->newDom->appendChild($this->newDom->importNode($child->parentNode, true));
                $ele = $child->parentNode->tagName.' / '.$child->tagName;
            } else {
                $tmp = $this->newDom->appendChild($this->newDom->importNode($child, true));
                $ele = $child->tagName;
            }
            $tag2 = $this->newDom->saveXML($tmp);

            $this->dialog = true;
        } elseif ($code == 'all') {
            $ele = $child->tagName;
            $tag = $this->pagecode;
            $tag2 = $this->spChars($tag, true);
        } else {
            $tmp = $this->newDom->appendChild($this->newDom->importNode($child, true));
            $tag = $this->newDom->saveXML($tmp);
            $tag2 = $this->FixHTMLTags($tag);
            $ele = $child->tagName;
            $this->dialog = true;
        }
        $att = ($this->atts != '')? $this->getAttrs($child) : '';
        if ($code == 'code') {
            $tag2 = $this->spChars($tag);
            $mono = ' fontmono';
            $this->dialog = false;
        } elseif ($code == 'br') {
            $tag2 = preg_replace('@(<br[^>]*>)@iU', '<code class="fbexhighlight">[br]</code>$1', $tag);
        } elseif ($code == 'embed') {
            $tag2 = '';
            if ($next = $child->nextSibling) {
                if ($next->tagName == 'noembed') {
                    $tmp2 = $this->newDom->appendChild($this->newDom->importNode($next, true));
                    $tag2 = $this->newDom->saveXML($tmp2);
                    $tag .= "\n".$tag2;
                }
            }
        } elseif ($code == 'first') {
            $txt = preg_match('@^(<[^>]+>)@ismU', $tag, $out);
            $tag = $out[0];
            $tag2 = $this->spChars($tag);
            $mono = ' fontmono';
            $this->dialog = false;
        }
        if ($this->dialog) {
            $element = '<a href="#ex_'.$this->i.'" class="dialogsee">'.$ele.'</a>';
        } else {
            $element = '<strong>'.$ele.'</strong>';
        }
        $class = ($this->dialog)? ' class="dialogsee"' : '';

        array_push($this->data["results"], array("element" => trim($ele), "attr" => trim($att), "tag" => trim($tag2)));
        $this->i++;
    }

    public function getAttrs(&$node)
    {
        if (!is_array($this->atts)) {
            if ($node->hasAttribute($this->atts)) {
                return ' '.$this->atts.'=&quot;'.htmlspecialchars($node->getAttribute($this->atts)).'&quot;';
            }
            return;
        }
        $this_attrs = '';
        foreach ($this->atts as $a) {
            if ($node->hasAttribute($a)) {
                $this_attrs .= ' '.$a.'=&quot;'.htmlspecialchars($node->getAttribute($a)).'&quot;';
            }
        }
        return $this_attrs;
    }

    public function FixHTMLTags($code)
    {
        $ret = preg_replace($this->search, $this->replace, $code);
        preg_match_all("@(<[^>]+>)@m", $ret, $out, PREG_PATTERN_ORDER);
        for ($i=0; $i < count($out[0]); $i++) {
            $tag = $out[1][$i];
            if (preg_match("@^<([a-z1-6]+)(.*)\/>$@", $tag, $el)) {
                if (!in_array($el[1], $this->empty)) {
                    $tagr = preg_replace('@([[:punct:]]{1})@sm', "\\\\$1", $tag);
                    $ret = preg_replace('|'.$tagr.'|ismU', '<'.$el[1].$el[2].'></'.$el[1].'>', $ret);
                }
            }
        }
        return $ret;
    }

    public function spChars($code, $br=false)
    {
        //$code = htmlspecialchars($code, ENT_QUOTES);
        $code =  str_replace(array('<', '>'), array('&lt;', '&gt;'), $code);
        if ($br) {
            return nl2br($code);
        } else {
            return $code;
        }
    }

    public function loadTestsArray($k)
    {
        $test = array(
  'a' => array('at' => 'href'),
  'aAdjacentSame' => array('at' => 'href'),
  'aGroupNo' => '',
  'aImgAltNo' => array('at' => 'href'),
  'aSameText' => array('at' => 'href'),
  'aSkip' => array('at' => 'href'),
  'aSkipFirst' => array('at' => 'href'),
  'aTitleMatch' => array('at' => 'title'),
  'abbrNo' => array('at' => 'title'),
  'acckeyRep' => array('at' => 'accesskey'),
  'applet' => '',
  'appletAltNo' => array('at' => 'alt'),
  'area' => array('cod' => 'code', 'at' => 'alt'),
  'areaAltNo' => array('at' => 'alt', 'cod' => 'code'),
  'blink' => '',
  'brSec' => array('cod' => 'br'),
  'ehandBoth' => array('at' =>
    array(
      0 => 'onfocus',
      1 => 'onblur',
      2 => 'onkeypress',
      3 => 'onkeydown',
      4 => 'onkeyup',
      5 => 'onsubmit',
      6 => 'onreset',
      7 => 'onselect',
      8 => 'onchange',
      9 => 'onclick',
      10 => 'onmousedown',
      11 => 'onmouseup',
      12 => 'onmouseover',
      13 => 'onmouseout'),
  ),
  'ehandBothNo' => array('at' =>
    array(
      0 => 'onmousedown',
      1 => 'onkeydown',
      2 => 'onmouseup',
      3 => 'onkeyup',
      4 => 'onmouseover',
      5 => 'onfocus',
      6 => 'onmouseout',
      7 => 'onblur'),
  ),
  'ehandMouse' => array('at' =>
    array(0 => 'ondblclick', 1 => 'onmousemove'),
  ),
  'ehandTagNo' => array('at' =>
    array(
      0 => 'onfocus',
      1 => 'onblur',
      2 => 'onkeypress',
      3 => 'onkeydown',
      4 => 'onkeyup',
      5 => 'onsubmit',
      6 => 'onreset',
      7 => 'onselect',
      8 => 'onchange',
      9 => 'onclick',
      10 => 'ondblclick',
      11 => 'onmousedown',
      12 => 'onmouseup',
      13 => 'onmouseover',
      14 => 'onmousemove',
      15 => 'onmouseout'),
  ),
  'ehandler' => array('at' =>
    array(
      0 => 'onfocus',
      1 => 'onblur',
      2 => 'onkeypress',
      3 => 'onkeydown',
      4 => 'onkeyup',
      5 => 'onsubmit',
      6 => 'onreset',
      7 => 'onselect',
      8 => 'onchange',
      9 => 'onclick',
      10 => 'ondblclick',
      11 => 'onmousedown',
      12 => 'onmouseup',
      13 => 'onmouseover',
      14 => 'onmousemove',
      15 => 'onmouseout'),
  ),
  'embed' => array('cod' => 'embed'),
  'embedAltNo' => '',
  'fieldLegNo' => '',
  'fieldNoForm' => '',
  'focusBlur' => '',
  'fontHtml' =>
  array('exc' => array(0 => 'basefont:code', 1 => 'body:first'), 'at' =>
    array(0 => 'text', 1 => 'link', 2 => 'alink', 3 => 'vlink'),
  ),
  'form' => '',
  'formSubmitNo' => '',
  'frame' => array('cod' => 'code', 'at' => 'title'),
  'frameDtdNo' => array('cod' => 'all'),
  'frameTitleNo' => array('cod' => 'code'),
  'frameset' => array('cod' => 'code'),
  'hx' => '',
  'hxNo' => '',
  'hxSkip' => '',
  'id' => array('at' => 'id', 'cod' => 'first'),
  'idRep' => array('at' => 'id', 'cod' => 'first'),
  'iframe' => '',
  'iframeTitleNo' => '',
  'img' => array('at' =>
    array(0 => 'alt', 1 => 'title', 2 => 'longdesc'),
  ),
  'imgAltLong' => array('at' => 'alt'),
  'imgAltNo' => '',
  'imgAltNot' => array('at' => 'alt'),
  'imgAltNull' => array('at' => 'alt'),
  'inpImg' => array('at' => 'alt'),
  'inpImgAltNo' => '',
  'inputAltNo' => array('at' => 'alt'),
  'inputIdTitleNo' => '',
  'inputLabel' => array('cod' => 'label'),
  'inputLabelNo' => '',
  'justifiedTxt' => array('at' => 'align'),
  'label' => array('at' => 'for'),
  'labelForNo' => array('at' => 'for'),
  'labelPosNo' => '',
  'labelTextNo' => '',
  'langCodeNo' => array('cod' => 'first', 'at' =>
    array(0 => 'lang', 1 => 'xml:lang'),
  ),
  'langExtra' => array('cod' => 'first', 'at' =>
    array(0 => 'lang', 1 => 'xml:lang'),
  ),
  'langMatchNo' => array('cod' => 'first', 'at' =>
    array(0 => 'lang', 1 => 'xml:lang'),
  ),
  'langNo' => array('cod' => 'first', 'at' =>
    array(0 => 'lang', 1 => 'xml:lang'),
  ),
  'layoutAttr' => array('cod' => 'first', 'at' =>
    array(
      0 => 'align',
      1 => 'hspace',
      2 => 'vspace',
      3 => 'color',
      4 => 'face',
      5 => 'size',
      6 => 'text',
      7 => 'link',
      8 => 'alink',
      9 => 'vlink',
      10 => 'bgcolor',
      11 => 'background'),
  ),
  'layoutElem' => array('exc' => array(0 => 'center:first')),
  'liNoList' => '',
  'linkRel' => array('at' => 'rel', 'cod' => 'code'),
  'longDImg' => array('at' => 'longdesc'),
  'longDNo' => array('at' => 'longdesc'),
  'marquee' => '',
  'metaRedir' => array('cod' => 'code', 'at' => 'content'),
  'metaRefresh' => array('cod' => 'code', 'at' => 'content'),
  'newWinOnLoad' => array('cod' => 'first'),
  'object' => '',
  'objectAltNo' => '',
  'scopeNo' => array('at' => 'scope', 'cod' => 'code'),
  'table' => array('at' => 'summary'),
  'tableCaptionSummary' => array('at' => 'summary'),
  'tableComplex' => array('at' => 'summary'),
  'tableComplexError' => array('at' => 'summary'),
  'tableData' => array('at' => 'summary'),
  'tableDataCaption' => array('at' => 'summary'),
  'tableLayout' => array('at' => 'summary'),
  'tableLayoutCaption' => array('at' => 'summary'),
  'tableNested' => '',
  'titleChars' => array('cod' => 'code'),
  'titleLong' => array('cod' => 'code'),
  'titleNull' => array('cod' => 'code'),
  'titleSame' => array('cod' => 'code'),
  'titleVrs' => array('cod' => 'code'),
  'valueAbsHtml' => array('cod' => 'first'),
  'valueRelHtml' => array('cod' => 'first'),
);
        $tests = $test[$k];
        if (is_array($tests)) {
            $this->code = (isset($tests['cod']))? $tests['cod'] : '';
            $this->atts = (isset($tests['at']))? $tests['at'] : '';
            // Exception
            if (isset($tests['exc'])) {
                foreach ($tests['exc'] as $v) {
                    $e = explode(':', $v, 2);
                    $this->exce[$e[0]] = $e[1];
                }
            }
        }
    } // loadTestArray
} // class testSee
