<?php
class eXaminator {
	public $tot = array();
	public $nodes = array();
	private $stylesheet = '';
	private $events = array('onfocus', 'onblur', 'onkeypress', 'onkeydown', 'onkeyup', 'onsubmit',
		'onreset', 'onselect', 'onchange', 'onclick', 'ondblclick', 'onmousedown',
		'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout');
	private $pagetitle = '';
	private $filename = '';
	private $alttexts = array('img','image', 'spacer', 'space', 'picture', 'alt', 'alttext', 'imagen', 'imagem',
'foto', 'photo');
	private $ids = array();
	private $id_rep_array = array();
	private $fors = array();
	private $last_hx = 1;
	private $aname = array();
	private $links_meta = array('alternate', 'appendix', 'bookmark', 'chapter', 'contents', 'copyright', 'glossary', 'help', 'index', 'next', 'prev', 'section', 'start', 'subsection');
	private $acckeys = array();
	private $ahref = array();
	private $atext = array();
	private $lastag = '';
	private $langs = array();
	private $encodings = array();
	private $disc = array();
	private $tn = 0;
	private $tni = 0;
	private $elems = array('a','applet','area','blink','embed','form','frame','frameset','h1','html','iframe','img','label','marquee','object','table','title');

	function parserPage(&$info, &$pagecode, &$start) {
		$this->tot['info'] = $info;
		$this->tot['elems'] = array();
		if (!isset($info['size'])) { $this->tot['info']['size'] = strlen($pagecode); }
		if (!isset($info['hash'])) { $this->tot['info']['hash'] = md5($pagecode); }
		if (!isset($info['date'])) { $this->tot['info']['date'] = gmdate('Y-m-d H:i:s'); }
		if(substr($pagecode, 0,3) == pack("CCC",0xef,0xbb,0xbf)) {
			$pagecode=substr($pagecode, 3); // BOM
		}
		// Reiniciar variables
		$this->stylesheet = '';
		$this->pagetitle = '';
		$this->filename = '';
		$this->ids = array();
		$this->id_rep_array = array();
		$this->fors = array();
		$this->last_hx = 1;
		$this->aname = array();
		$this->acckeys = array();
		$this->ahref = array();
		$this->atext = array();
		$this->lastag = '';
		$this->langs = array();
		$this->encodings = array();
		$this->disc = array();
		$this->tn = 0;
		$this->tni = 0;
		$this->tot['info']['htmlTags'] = 0;
		// Get filename
		$this->parseURI($this->tot['info']['url']); // filename
		$lang = false;
		$xmlang = false;
		if (preg_match('@<(html[^>]+)>@ismU', $pagecode, $match)) {
			$lang = $this->check_attr('lang', $match[1]);
			$xmlang = $this->check_attr('xml:lang', $match[1]);
		}
		if ($lang && ($lang != '')) {
			$this->langs['html_lang'] = $lang;
			$le = explode('-', $lang);
			if (strlen(trim($le[0])) <> 2) {
				$this->tot['elems']['langCodeNo'] = $lang;
			}
		}
		if ($xmlang && ($xmlang != '')) {
			$this->langs['xml_lang'] = $xmlang;
			$xe = explode('-', $xmlang);
			if (strlen(trim($xe[0])) <> 2) {
				$this->tot['elems']['langCodeNo'] = $xmlang;
			}
		}
		// DTD
		$dtd = preg_match('@^\s*(<\?xml[^>]+>)*\s*<!DOCTYPE [^>]+>@ismU', $pagecode);
		if (!$dtd) {
			$this->tot['elems']['dtd'] = '-';
		}
		// Title
		if (preg_match('@<title[^>]*>([^<]*)</title>@ismU', $pagecode, $matchtit)) {
			$this->pagetitle = $this->cleanText($matchtit[1]);
		}
		// Define lang
		if (isset($this->langs['html_lang'])) {
			$this->tot['info']['lang'] = $this->langs['html_lang'];
		} else if (isset($this->langs['xml_lang'])) {
			$this->tot['info']['lang'] = $this->langs['xml_lang'];
		}
		// DOM
		$doc = new DOMDocument();
		@$doc->loadHTML($pagecode);
		$xpath = new DOMXPath($doc);
		
		// Get IDs
		$result = $xpath->query("//body//*[@id]");
		$repetidos = array();
		if ($result->length > 0) {
			// Para que el test sea aplicable
			$this->tot['elems']['id'] = $result->length;
		}

		foreach ($result as $node) {
			$i = trim($node->getAttribute('id'));
			if (in_array($i, $this->ids)) { // repetido
				$this->suma('idRep');
				$repetidos[] = $i;
			} else {
				$this->ids[] = $i;
			}
		}
		if (count($repetidos) > 0) {
			$this->id_rep_array = $repetidos;
		}
		// Get a name
		$resulta = $xpath->query("//body//a[@name]");
		foreach ($resulta as $nodea) {
			$this->aname[] = trim($nodea->getAttribute('name'));
		}
		// Get FOR
		$resultf = $xpath->query("//label[@for][normalize-space(@for)!='']");
		
		if ($resultf->length > 0) {
			foreach ($resultf as $nodef) {
				if (!in_array(trim($nodef->getAttribute('for')), $this->fors)) {
					$this->fors[] = trim($nodef->getAttribute('for'));
				}
			}
		}
		// Recorrer el DOM
		$this->dump_node($doc, $xpath);

		// ver encoding
		if (!isset($this->tot['info']['encoding'])) {
			if (isset($this->encodings['html_charset'])) {
				$this->tot['info']['encoding'] = strtolower($this->encodings['html_charset']);
			} else {
				if (isset($this->encodings['xml_charset'])) {
					$this->tot['info']['encoding'] = strtolower($this->encodings['xml_charset']);
				} else {
					$this->tot['info']['encoding'] = 'utf-8'; // default
				}
			}
		}
		//if (defined('VALIDATOR')) {
			if ((substr($info['url'], 0, 7) != 'file://') && ($info['url'] != 'input')) {
				$this->HtmlValidationUmic();
			}
		//}
		$this->Complete();
		if ($this->stylesheet != '') {
			$this->Check_CSS($this->stylesheet);
		}
		$this->ParseTot();
		$time = (microtime(true) - $start);
		$this->tot['info']['time'] = number_format($time, 2);
		return;
	} // parserPage

	function dump_node(&$node, &$xpath) {
		foreach ($node->childNodes as $child) {
			switch ($child->nodeType) {
				case XML_TEXT_NODE:
					if ($this->lastag == 'a') {
						if ($this->cleanText($child->nodeValue) != '') {
							$this->lastag = '';
						}
					}
					break;
				case XML_ELEMENT_NODE:
					//$this->suma($child->tagName);
					$this->tot['info']['htmlTags']++;
					if ($child->hasAttributes()) {
						foreach ($child->attributes as $att) {
							if (($att->name == 'id') && (trim($att->value) != '')) {
								$this->sumanode('id');
								if (in_array(trim($att->value), $this->id_rep_array)) {
									$this->sumanode('idRep', $child->getNodePath());
								}
								continue;
							} else if ($att->name == 'align') {
								$this->sumaplus('layoutAttr');
								if ($att->value == 'justify') {
									$this->sumaplus('justifiedTxt');
								}
								continue;
							} else if ($att->name == 'style') {
								$this->Parse_CSS('{'.$att->value.'}');
								continue;
							} else if ($att->name == 'accesskey') {
								$ak = trim($att->value);
								if (array_key_exists($ak, $this->acckeys)) {
									$this->sumaplus('acckeyRep', $child->getNodePath());
									$this->suma('acckeyRep'); // repite
									// Marcar el nodo repetido
									$this->sumanode('acckeyRep', $this->acckeys[$ak]);
								} else { // agregar
									$this->acckeys[$ak] = $child->getNodePath(); // accesskey = path
								}
								continue;
							}
							if (substr($att->name, 0, 2) == 'on') { // Eventos onclick, etc.
								$this->events($child, $xpath, $child->getNodePath());
								break;
							}
						} // foreach
					} // hasAttributes
					// Search br
					$bres = $xpath->query("./br", $child);
					if ($bres->length > 2) {
						//$this->suma('brSec');
						$this->brs($bres, $xpath, $child->getNodePath());
					}
					$this_function = $child->tagName;

					if (method_exists($this, $this_function)) {

						if (in_array($child->tagName, $this->elems)) {
							$this->suma($child->tagName);
						}
						$this->$this_function($child, $xpath);
					}
					$this->lastag = $child->tagName;
					$this->dump_node($child, $xpath); // loop
					break;
				case XML_DOCUMENT_TYPE_NODE:
					// Si existe $this->tot['dtd'] significa que no se encontró una DTD
					if (isset($this->tot['elems']['dtd'])) {
						unset($this->tot['elems']['dtd']);
					} else {
						preg_match("#\-\/\/W3C\/\/DTD([^\/]+)\/\/EN#i", $child->publicId, $dtd);
						if (isset($dtd[1])) {
							$publicid = trim($dtd[1]);
						} else {
							$publicid = $child->publicId;
						}
						$this->tot['elems']['dtd'] = $publicid;
					}
					break;
				case XML_PI_NODE:
					if ($child->target == 'xml') {
						if ($xml_decl = $this->check_attr('encoding', $child->data)) {
							$this->encodings['xml_charset'] = strtolower($xml_decl);
						}
					}
					break;
			} // switch
		} // foreach
	} // dump_node

	// FUNCIONES POR ELEMENTOS

	function a(&$node, &$xpath) {
		if ($node->hasAttribute('href')) {
			$this->sumanode('a');
			$href = trim($node->getAttribute('href'));
			$exp = explode('#', $href);
			if (isset($exp[1]) && (trim($exp[1]) != '')) {
				if (in_array(trim($exp[1]), $this->ids) || in_array(trim($exp[1]), $this->aname)) {
					$this->sumaplus('aSkip', $node->getNodePath());
					//$this->sumarray('anchors', trim($exp[1]));
					if ($this->tot['elems']['a'] == 1) { // First in page
						$this->tot['elems']['aSkipFirst'] = 1;
						$this->sumanode('aSkipFirst', $node->getNodePath());
					}
				}
			}
			$content = preg_replace('/\s+/', '', $this->cleanText($node->textContent, true)); // lower
			$alts = '';
			if ($content == '') { // Sin texto
				$img = $xpath->query(".//img", $node);
				if ($img->length > 0) { // Hay imagenes
					$alt = $xpath->query(".//img[@alt][normalize-space(@alt)!='']", $node);
					if ($alt->length == 0) { // Ni texto ni alt
						$this->sumaplus('aImgAltNo', $node->getNodePath());
					} else {
						foreach ($img as $i) {
							$alts .= preg_replace('/\s+/', '', $this->cleanText($i->getAttribute('alt'), true));
						}
					}
				}
			}
			$title = '';
			if ($node->hasAttribute('title') && (trim($node->getAttribute('title')) != '')) {
				$title = preg_replace('/\s+/', '', $this->cleanText($node->getAttribute('title'), true));
				if ($title == $content) {
					$this->sumaplus('aTitleMatch', $node->getNodePath());
				}
			}
			$aAbs = '';
			if (in_array($aAbs, $this->ahref)) {
				// Ya existe un enlace con igual href, ver el último
				$last = end($this->ahref);
				if ($aAbs == $last) { // El href es igual al último enlace
					if ($this->lastag == 'a') { // el último enlace es adyacente
						$this->sumaplus('aAdjacentSame', $node->getNodePath());
						$this->suma('aAdjacentSame'); // repite
						$lastkey = key($this->ahref);
						$this->sumanode('aAdjacentSame', $lastkey); // Incluir el primero
					}
				}
			}
			$content .= $title.$alts;
			if (in_array($content, $this->atext)) {
				$sametxt = array_keys($this->atext, $content); // Key de los enlaces con el mismo texto
				foreach ($sametxt as $k) {
					if ($this->ahref[$k] != $aAbs) {
						// Mismo texto, distintos href
						$this->sumaplus('aSameText', $node->getNodePath());
						if (strpos($this->nodes['aSameText'], (string)$k) === false) {
							$this->suma('aSameText');
							$this->sumanode('aSameText', $k);
						}
						break;
					}
				}
			}
			$xp = $node->getNodePath();
			$this->ahref[$xp] = $aAbs;
			$this->atext[$xp] = $content;
		} else {
			$this->resta('a');
		}
	} // a

	function abbr(&$node, &$xpath) {
		if ($node->hasAttribute('title')) {
			if (trim($node->getAttribute('title')) == '') {
				$this->sumaplus('abbrNo');
			} else {
				if (trim(strtolower($node->getAttribute('title'))) == $this->cleanText($node->textContent, true)) {
					$this->sumaplus('abbrNo', $node->getNodePath());
				}
			}
		} else {
			$this->sumaplus('abbrNo');
		}
	} // abbr

	function acronym(&$node, &$xpath) {
		if ($node->hasAttribute('title')) {
			if (trim($node->getAttribute('title')) == '') {
				$this->sumaplus('abbrNo');
			} else {
				if (trim(strtolower($node->getAttribute('title'))) == $this->cleanText($node->textContent, true)) {
					$this->sumaplus('abbrNo', $node->getNodePath());
				}
			}
		} else {
			$this->sumaplus('abbrNo');
		}
	} // acronym

	function alts(&$txt) {
		if (preg_match("@^[a-z0-9\-\_]+\.(jpg|gif|png|jpeg)$@i", $txt)) {
			return false;
		}
		$txt = preg_replace('|\s+|', ' ', $txt);
		$txt = strtolower($txt);
		// Ver si alt tiene textos sin significado
		if (in_array($txt, $this->alttexts)) { return false; }
		if ($txt == $this->filename) { return false; }
		return true;
	} // alt

	function applet(&$node, &$xpath) {
		$this->sumanode('applet');
		$alt = false;
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'hspace':
					case 'vspace':
						$this->sumaplus('layoutAttr');
						break;
					case 'alt':
						if (trim($node->getAttribute('alt')) != '') {
							$alt = true;
						}
						break;
				} // switch
			} // foreach
		}
		if ($this->cleanText($node->textContent) == '') {
			$img = $xpath->query(".//img[@alt][normalize-space(@alt)!='']", $node);
			if ($img->length == 0) {
				$this->sumaplus('appletAltNo', $node->getNodePath());
			}
		} else {
			if (!$alt) {
				$this->sumaplus('appletAltNo', $node->getNodePath());
			}
		}
	} // applet

	function area(&$node, &$xpath) {
		$this->sumanode('area');
		if (!$node->hasAttribute('alt') || (trim($node->getAttribute('alt')) == '')) {
			$this->sumaplus('areaAltNo');
		}
	} // area

	function b(&$node, &$xpath) {
		$this->sumaplus('fontHtml');
	} // b

	function basefont(&$node, &$xpath) {
		if ($node->hasAttributes()) {
			$this->sumaplus('fontHtml');
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'color':
					case 'face':
					case 'size':
						$this->sumaplus('layoutAttr');
						break;
				} // switch
			} // foreach
		}
	} // basefont

	function blink(&$node, &$xpath) {
		$this->sumanode('blink');
		$this->sumaplus('layoutElem');
	} // blink

	function body(&$node, &$xpath) {
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'text':
					case 'link':
					case 'alink':
					case 'vlink':
						$this->sumaplus('fontHtml');
						$this->sumaplus('layoutAttr');
						break;
					case 'bgcolor':
					case 'background':
						$this->sumaplus('layoutAttr');
						break;
					case 'onload':
						$onload = $node->getAttribute('onload');
						if ((strpos($onload, 'window.open') !== FALSE) || (strpos($onload, 'MM_openBrWindow') !== FALSE)) {
							$this->sumaplus('newWinOnLoad');
						}
				} // switch
			} // foreach
		}
	} // body

	function brs(&$node, &$xpath, $xp) {
		$x = '';
		foreach ($node as $n) {
			$child = $n->nextSibling;
			if (!isset($child)) { continue; }
			switch ($child->nodeType) {
				case XML_ELEMENT_NODE:
					if ($child->tagName=='img') {
						if ($x == '') {
							$x = 'img';
						} else {
							if ($x != 'img') {
								return;
							}
						}
					} else if ($child->tagName=='a') {
						if ($x == '') {
							$x = 'a';
						} else {
							if ($x != 'a') {
								return;
							}
						}
					} else {
						if ($x == '') {
							$x = $child->tagName;
						} else {
							if ($x != $child->tagName) {
								return;
							}
						}
					}
					break;
				case XML_TEXT_NODE:
					$txt = trim($child->nodeValue);
					if ($txt == '') { continue; }
					// Texto del enlace no cuenta
					if (($x == 'a') && ($child->parentNode->tagName == 'a')) { continue; }
					if ($txt[0] != '') {
						$t = (is_numeric($txt[0]))? 'num' : $txt[0];
						if ($x == '') {
							$x = $t;
						} else {
							if ($x != $t) {
								return;
							}
						}
					} else {
						return;
					}
					break;
			}
		} // foreach
		if ($x != '') {
			$this->sumaplus('brSec', $xp);
		}
	} // brs

	function center(&$node, &$xpath) {
		$this->sumaplus('layoutElem');
	} // center

	function cleanText($txt='', $lower=false) {
		$txt = str_ireplace("\xC2\xA0", " ", $txt);
		$txt = str_ireplace("&#13;", "\n", $txt);
		if (!$lower) {
			return trim($txt);
		} else {
			return trim(strtolower($txt));
		}
	} // cleanText

	function col(&$node, &$xpath) {
		if ($node->hasAttribute('width')) {
			$this->Check_Absolute_Values($node->getAttribute('width'), $node->getNodePath());
		}
	} // col

	function colgroup(&$node, &$xpath) {
		if ($node->hasAttribute('width')) {
			$this->Check_Absolute_Values($node->getAttribute('width'), $node->getNodePath());
		}
	} // colgroup

	function embed(&$node, &$xpath) {
		$this->sumanode('embed');
		$alt = false;
		$noembed = false;
		$noembeds = $xpath->query(".//noembed", $node);
		if ($noembeds->length > 0) {
			$noembed = $noembeds->item(0);
		} else {
			$next = $this->getNextSibling($node);
			if ($next->tagName == 'noembed') {
				$noembed = $next;
			}
		}
		if ($noembed) {
			if ($this->cleanText($noembed->textContent) != '') {
				$alt = true;
			} else {
				$img = $xpath->query(".//img[@alt][normalize-space(@alt)!='']", $noembed);
				if ($img->length > 0) {
					$alt = true;
				}
			}
		}
		if (!$alt) {
			$this->sumaplus('embedAltNo', $node->getNodePath());
		}
	} // embed

	function events(&$node, &$xpath, $xp) {
		$on = array();
		foreach ($node->attributes as $att) {
			if (in_array($att->name, $this->events) && (trim($att->value) != '')) {
				$txt = preg_replace('/\s+/', '', trim(strtolower($att->value)));
				$on[$att->name] = $txt; // Ejemplo: $on[onclick] = windows.open...
				if ($att->name == 'onfocus') {
					if (strpos($txt, '.blur') !== false) {
						$this->sumaplus('focusBlur', $xp);
					}
				}
			}
		}
		$elem = $node->tagName;
		if (count($on) > 0) {
			$this->sumaplus('ehandler', $xp);
			$this->Check_Events($on, $elem, $xp);
			if (($elem != 'a') && ($elem != 'button') && ($elem != 'input') &&
			($elem != 'select') && ($elem != 'textarea') && ($elem != 'form')) {
				$this->sumaplus('ehandTagNo', $xp);
			}
		}
	} // events

	function fieldset(&$node, &$xpath) {
		$legend = $xpath->query("./legend[normalize-space(.)!='']", $node);
		if ($legend->length == 0) {
			$this->sumaplus('fieldLegNo');
		}
		$ancestor = $xpath->query("ancestor::form", $node);
		if ($ancestor->length == 0) {
			$this->sumaplus('fieldNoForm');
		}
	} // fieldset

	function form(&$node, &$xpath) {
		$this->sumanode('form');
		$submit = $xpath->query(".//input[@type='submit' or @type='image']|.//button[@type='submit']", $node);
		if ($submit->length == 0) {
			$this->sumaplus('formSubmitNo');
		}
	} // area

	function font(&$node, &$xpath) {
		if ($node->hasAttributes()) {
			$this->sumaplus('fontHtml');
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'color':
					case 'face':
					case 'size':
						$this->sumaplus('layoutAttr');
						break;
				} // switch
			} // foreach
		}
	} // font

	function frame(&$node, &$xpath) {
		if ($node->hasAttribute('src')) {
			$this->sumanode('frame');
			$src = $node->getAttribute('src');
			if (!$node->hasAttribute('title') || (trim($node->getAttribute('title')) == '')) {
				$this->sumaplus('frameTitleNo');
			}
		} else {
			$this->resta('frame');
		}
	} // frame

	function frameset(&$node, &$xpath) {
		$this->sumanode('frameset');
		if ($node->hasAttribute('cols')) {
			$this->Check_Absolute_Values($node->getAttribute('cols'), $node->getNodePath());
		}
		// Check Frameset DTD
		if (isset($this->tot['elems']['dtd'])) {
			if (stripos($this->tot['elems']['dtd'], 'frameset') === false) {
				$this->tot['elems']['frameDtdNo'] = 1;
				if ($this->tot['elems']['frameset'] == 1) {
					$this->sumanode('frameDtdNo', $node->getNodePath()); // See: mostrar el primer frameset
				}
			}
		}
	} // frameset

	function h1(&$node, &$xpath) {
		$this->hx($node, $xpath, 1);
	} // h1
	function h2(&$node, &$xpath) {
		$this->hx($node, $xpath, 2);
	} // h2
	function h3(&$node, &$xpath) {
		$this->hx($node, $xpath, 3);
	} // h3
	function h4(&$node, &$xpath) {
		$this->hx($node, $xpath, 4);
	} // h4
	function h5(&$node, &$xpath) {
		$this->hx($node, $xpath, 5);
	} // h5
	function h6(&$node, &$xpath) {
		$this->hx($node, $xpath, 6);
	} // h6

	function html(&$node, &$xpath) {
		if ($this->tot['elems']['html'] == 1) {
			$this->sumanode('html');
			if (isset($this->tot['elems']['langCodeNo'])) {
				$this->sumanode('langCodeNo', $node->getNodePath());
			}
		}
	} // title

	function hx(&$node, &$xpath, $h) {
		if ($this->cleanText($node->textContent) != '') {
			$this->sumaplus('hx');
		} else {
			$img = $xpath->query(".//img", $node);
			if ($img->length > 0) { // Hay imagenes
				$this->sumaplus('hx');
				$alt = $xpath->query(".//img[@alt][normalize-space(@alt)!='']", $node);
				if ($alt->length == 0) { // Ni texto ni alt
					$this->sumaplus('hxNo', $node->getNodePath());
				}
			} else { // No hay imagenes ni texto
				$this->resta('h'.$h);
				$h =  0;
			}
		}
		if ($h > 0) {
			if ($this->last_hx < $h) {
				$dif = ($h - $this->last_hx);
				if ($dif > 1) {
					$this->sumaplus('hxSkip', $node->getNodePath());
				}
			}
			$this->last_hx = $h;
		}
	} // hx

	function i(&$node, &$xpath) {
		$this->sumaplus('fontHtml');
	} // i

	function iframe(&$node, &$xpath) {
		if ($node->hasAttribute('src')) {
			$this->sumanode('iframe');
			$src = $node->getAttribute('src');
			if (!$node->hasAttribute('title') || (trim($node->getAttribute('title')) == '')) {
				$this->sumaplus('iframeTitleNo');
			}
			if ($node->hasAttribute('width')) {
				$this->Check_Absolute_Values($node->getAttribute('width'), $node->getNodePath());
			}
		} else {
			$this->resta('iframe');
		}
	} // iframe

	function img(&$node, &$xpath) {
		$this->sumanode('img');
		if ($node->hasAttribute('alt')) {
			$alt = preg_replace('/\s+/', '', $this->cleanText($node->getAttribute('alt')));
			if ($alt == '') {
				$this->sumaplus('imgAltNull');
			} else {
				if (!$this->alts($alt)) {
					$this->sumaplus('imgAltNot', $node->getNodePath()); // texto de relleno
				}
				if (strlen($alt) > 100) {
					$this->sumaplus('imgAltLong', $node->getNodePath());
				}
			}
		} else {
			$this->sumaplus('imgAltNo');
		}
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'hspace':
					case 'vspace':
						$this->sumaplus('layoutAttr');
						break;
					case 'longdesc':
						$this->sumaplus('longDImg');
						$long = strtolower(trim($node->getAttribute('longdesc')));
						if ((strpos($long, ' ') !== false) || ($long == '#') || ($long == '')) {
							$this->sumaplus('longDNo');
						}
						break;
				} // switch
			} // foreach
		}
	} // img

	function input(&$node, &$xpath) {
		$need_label = false;
		if ($node->hasAttribute('type')) {
			switch ($node->getAttribute('type')) {
				case 'image':
					$this->sumaplus('inpImg');
					if (!$node->hasAttribute('alt') || (trim($node->getAttribute('alt')) == '')) {
						$this->sumaplus('inpImgAltNo');
					}
					break;
				case 'checkbox':
				case 'file':
				case 'password':
				case 'radio':
				case 'text':
					if ($node->hasAttribute('alt') && (trim($node->getAttribute('alt')) != '')) {
						$this->sumaplus('inputAltNo');
					}
					$need_label = true;
				break;
			} // switch
		}
		if ($need_label) {
			$this->Check_Inputs($node, $xpath, $node->getNodePath());
		}
	} // input

	function label(&$node, &$xpath) {
		$this->sumanode('label');
		if (!$node->hasAttribute('for') || (trim($node->getAttribute('for')) == '')) {
			$this->sumaplus('labelForNo');
		}
		// All childs
		$childs = $xpath->query("./*|text()", $node);
		if ($childs->length > 0) {
			$txtbefore = false;
			$txtafter = false;
			$elebefore = false;
			$eleafter = false;
			foreach ($childs as $child) {
				switch ($child->nodeType) {
					case XML_ELEMENT_NODE:
						$tag = $child->tagName;
						if (($tag=='select') || ($tag=='textarea')) {
							$elebefore = true;
						} else if ($tag=='input') {
							$type = $child->getAttribute('type');
							if (($type=='checkbox') || ($type=='radio')) {
								$eleafter = true;
							} else if (($type=='file') || ($type=='password') || ($type=='text')) {
								$elebefore = true;
							}
						} else {
							if ($this->cleanText($child->textContent) != '') {
								if (!$elebefore && !$eleafter) {
									$txtbefore = true;
								} else {
									$txtafter = true;
								}
							}
						}
						break;
					case XML_TEXT_NODE:
						if ($this->cleanText($child->nodeValue) != '') {
							if (!$elebefore && !$eleafter) {
								$txtbefore = true;
							} else {
								$txtafter = true;
							}
						}
						break;
				}
			}
			// Label position
			if ($elebefore && $txtafter) {
				$this->sumaplus('labelPosNo', $node->getNodePath());
			} else if ($eleafter && $txtbefore) {
				$this->sumaplus('labelPosNo', $node->getNodePath());
			}
			if (!$txtbefore && !$txtafter) {
				$this->sumaplus('labelTextNo');
			}
		}
	} // label

	function li(&$node, &$xpath) {
		if (($node->parentNode->tagName != 'ol') && ($node->parentNode->tagName != 'ul')) {
			$this->sumaplus('liNoList');
		}
	} // li

	function link(&$node, &$xpath) {
		if (!$node->hasAttribute('href')) {
			return;
		}
		if ($node->hasAttribute('rel')) {
			if (in_array(strtolower($node->getAttribute('rel')), $this->links_meta)) {
				$this->sumaplus('linkRel');
			}
		} // rel
		if ($node->hasAttribute('rev')) {
			if (in_array(strtolower($node->getAttribute('rev')), $this->links_meta)) {
				$this->sumaplus('linkRel');
			}
		}
	} // link

	function marquee(&$node, &$xpath) {
		if ($this->cleanText($node->textContent) == '') { // Sin texto
			$img = $xpath->query(".//img", $node);
			if ($img->length == 0) { // Sin imagenes
				$this->resta('marquee');
			} else {
				$this->sumanode('marquee');
			}
		} else {
			$this->sumanode('marquee');
		}
	} // marquee

	function meta(&$node, &$xpath) {
		if ($node->hasAttribute('charset')) {
			if (!isset($this->encodings['html_charset'])) {
				$this->encodings['html_charset'] = trim(strtolower($node->getAttribute('charset')));
			}
		}
		if ($node->hasAttribute('http-equiv')) {
			$httpequiv = strtolower($node->getAttribute('http-equiv'));
			if ($httpequiv == 'content-type') {
				if (!isset($this->encodings['html_charset'])) {
					if (preg_match("@charset[\s]*=(.*)@i", $node->getAttribute('content'), $chr)) {
						$this->encodings['html_charset'] = trim($chr[1]);
					}
				}
			}
			if ($httpequiv == 'refresh') {
				$content = $node->getAttribute('content');
				$delay = false;
				if (preg_match("@^(\d+)@i", $content, $time)) {
					if ($time[1] > 0) {
						$delay = true;
					}
				}
				if (preg_match("@url\=(.*)@i", $content)) {
					$this->sumaplus('metaRedir');
				} else {
					if ($delay) {
						$this->sumaplus('metaRefresh');
					}
				}
			}
		}
	} // meta

	function object(&$node, &$xpath) {
		$this->sumanode('object');
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'hspace':
					case 'vspace':
						$this->sumaplus('layoutAttr');
						break;
				} // switch
			} // foreach
		}
		if (trim($node->textContent) == '') {
			$img = $xpath->query(".//img[@alt][normalize-space(@alt)!='']", $node);
			if ($img->length == 0) {
				$this->sumaplus('objectAltNo', $node->getNodePath());
			}
		}
	} // object

	function parseURI(&$url) {
		// Busca el nombre del archivo en la URI para controlar textos en title y alt
		$purl = parse_url($url);
		if (isset($purl['path']) && ($purl['path'] != '/')) {
			$path = explode('/', $purl['path']);
			$end = array_pop($path);
			if (($end != '') && preg_match('@\.@', $end)) {
				$this->filename = strtolower($end);
			}
		}
	} // parseURI

	function select(&$node, &$xpath) {
		$this->Check_Inputs($node, $xpath, $node->getNodePath());
	} // select

	function s(&$node, &$xpath) {
		$this->sumaplus('fontHtml');
	} // strike

	function strike(&$node, &$xpath) {
		$this->sumaplus('fontHtml');
	} // strike

	function style(&$node, &$xpath) {
		$this->Parse_CSS($node->textContent);
	} // style

	function table(&$node, &$xpath) {
		$this->sumanode('table');
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'bgcolor':
						$this->sumaplus('layoutAttr');
						break;
				} // switch
			} // foreach
		}
		// Se usa un clon para quitar tablas anidadas
		// (las operaciones en $node afectan todo el documento)
		$clone = @$node->cloneNode(true);
		$this->table_parser($clone, $xpath, $node->getNodePath());
	} // table

	function table_parser(&$clone, &$xpath, $xp) {
		//$childs = $xpath->query(".//table/descendant::table", $clone);
		$childs = $clone->getElementsByTagName('table');
		if ($childs->length > 0) {
			$this->sumaplus('tableNested');
			foreach ($childs as $child) {
				$child->parentNode->removeChild($child);
			}
		}
		$xcaption = $xpath->query(".//caption[normalize-space(.)!='']", $clone);
		$caption = ($xcaption->length > 0)? $xcaption->item(0)->nodeValue : false;
		if ($clone->hasAttribute('summary') && (trim($clone->getAttribute('summary')) != '')) {
			$summary = trim($clone->getAttribute('summary'));
		} else {
			$summary = false;
		}
		if (($caption && $summary) && ($caption == $summary)) {
			$this->sumaplus('tableCaptionSummary', $xp);
		}
		$headers = $xpath->query(".//th|.//td[@scope]", $clone);
		if ($headers->length > 0) { // Tabla de datos (con encabezados)
			$this->sumaplus('tableData');
			if (!$caption && !$summary) {
				$this->sumaplus('tableDataCaption');
			}

		} else { // Tabla sin encabezados
			$this->sumaplus('tableLayout');
			if ($caption || $summary) {
				$this->sumaplus('tableLayoutCaption');
			}
		}
		//$countr = $xpath->query("//*[count(tr[th]) > 1] | //*[count(tr[td[@scope]]) > 1]", $clone);
		//if ($countr->length > 0) {
		$countr = $xpath->query(".//tr[th] | .//tr[td[@scope]]", $clone);
		if ($countr->length > 1) {
			// Varios TR con TH
			// Ver si hay TR con varios TH
			$counth = $xpath->query("(.//tr[count(th) > 1] | .//tr[count(td[@scope]) > 1])", $clone);
			if ($counth->length > 0) {
				$this->sumaplus('tableComplex', $xp);
				// Buscar TD sin headers
				$countd = $xpath->query(".//td[not(@headers) or normalize-space(@headers)='']", $clone);
				if ($countd->length > 0) {
					$this->sumaplus('tableComplexError', $xp);
				}
			}
		}
	} // table_parser

	function td(&$node, &$xpath) {
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'bgcolor':
						$this->sumaplus('layoutAttr');
						break;
					case 'width':
						$this->Check_Absolute_Values($attr->value, $node->getNodePath());
						break;
					case 'scope':
						$s = $this->cleanText($attr->value, true); // strtolower
						if (($s != 'row') && ($s != 'col') && ($s != 'rowgroup') && ($s != 'colgroup')) {
							$this->sumaplus('scopeNo', $node->getNodePath());
						}
						break;
				} // switch
			} // foreach
		}
	} // td

	function textarea(&$node, &$xpath) {
		$this->Check_Inputs($node, $xpath, $node->getNodePath());
	} // textarea

	function th(&$node, &$xpath) {
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'bgcolor':
						$this->sumaplus('layoutAttr');
						break;
					case 'width':
						$this->Check_Absolute_Values($attr->value, $node->getNodePath());
						break;
					case 'scope':
						$s = $this->cleanText($attr->value, true); // strtolower
						if (($s != 'row') && ($s != 'col') && ($s != 'rowgroup') && ($s != 'colgroup')) {
							$this->sumaplus('scopeNo', $node->getNodePath());
						}
						break;
				} // switch
			} // foreach
		}
	} // th

	function title(&$node, &$xpath) {
		if ($node->parentNode->tagName == 'head') {
			if ($this->tot['elems']['title'] == 1) {
				$this->sumanode('title');
				$this->sumanode('titleVrs'); // Por si existe más de 1 title
				$this->sumanode('titleSame'); // Para usar en el futuro
				$this->tot['info']['title'] = $this->pagetitle;
			} else {
				$this->sumanode('titleVrs');
			}
		} else {
			$this->resta('title');
		}
	} // title

	function tr(&$node, &$xpath) {
		if ($node->hasAttributes()) {
			foreach ($node->attributes as $attr) {
				switch ($attr->name) {
					case 'bgcolor':
						$this->sumaplus('layoutAttr');
						break;
				} // switch
			} // foreach
		}
	} // tr

	function u(&$node, &$xpath) {
		$this->sumaplus('fontHtml');
	} // u

	/* /////////////////////////////////////////////////// */

	function sumaplus($esto, $i='') {
		$this->suma($esto);
		$this->sumanode($esto, $i);
	} // sumaplus

	function suma($esto) {
		if (isset($this->tot['elems'][$esto])) {
			$this->tot['elems'][$esto]++;
		} else {
			$this->tot['elems'][$esto] = 1;
		}
		return;
	} // suma

	function sumarray($x, $val) {
		if (isset($this->tot['elems'][$x])) {
			if (!in_array($val, $this->tot['elems'][$x])) {
				$this->tot['elems'][$x][] = $val;
			}
		} else {
			$this->tot['elems'][$x] = array($val);
		}
	} // suma

	function sumanode($x, $i='') {
		// $i = xpath
		if ($i != '') {
			if (isset($this->nodes[$x])) {
				$this->nodes[$x] .= '|'.$i;
			} else {
				$this->nodes[$x] = $i;
			}
		}
		return;
	} // sumanode

	function resta($esto) {
		if (isset($this->tot['elems'][$esto])) {
			if ($this->tot['elems'][$esto] > 1) {
				$this->tot['elems'][$esto]--;
			} else {
				unset($this->tot['elems'][$esto]);
			}
		}
		return;
	} // suma

	function Check_Inputs(&$node, &$xpath, $xp) {
		$this->sumaplus('inputLabel');
		$title = ($node->hasAttribute('title') && (trim($node->getAttribute('title')) != ''))? true : false;
		$id = ($node->hasAttribute('id') && (trim($node->getAttribute('id')) != ''))? trim($node->getAttribute('id')) : false;
		$label = (isset($id) && in_array($id, $this->fors))? true : false;
		if (!$label) {
			$this->sumaplus('inputLabelNo', $xp);
			if (!$title) {
				// Ver si el control que sigue puede servir de label
				$ok = false;
				$next = $this->getNextSibling($node);
				if (($next->tagName == 'input') || ($next->tagName == 'button')) {
					$type = trim($next->getAttribute('type'));
					if ($type == 'submit') {
						if ($next->hasAttribute('value') && (trim($next->getAttribute('value')) != '')) {
							$ok = true;
						}
					} else if ($type == 'image') {
						if ($next->hasAttribute('alt') && (trim($next->getAttribute('alt')) != '')) {
							$ok = true;
						}
					}
				}
				if (!$ok) {
					$this->sumaplus('inputIdTitleNo', $xp);
				}
			}
		}
	} // Check_Inputs

	function getNextSibling($node) {
		if (!is_null($node->nextSibling) && ($x = $node->nextSibling)) {
			while ($x->nodeType != XML_ELEMENT_NODE) {
				if (is_null($x->nextSibling)) {
					return $node;
				}
				$x = $x->nextSibling;
			}
			return $x;
		}
		return $node;
	} // getNextSibling

	function Complete() {
		// Lang
		$dtd = (isset($this->tot['elems']['dtd']))? $this->tot['elems']['dtd'] : '';
		if (stripos($dtd, 'xhtml') !== false) {
			if ((stripos($dtd, '1.1') !== false) || (stripos($dtd, '+') !== false)) {
				if (isset($this->langs['xml_lang'])) {
					if (isset($this->langs['html_lang'])) {
						$this->tot['elems']['langExtra'] = 'lang';
					}
				} else {
					$this->tot['elems']['langNo'] = 'xml:lang';
				}
			} else {
				if (isset($this->langs['xml_lang']) && isset($this->langs['html_lang'])) {
					if (strtolower($this->langs['xml_lang']) != strtolower($this->langs['html_lang'])) {
						$this->suma('langMatchNo');
					}
				} else {
					if (!isset($this->langs['xml_lang'])) {
						$this->tot['elems']['langNo'] = 'xml:lang';
					} else if (!isset($this->langs['html_lang'])) {
						$this->tot['elems']['langNo'] = 'lang';
					}
				}
			}
		} else {
			// Se considera HTML aunque no exista una DTD
			if (isset($this->langs['html_lang'])) {
				if (isset($this->langs['xml_lang'])) {
					$this->tot['elems']['langExtra'] = 'xml:lang';
				}
			} else {
				$this->tot['elems']['langNo'] = 'lang';
			}
		}
		if (isset($this->tot['info']['lang'])) {
			$this->tot['elems']['lang'] = 1;
		}
		// Title
		if (!isset($this->tot['info']['title'])) { // Falta title
			$this->tot['elems']['titleNo'] = '0';
			$this->tot['info']['title'] = '';
		} else {
			$titles = $this->tot['elems']['title'];
			if ($titles == 1) {
				$title = $this->tot['info']['title'];
				if (!preg_match('|[a-z]+|i', $title)) { // Debe tener texto
					$title = '';
				}
				if ($title == '') { // Vacío
					$this->tot['elems']['titleNull'] = 1;
				} else {
					$title = preg_replace('|\s+|', ' ', $title);
					$title = strtolower($title);
					// Ver si title tiene textos sin significado
					$titletexts = array('untitled', 'untitleddocument', 'notitle', 'title',
					'untitledpage', 'page', 'newpage', $this->filename);
					if (in_array($title, $titletexts)) {
						$this->tot['elems']['titleNull'] = 1;
					}
					try {
						$titlelen = @mb_strlen($title, $this->tot['info']['encoding']);
					} catch (Exception $e) {
						$titlelen = strlen(utf8_decode($title));
					}
					if ($titlelen > 64) {
						$this->tot['elems']['titleLong'] = $titlelen;
					}
					if (preg_match('@([[:punct:]]{4,})@iU', $title, $titchars)) {
						$this->tot['elems']['titleChars'] = $titchars[1];
					}
					if (!isset($this->tot['elems']['titleLong']) && !isset($this->tot['elems']['titleChars'])) {
						$this->tot['elems']['titleOk'] = 1;
					}
				}
			} else if ($titles > 1) {
				$this->tot['elems']['titleVrs'] = $titles;
			}
			if ($this->tot['info']['encoding'] != 'utf-8') {
				$this->tot['info']['title'] = utf8_encode($this->tot['info']['title']);
			}
		}
		// Event handlers
		if (isset($this->tot['elems']['ehandBothNo']) || isset($this->tot['elems']['ehandMouse'])) {
			// Hay errores, no se consideran los casos correctos
			if (isset($this->tot['elems']['ehandBoth'])) {
				unset($this->tot['elems']['ehandBoth']);
			}
		}
		// Absolute values HTML
		if (isset($this->tot['elems']['valueAbsHtml'])) {
			if (isset($this->tot['elems']['valueRelHtml'])) {
				unset($this->tot['elems']['valueRelHtml']); // sin premio
			}
		}
		// Absolute values CSS
		if (isset($this->tot['elems']['valueAbsCss']) || isset($this->tot['elems']['layoutFixed'])) {
			if (isset($this->tot['elems']['valueRelCss'])) {
				unset($this->tot['elems']['valueRelCss']); // sin premio
			}
		}
	} // Complete

	// CSS
	function Parse_CSS($css, $base='') {
		$search = array (
		"|@import\s+\S+\s+print\s?;|ism",
		"/@media\s+(print|aural)\s?\{(.*)\}/ism",
		"@\/\*[^*]*\*+([^/*][^*]*\*+)*\/@smU"
		);
		$replace_css = preg_replace($search, "", $css);
		$this->stylesheet .= $replace_css;
	} // Parse_CSS

	function Check_Events(&$event, &$ele, $xp) {
		$e_mouse = array('onmousedown', 'onmouseup', 'onmouseout', 'onmouseover');
		$e_keyb = array('onkeydown', 'onkeyup', 'onblur', 'onfocus');
		$eh_both_no = false;
		foreach ($event as $k => $v) {
			if (($k == 'ondblclick') || ($k == 'onmousemove')) {
				$this->sumaplus('ehandMouse', $xp);
				break;
			}
			if (in_array($k, $e_mouse)) {
				for ($x = 0; $x < 4; $x++) {
					if ($e_mouse[$x] == $k) { // Ej: onclick
						if (array_key_exists($e_keyb[$x], $event)) { // $event[onkeypress]
							if ($event[$e_keyb[$x]] == $event[$k]) { // $on[onkeypress] == $on[onclick]
								$this->sumaplus('ehandBoth', $xp);
							} else {
								$eh_both_no = true;
							}
							unset($event[$e_keyb[$x]]);
						} else {
							$eh_both_no = true;
						}
						unset($event[$k]);
					}
				} // for
			} // if
		} // foreach
		if ($eh_both_no) {
			$this->sumaplus('ehandBothNo', $xp);
		}
		// Final: si existe ehandBothNo, no se considera ehandBoth
	} // Check_Events

	function Check_Absolute_Values($value, $xp) {
		$value = trim($value);
		if (stristr($value, ',')) { // valores separados por comas
			$list = explode(',', $value);
			$abs = false;
			$rel = false;
			foreach ($list as $val) {
				$val = trim($val);
				$last_char = substr($val, -1, 1);
				if (($last_char == '%') || ($last_char == '*')) {
					$rel = true;
				} else {
					$abs = true;
				}
			}
			if ($abs) {
				$this->sumaplus('valueAbsHtml', $xp);
			} else if ($rel) {
				$this->sumaplus('valueRelHtml', $xp);
			}
		} else {
			if ($value != '') {
				$last_char = substr($value, -1, 1);
				if (($last_char == '%') || ($last_char == '*')) {
					$this->sumaplus('valueRelHtml', $xp);
				} else {
					$this->sumaplus('valueAbsHtml', $xp);
				}
			}
		}
	} // Check_Absolute_Values

	function Check_CSS(&$css) {
		preg_match_all("/\{(.*)\}/smU", $css, $blocks);
		$this->tot['info']['cssRules'] = count($blocks[0]);
		for ($i=0; $i < count($blocks[0]); $i++) {
			if (trim($blocks[1][$i]) != '') {
				// { something }
				$color = false;
				$bgcolor = false;
				$colorval = false;
				$bgval = false;
				$rulea = '';
				$ruleb = '';
				$rules = explode(';', $blocks[1][$i]);
				foreach ($rules as $r) {
					// property : value
					if (strpos($r, ':') !== false) {
						list($a, $b) = explode(":", $r, 2);
						$a = strtolower(trim($a));
						$b = strtolower(trim($b));
						if (($a == 'text-align') && ($b == 'justify')) {
							$this->suma('justifiedCss');
						}
						if (($a == 'font') || ($a == 'font-size')) {
							$this->suma('fontValues');
							if (preg_match("@[0-9]+(cm|mm|in|pt|pc|px)@i", $b)) {
								$this->suma('fontAbsVal');
							}
						}
						if (strpos($a, 'width') !== false) {
							if (preg_match("@[0-9\.]+(cm|mm|in|pt|pc)@i", $b)) {
								$this->suma('valueAbsCss');
							} else if (preg_match("@([0-9\.]+)px@i", $b, $ou)) {
								if (($a == 'width') || ($a == 'min-width')) {
									if ($ou[1] > 120) {
										$this->suma('layoutFixed');
									}
								}
							} else if (preg_match("@[0-9\.]+(%|em|ex)@i", $b)) {
								$this->suma('valueRelCss');
							}
						}
						if ($a == 'line-height') {
							if (preg_match("@([0-9\.]+)(cm|mm|in|pt|pc|px|%|em|ex)+@i", $b, $out)) {
								if (($out[2]=='%') || ($out[2]=='em') || ($out[2]=='ex')) {
									if ($out[1] < 1.5) {
										$this->suma('lineHeightNo');
									}
								}
							}
						}
						if (($a == 'text-decoration') && ($b == 'blink')) {
							$this->suma('cssBlink');
						}
						if ($a == 'color') {
							$color = true;
							if (preg_match("@(\#[0-9A-F]{1,6}|Black|Maroon|Green|Olive|Navy|Purple|Teal|Silver|Gray|Red|Lime|Yellow|Blue|Fuchsia|Aqua|White)@ism", $b, $cc1)) {
								$colorval = strtoupper($cc1[1]);
								$rulea = trim($r);
							}
						}
						if (($a == 'background') || ($a == 'background-color')) {
							$bgcolor = true;
							$b = preg_replace('|\([^\)]+\)|smU', '', $b);
							if (preg_match("@(\#[0-9A-F]{1,6}|Black|Maroon|Green|Olive|Navy|Purple|Teal|Silver|Gray|Red|Lime|Yellow|Blue|Fuchsia|Aqua|White)@ism", $b, $cc2)) {
								$bgval = strtoupper($cc2[1]);
								$ruleb = trim($r);
							}
						}
					}
				}
				if ($color && !$bgcolor) { $this->suma('colorFgBgNo'); }
				if ($bgcolor && !$color) { $this->suma('colorFgBgNo'); }
				if ($colorval && $bgval) {
					$c1 = $this->colorsHexDec($colorval);
					$c2 = $this->colorsHexDec($bgval);
					if ($c1 && $c2) {
						$L1 = $this->getLuminance($c1);
						$L2 = $this->getLuminance($c2);
						if ($L1 > $L2) {
							$dif = ($L1+0.05) / ($L2+0.05);
						} else {
							$dif = ($L2+0.05) / ($L1+0.05);
						}
						if ($dif <= 3) {
							$dif = number_format($dif, 1);
							$aa = '('.$colorval.' / '.$bgval.') = '.$dif.':1';
							$this->suma('colorContrast');
							if (isset($this->tot['elems']['color_array'])) {
								$this->tot['elems']['color_array'][] = array('a'=>$aa, 'b'=>$ruleb, 'c'=>$rulea);
							} else {
								$this->tot['elems']['color_array'] = array(0=>array('a'=>$aa, 'b'=>$ruleb, 'c'=>$rulea));
							}
						}
					}
				}
			}
		}
	} // Check_CSS

	function colorsHexDec($c) {
		$c = trim($c, '#');
		$ret = array();
		if (preg_match("@[0-9A-F]{3,6}@i", $c)) {
			if (strlen($c) == 6) {
				$ret['r'] = hexdec(substr($c, 0, 2));
				$ret['g'] = hexdec(substr($c, 2, 2));
				$ret['b'] = hexdec(substr($c, 4, 2));
				return $ret;
			} else if (strlen($c) == 3) {
				$r = substr($c, 0, 1);
				$g = substr($c, 1, 1);
				$b = substr($c, 2, 1);
				$ret['r'] = hexdec($r.$r);
				$ret['g'] = hexdec($g.$g);
				$ret['b'] = hexdec($b.$b);
				return $ret;
			} else {
				return false;
			}
		} else {
			$search = array ("@BLACK@i", "@WHITE@i", "@MAROON@i", "@GREEN@i", "@OLIVE@i", "@NAVY@i", "@PURPLE@i",
			"@TEAL@i", "@SILVER@i", "@GRAY@i", "@RED@i", "@LIME@i", "@YELLOW@i", "@BLUE@i", "@FUCHSIA@i", "@AQUA@i");
			$replace = array ("000000", "FFFFFF", "800000", "008000", "808000", "000080", "800080", "008080", "C0C0C0",
			"808080", "FF0000", "00FF00", "FFFF00", "0000FF", "FF00FF", "00FFFF");
			$c = preg_replace($search,$replace,$c);
			if (preg_match("@[0-9A-F]{6}@i", $c)) {
				$ret['r'] = hexdec(substr($c, 0, 2));
				$ret['g'] = hexdec(substr($c, 2, 2));
				$ret['b'] = hexdec(substr($c, 4, 2));
				return $ret;
			} else {
				return false;
			}
		}
	} // colorsHexDec

	function getLuminance($c) {
		$r = 0;
		$g = 0;
		$b = 0;
		foreach ($c as $k => $v) {
			$x = ($v / 255);
			if ($x <= 0.03928) {
				$$k = ($x / 12.92);
			} else {
				$$k = pow((($x+0.055)/1.055), 2.4);
			}
		}
		$lum = 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
		return number_format($lum, 5);
	} // getLuminance

	function ParseTot() {
		$tests = testList();
		$this->disc = array(
			0=>array('d'=>'ubli','p'=>0,'r'=>0,'t'=>0),
			1=>array('d'=>'ulow','p'=>0,'r'=>0,'t'=>0),
			2=>array('d'=>'uphy','p'=>0,'r'=>0,'t'=>0),
			3=>array('d'=>'ucog','p'=>0,'r'=>0,'t'=>0),
			4=>array('d'=>'uage','p'=>0,'r'=>0,'t'=>0)
		);
		$this->tn = count($this->disc);
		$this->tni = ($this->tn - 1); // para for
		$frames_exclude_tests = array('a_01b', 'a_02a', 'hx_01a', 'layout_01a', 'layout_02a');
		$css_tests = array('color_02', 'color_01', 'blink_02', 'font_02', 'justif_txt_02', 'layout_03', 'css_01', 'values_02a', 'values_02b');
		// Para ordenar los resultados
		$p = array();
		$s = array();
		$pon = 0; $rel = 0; // score
		$this->tot['info']['score'] = 0;
		$this->tot['info']['tests'] = 0;
		$this->tot['results'] = array();
		$conformerror = array('A'=>0,'AA'=>0,'AAA'=>0);
		foreach ($tests as $k => $v) {
			if (isset($this->tot['elems']['frame'])) {
				if (in_array($k, $frames_exclude_tests)) {
					continue;
				}
			}
			// excepción:  all en true, fals y decr (elem)
			$calc = false;
			switch ($v['type']) {
				case 'true':
				case 'decr':
					if (($v['elem']=='all') || isset($this->tot['elems'][$v['elem']])) {
						if (isset($this->tot['elems'][$v['test']])) {
							$calc = true;
						}
					}
					break;
				case 'fals':
					if (($v['elem']=='all') || isset($this->tot['elems'][$v['elem']])) {
						if (!isset($this->tot['elems'][$v['test']])) {
							$calc = true;
						}
					}
					break;
				case 'prop':
					if (isset($this->tot['elems'][$v['elem']]) && isset($this->tot['elems'][$v['test']])) {
						$calc = true;
					}
					break;
			} // switch
			if ($calc) {
				$f = 'F_'.$v['type'];

				if (isset($this->tot['elems'][$v['test']])) {
					if ($v['test']=='titleOk') {
						//$tnum = $this->tot['info']['title'];
						$tnum = 'titleOk';
					} else if ($v['test']=='lang') {
						$tnum = $this->tot['info']['lang'];
					} else {
						$tnum = $this->tot['elems'][$v['test']];
					}
				} else {
					$tnum = 0;
				}
				if ($temp = $this->$f($k, $v)) {
					// calcular promedios de $disc
					$rr = round(($temp['r'] / $this->tn), 1);
					$pp = round(($temp['p'] / $this->tn), 2);
					$ss = round(($temp['s'] * $pp), 1); // resultado final para el test
					//$msg = $this->formatTestText($testsResults[$k], $tnum);
					//$this->tot['results'][$k] = $temp['s'].'@'.$pp.'@'.$ss.'@'.$msg;
					$this->tot['results'][$k] = $temp['s'].'@'.$pp.'@'.$ss.'@'.$tnum;
					$this->tot['info']['tests']++;
					$rel += $ss;
					$pon += $pp;
					// Para ordenar
					$p[$k] = $temp['p'];
					$s[$k] = $temp['s'];
					// Conform
					if (strpos($v['level'], 'A') !== false) {
						$conformerror[$v['level']]++;
					}
				}
			}
		} // foreach
		// FinalScore
		if ($rel == 0) {
			$this->tot['info']['score'] = '-';
		} else {
			$score = number_format(($rel / $pon), 1);
			$this->tot['info']['score'] = ($score == 10)? (int) 10 : $score;
		}
		// Conform
		$this->tot['info']['conform'] = implode('@',$conformerror);
		// Order
		array_multisort($s, SORT_REGULAR, SORT_ASC, $p, SORT_REGULAR, SORT_DESC, $this->tot['results']);
		// Discap
		$this->tot['users'] = array();
		for ($i=0; $i<=$this->tni; $i++) {
			$d = $this->disc[$i]['d'];
			$sco = '-';
			if ($this->disc[$i]['t'] > 0) {
				$sco = number_format(($this->disc[$i]['r'] / $this->disc[$i]['p']), 1);
				$sco = ($sco == 10)? 10 : $sco;
			}
			$this->tot['users'][$d] = $this->disc[$i]['t'].'@'.$sco;
		}
		return;
	} // ParseTot

	function F_true(&$k, &$v) {
		$score = $v['score'];
		$ret = array('s'=>$score, 'p'=>0, 'r'=>0);
		for ($i=0; $i<=$this->tni; $i++) {
			$w = $v['dis'][$i]; // lugar en 51511
			if ($w > 1) {
				$p = round(($v['trust'] * $w), 2);
				$r = round(($score * $p), 1);
				$this->disc[$i]['p'] += $p;
				$this->disc[$i]['r'] += $r;
				$this->disc[$i]['t']++;
				$ret['p'] += $p;
				$ret['r'] += $r;
			}
		}
		return $ret;
	} // true

	function F_fals(&$k, &$v) {
		$score = $v['score'];
		$ret = array('s'=>$score, 'p'=>0, 'r'=>0);
		for ($i=0; $i<=$this->tni; $i++) {
			$w = $v['dis'][$i];
			if ($w > 1) {
				$p = round(($v['trust'] * $w), 2);
				$r = round(($score * $p), 1);
				
				$this->disc[$i]['p'] += $p;
				$this->disc[$i]['r'] += $r;
				$this->disc[$i]['t']++;
				$ret['p'] += $p;
				$ret['r'] += $r;
			}
		}
		return $ret;
	} // false

	function F_decr(&$k, &$v) {
		$test = $this->tot['elems'][$v['test']];
		$limit = $v['top'];
		$steps = $v['steps'];
		$score = $v['score'];
		$errors = ($test - $limit);  // errores adicionales al máximo permitido
		$minus = ($errors > 0)? round($errors / $steps) : 0; // la nota disminuye en ...
		$op = ($score - $minus);
		$rr = ($op < 1)? 1 : $op;
		$ret = array('s'=>$rr, 'p'=>0, 'r'=>0);
		for ($i=0; $i<=$this->tni; $i++) {
			$w = $v['dis'][$i];
			if ($w > 1) {
				$p = round(($v['trust'] * $w), 2);
				$r = number_format(($rr * $p), 1);
				$this->disc[$i]['p'] += $p;
				$this->disc[$i]['r'] += $r;
				$this->disc[$i]['t']++;
				$ret['p'] += $p;
				$ret['r'] += $r;
			}
		}
		return $ret;
	} // decr

	function F_prop(&$k, &$v) {
		$elem = $this->tot['elems'][$v['elem']];
		$test = $this->tot['elems'][$v['test']];
		$score = $v['score'];
		$op = $score - (($score / $elem) * $test);
		$rr = ($op < 1)? 1 : round($op);
		$ret = array('s'=>$rr, 'p'=>0, 'r'=>0);
		for ($i=0; $i<=$this->tni; $i++) {
			$w = $v['dis'][$i];
			if ($w > 1) {
				$p = round(($v['trust'] * $w), 2);
				$r = number_format(($rr * $p), 1);
				$this->disc[$i]['p'] += $p;
				$this->disc[$i]['r'] += $r;
				$this->disc[$i]['t']++;
				$ret['p'] += $p;
				$ret['r'] += $r;
			}
		}
		return $ret;
	} // prop

	function formatTestText($txt, $a) {
		if ($a == 1) {
			$txt = preg_replace('@\([^\)]+\)@mU', '', $txt);
			$txt = preg_replace('@\[([^\|]+)\|([^\]]+)\]@eU', "'\\1'", $txt);
		} else {
			$txt = preg_replace(array('@\(@','@\)@'), '', $txt);
			$txt = preg_replace('@\[([^\|]+)\|([^\]]+)\]@eU', "'\\2'", $txt);
		}
		return htmlspecialchars(sprintf($txt, $a), ENT_QUOTES);
	} //formatTestText
	
	function check_attr($attr, $tag) {
		if (preg_match("@\s".$attr."\s?=\s?([\"\'])? (?(1) (.*?)\\1 | ([^\s\>]+))@ix", $tag ,$cap)) {
			return (isset($cap[3]))? trim($cap[3]) : trim($cap[2]);
		} else {
			return NULL;
		}
	} // check_attr
	
	function HtmlValidationUmic() {
		/*$result = file_get_contents('http://validador-html.fccn.pt/check?uri='.urlencode($this->tot['info']['url']).'&output=json');
		$headers = $http_response_header;
    echo var_dump($result);
    $split = explode('{', $result);

    $headers = preg_split('/\r\n|\r|\n/', trim($split[0]));

		if (!is_array($headers)) {
			$this->tot['elems']['w3cValidatorFail'] = 'Error';
			return;
		}
    
		foreach($headers as $key => $head){
			$a = "";
			$b = "";
			if (stripos($head, ":") !== FALSE) {
				list($a, $b) = explode(":", $head, 2);
				if (strtolower(trim($a)) == 'x-w3c-validator-status') {
					$status = strtolower(trim($b));
					if ($status == 'valid') {
						$this->tot['elems']['w3cValidator'] = 'true';
					} else if ($status == 'invalid') {
						$this->tot['elems']['w3cValidator'] = 'false';
					}
				}
				if (strtolower(trim($a)) == 'x-w3c-validator-errors') {
					if (trim($b) != 0) {
						$this->tot['elems']['w3cValidatorErrors'] = trim($b);
					}
				}
			}
		} // foreach*/

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://validador-html.fccn.pt/check?uri='.urlencode($this->tot['info']['url']).'&output=json'); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
    $output = curl_exec($ch);   
    //echo var_dump($output);
    // convert response
    //$output = json_decode($output);

    // handle error; error output
    if(curl_getinfo($ch, CURLINFO_HTTP_CODE) !== 400) {
      $split = explode('{', $output);

      $headers = preg_split('/\r\n|\r|\n/', trim($split[0]));

      if (!is_array($headers)) {
        $this->tot['elems']['w3cValidatorFail'] = 'Error';
        return;
      }
      
      foreach($headers as $key => $head){
        $a = "";
        $b = "";
        if (stripos($head, ":") !== FALSE) {
          list($a, $b) = explode(":", $head, 2);
          if (strtolower(trim($a)) == 'x-w3c-validator-status') {
            $status = strtolower(trim($b));
            if ($status == 'valid') {
              $this->tot['elems']['w3cValidator'] = 'true';
            } else if ($status == 'invalid') {
              $this->tot['elems']['w3cValidator'] = 'false';
            }
          }
          if (strtolower(trim($a)) == 'x-w3c-validator-errors') {
            if (trim($b) != 0) {
              $this->tot['elems']['w3cValidatorErrors'] = trim($b);
            }
          }
        }
      }
    }

    curl_close($ch);
    
		return;
	} // HtmlValidationUmic

} // class parsePage

/* tests */

function testList() {
	$tests = array (
  'a_01a' =>
  array (
    'type' => 'true',
    'elem' => 'a',
    'test' => 'aSkipFirst',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.7',
    'ref' => 'G1',
    'scs' => '2.4.1',
    'dis' => '43522',
  ),
  'a_01b' =>
  array (
    'type' => 'fals',
    'elem' => 'a',
    'test' => 'aSkipFirst',
    'score' => 3,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'G1',
    'scs' => '2.4.1',
    'dis' => '43522',
  ),
  'a_02a' =>
  array (
    'type' => 'fals',
    'elem' => 'a',
    'test' => 'aSkip',
    'score' => 3,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'G123',
    'scs' => '2.4.1',
    'dis' => '43522',
  ),
  'a_02b' =>
  array (
    'type' => 'true',
    'elem' => 'a',
    'test' => 'aSkip',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.7',
    'ref' => 'G123',
    'scs' => '2.4.1',
    'dis' => '43522',
  ),
  'a_03' =>
  array (
    'type' => 'decr',
    'elem' => 'a',
    'test' => 'aImgAltNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'F89',
    'scs' => '2.4.4,2.4.9,4.1.2',
    'dis' => '53322',
  ),
  'a_04' =>
  array (
    'type' => 'fals',
    'elem' => 'all',
    'test' => 'a',
    'score' => 3,
    'level' => 'AA',
    'trust' => '1',
    'ref' => 'G125',
    'scs' => '2.4.5',
    'dis' => '54353',
  ),
  'a_05' =>
  array (
    'type' => 'prop',
    'elem' => 'a',
    'test' => 'aTitleMatch',
    'score' => 5,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'H33',
    'scs' => '2.4.4,2.4.9',
    'dis' => '52132',
  ),
  'a_06' =>
  array (
    'type' => 'decr',
    'elem' => 'a',
    'test' => 'aAdjacentSame',
    'score' => 5,
    'level' => 'A',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'H2',
    'scs' => '1.1.1,2.4.4,2.4.9',
    'dis' => '54353',
  ),
  'a_09' =>
  array (
    'type' => 'decr',
    'elem' => 'a',
    'test' => 'aSameText',
    'score' => 3,
    'level' => 'AAA',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'F84',
    'scs' => '2.4.9',
    'dis' => '52122',
  ),
  'abbr_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'abbrNo',
    'score' => 3,
    'level' => 'AAA',
    'trust' => '1',
    'ref' => 'G102',
    'scs' => '3.1.4',
    'dis' => '42153',
  ),
  'akey_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'acckeyRep',
    'score' => 4,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F17',
    'scs' => '1.3.1,4.1.1',
    'dis' => '44151',
  ),
  'applet_01' =>
  array (
    'type' => 'prop',
    'elem' => 'applet',
    'test' => 'appletAltNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H35',
    'scs' => '1.1.1',
    'dis' => '53142',
  ),
  'area_01a' =>
  array (
    'type' => 'fals',
    'elem' => 'area',
    'test' => 'areaAltNo',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'H24',
    'scs' => '1.1.1,2.4.4,2.4.9',
    'dis' => '54222',
  ),
  'area_01b' =>
  array (
    'type' => 'prop',
    'elem' => 'area',
    'test' => 'areaAltNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F65',
    'scs' => '1.1.1',
    'dis' => '53322',
  ),
  'blink_01' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'blink',
    'score' => 2,
    'level' => 'A',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'F47',
    'scs' => '2.2.2',
    'dis' => '15154',
  ),
  'blink_02' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'cssBlink',
    'score' => 3,
    'level' => 'A',
    'trust' => '0.9',
    'ref' => 'F4',
    'scs' => '2.2.2',
    'dis' => '15152',
  ),
  'br_01' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'brSec',
    'score' => 3,
    'level' => 'a',
    'trust' => '0.7',
    'top' => 1,
    'steps' => 1,
    'ref' => 'H48',
    'scs' => '1.3.1',
    'dis' => '53342',
  ),
  'color_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'colorFgBgNo',
    'score' => 5,
    'level' => 'aa',
    'trust' => '0.9',
    'ref' => 'F24',
    'scs' => '1.4.3,1.4.6,1.4.8',
    'dis' => '13113',
  ),
  'color_02' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'colorContrast',
    'score' => 4,
    'level' => 'AA',
    'trust' => '0.8',
    'top' => 1,
    'steps' => 1,
    'ref' => 'G145',
    'scs' => '1.4.3',
    'dis' => '15113',
  ),
  'css_01' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'lineHeightNo',
    'score' => 3,
    'level' => 'aaa',
    'trust' => '0.8',
    'top' => 1,
    'steps' => 1,
    'ref' => 'C21',
    'scs' => '1.4.8',
    'dis' => '15153',
  ),
  'dtd_01' =>
  array (
    'type' => 'fals',
    'elem' => 'all',
    'test' => 'dtd',
    'score' => 3,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'H88',
    'scs' => '4.1.1,4.1.2',
    'dis' => '22232',
  ),
  'ehandler_01' =>
  array (
    'type' => 'true',
    'elem' => 'ehandler',
    'test' => 'ehandMouse',
    'score' => 1,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F54',
    'scs' => '2.1.1',
    'dis' => '53512',
  ),
  'ehandler_02' =>
  array (
    'type' => 'prop',
    'elem' => 'ehandler',
    'test' => 'ehandBothNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'SCR20',
    'scs' => '2.1.1,2.1.3',
    'dis' => '53511',
  ),
  'ehandler_03' =>
  array (
    'type' => 'true',
    'elem' => 'ehandler',
    'test' => 'ehandBoth',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'G90',
    'scs' => '2.1.1,2.1.3',
    'dis' => '52522',
  ),
  'ehandler_04' =>
  array (
    'type' => 'prop',
    'elem' => 'ehandler',
    'test' => 'ehandTagNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '0.8',
    'ref' => 'F59',
    'scs' => '4.1.2',
    'dis' => '43411',
  ),
  'embed_01' =>
  array (
    'type' => 'prop',
    'elem' => 'embed',
    'test' => 'embedAltNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '0.9',
    'ref' => 'H46',
    'scs' => '1.1.1,1.2.8',
    'dis' => '54353',
  ),
  'field_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'fieldLegNo',
    'score' => 4,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H71',
    'scs' => '1.3.1,3.3.2',
    'dis' => '54152',
  ),
  'field_02' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'fieldNoForm',
    'score' => 3,
    'level' => 'A',
    'trust' => '0.9',
    'top' => 1,
    'steps' => 1,
    'ref' => 'H71',
    'scs' => '1.3.1,3.3.2',
    'dis' => '54152',
  ),
  'focus_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'focusBlur',
    'score' => 3,
    'level' => 'a',
    'trust' => '0.8',
    'ref' => 'F55',
    'scs' => '2.1.1,2.4.7,3.2.1',
    'dis' => '54142',
  ),
  'font_01' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'fontHtml',
    'score' => 4,
    'level' => 'AA',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'C22',
    'scs' => '1.3.1,1.4.4,1.4.5,1.4.9',
    'dis' => '33111',
  ),
  'font_02' =>
  array (
    'type' => 'prop',
    'elem' => 'fontValues',
    'test' => 'fontAbsVal',
    'score' => 4,
    'level' => 'AA',
    'trust' => '1',
    'ref' => 'C12',
    'scs' => '1.4.4',
    'dis' => '15123',
  ),
  'form_01a' =>
  array (
    'type' => 'fals',
    'elem' => 'form',
    'test' => 'formSubmitNo',
    'score' => 10,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'H32',
    'scs' => '3.2.2',
    'dis' => '21211',
  ),
  'form_01b' =>
  array (
    'type' => 'prop',
    'elem' => 'form',
    'test' => 'formSubmitNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '0.9',
    'ref' => 'H32',
    'scs' => '3.2.2',
    'dis' => '21211',
  ),
  'frame_01' =>
  array (
    'type' => 'prop',
    'elem' => 'frame',
    'test' => 'frameTitleNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H64',
    'scs' => '2.4.1,4.1.2',
    'dis' => '53222',
  ),
  'frame_02' =>
  array (
    'type' => 'true',
    'elem' => 'frameset',
    'test' => 'frameDtdNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H88',
    'scs' => '4.1.1,4.1.2',
    'dis' => '22232',
  ),
  'hx_01a' =>
  array (
    'type' => 'fals',
    'elem' => 'all',
    'test' => 'hx',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H42',
    'scs' => '1.3.1',
    'dis' => '54322',
  ),
  'hx_01b' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'hx',
    'score' => 10,
    'level' => 'aaa',
    'trust' => '0.9',
    'ref' => 'G141',
    'scs' => '1.3.1,2.4.10',
    'dis' => '54343',
  ),
  'hx_01c' =>
  array (
    'type' => 'fals',
    'elem' => 'hx',
    'test' => 'h1',
    'score' => 4,
    'level' => 'aaa',
    'trust' => '1',
    'ref' => 'G141',
    'scs' => '1.3.1,2.4.10',
    'dis' => '54343',
  ),
  'hx_02' =>
  array (
    'type' => 'true',
    'elem' => 'hx',
    'test' => 'hxNo',
    'score' => 3,
    'level' => 'AA',
    'trust' => '1',
    'ref' => 'G130',
    'scs' => '2.4.6',
    'dis' => '54253',
  ),
  'hx_03' =>
  array (
    'type' => 'prop',
    'elem' => 'hx',
    'test' => 'hxSkip',
    'score' => 3,
    'level' => 'AAA',
    'trust' => '1',
    'ref' => 'G141',
    'scs' => '1.3.1,2.4.10',
    'dis' => '54343',
  ),
  'id_01' =>
  array (
    'type' => 'true',
    'elem' => 'id',
    'test' => 'idRep',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F77',
    'scs' => '4.1.1',
    'dis' => '32321',
  ),
  'iframe_01' =>
  array (
    'type' => 'prop',
    'elem' => 'iframe',
    'test' => 'iframeTitleNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H64',
    'scs' => '2.4.1,4.1.2',
    'dis' => '53222',
  ),
  'img_01a' =>
  array (
    'type' => 'fals',
    'elem' => 'img',
    'test' => 'imgAltNo',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'H37',
    'scs' => '1.1.1',
    'dis' => '53322',
  ),
  'img_01b' =>
  array (
    'type' => 'prop',
    'elem' => 'img',
    'test' => 'imgAltNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F65',
    'scs' => '1.1.1',
    'dis' => '53322',
  ),
  'img_02' =>
  array (
    'type' => 'prop',
    'elem' => 'img',
    'test' => 'imgAltNull',
    'score' => 8,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'C9',
    'scs' => '1.1.1',
    'dis' => '41111',
  ),
  'img_03' =>
  array (
    'type' => 'decr',
    'elem' => 'img',
    'test' => 'imgAltNot',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'F30',
    'scs' => '1.1.1,1.2.1',
    'dis' => '53211',
  ),
  'img_04' =>
  array (
    'type' => 'prop',
    'elem' => 'img',
    'test' => 'imgAltLong',
    'score' => 5,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'H45',
    'scs' => '1.1.1',
    'dis' => '54153',
  ),
  'inp_img_01a' =>
  array (
    'type' => 'fals',
    'elem' => 'inpImg',
    'test' => 'inpImgAltNo',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'H36',
    'scs' => '1.1.1',
    'dis' => '54211',
  ),
  'inp_img_01b' =>
  array (
    'type' => 'prop',
    'elem' => 'inpImg',
    'test' => 'inpImgAltNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F65',
    'scs' => '1.1.1',
    'dis' => '53322',
  ),
  'input_01' =>
  array (
    'type' => 'prop',
    'elem' => 'inputLabel',
    'test' => 'inputIdTitleNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H65',
    'scs' => '1.1.1,1.3.1,3.3.2,4.1.2',
    'dis' => '53122',
  ),
  'input_02' =>
  array (
    'type' => 'prop',
    'elem' => 'label',
    'test' => 'inputLabelNo',
    'score' => 3,
    'level' => 'a',
    'trust' => '0.8',
    'ref' => 'H44',
    'scs' => '1.1.1,1.3.1,3.3.2,4.1.2',
    'dis' => '54532',
  ),
  'input_02b' =>
  array (
    'type' => 'fals',
    'elem' => 'inputLabel',
    'test' => 'inputLabelNo',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.7',
    'ref' => 'H44',
    'scs' => '1.1.1,1.3.1,3.3.2,4.1.2',
    'dis' => '54532',
  ),
  'input_03' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'inputAltNo',
    'score' => 5,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'H36',
    'scs' => '1.1.1',
    'dis' => '54211',
  ),
  'justif_txt_01' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'justifiedTxt',
    'score' => 3,
    'level' => 'AAA',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'F88',
    'scs' => '1.4.8',
    'dis' => '15152',
  ),
  'justif_txt_02' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'justifiedCss',
    'score' => 3,
    'level' => 'AAA',
    'trust' => '0.9',
    'top' => 1,
    'steps' => 1,
    'ref' => 'C19',
    'scs' => '1.4.8',
    'dis' => '14142',
  ),
  'label_01' =>
  array (
    'type' => 'prop',
    'elem' => 'label',
    'test' => 'labelForNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F68',
    'scs' => '1.3.1,4.1.2',
    'dis' => '52523',
  ),
  'label_02' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'labelPosNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '0.9',
    'top' => 1,
    'steps' => 1,
    'ref' => 'G162',
    'scs' => '1.3.1,3.3.2',
    'dis' => '43353',
  ),
  'label_03' =>
  array (
    'type' => 'prop',
    'elem' => 'label',
    'test' => 'labelTextNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F68',
    'scs' => '1.3.1,4.1.2',
    'dis' => '52523',
  ),
  'lang_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'lang',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'H57',
    'scs' => '3.1.1',
    'dis' => '53112',
  ),
  'lang_02' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'langCodeNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H57',
    'scs' => '3.1.1',
    'dis' => '53112',
  ),
  'lang_03' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'langNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H57',
    'scs' => '3.1.1',
    'dis' => '53112',
  ),
  'lang_04' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'langMatchNo',
    'score' => 4,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H57',
    'scs' => '3.1.1',
    'dis' => '53112',
  ),
  'lang_05' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'langExtra',
    'score' => 5,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H57',
    'scs' => '3.1.1',
    'dis' => '53112',
  ),
  'layout_01a' =>
  array (
    'type' => 'fals',
    'elem' => 'all',
    'test' => 'layoutElem',
    'score' => 10,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'G115',
    'scs' => '1.3.1',
    'dis' => '34212',
  ),
  'layout_01b' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'layoutElem',
    'score' => 5,
    'level' => 'A',
    'trust' => '1',
    'top' => 2,
    'steps' => 2,
    'ref' => 'G115',
    'scs' => '1.3.1',
    'dis' => '34212',
  ),
  'layout_02a' =>
  array (
    'type' => 'fals',
    'elem' => 'all',
    'test' => 'layoutAttr',
    'score' => 10,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'G140',
    'scs' => '1.3.1,1.4.5,1.4.9',
    'dis' => '25243',
  ),
  'layout_02b' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'layoutAttr',
    'score' => 5,
    'level' => 'A',
    'trust' => '0.9',
    'top' => 3,
    'steps' => 3,
    'ref' => 'G140',
    'scs' => '1.3.1,1.4.5,1.4.9',
    'dis' => '25243',
  ),
  'layout_03' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'layoutFixed',
    'score' => 5,
    'level' => 'aa',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'G146',
    'scs' => '1.4.4,1.4.8',
    'dis' => '15222',
  ),
  'link_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'linkRel',
    'score' => 10,
    'level' => 'aa',
    'trust' => '0.9',
    'ref' => 'H59',
    'scs' => '2.4.5,2.4.8',
    'dis' => '55554',
  ),
  'list_01' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'liNoList',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'top' => 3,
    'steps' => 3,
    'ref' => 'H48',
    'scs' => '1.3.1',
    'dis' => '53342',
  ),
  'long_01' =>
  array (
    'type' => 'prop',
    'elem' => 'longDImg',
    'test' => 'longDNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H45',
    'scs' => '1.1.1',
    'dis' => '54153',
  ),
  'marquee_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'marquee',
    'score' => 1,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F16',
    'scs' => '2.2.2',
    'dis' => '45153',
  ),
  'meta_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'metaRefresh',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F41',
    'scs' => '2.2.1,2.2.4,3.2.5',
    'dis' => '43353',
  ),
  'meta_02' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'metaRedir',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F40',
    'scs' => '2.2.1,2.2.4',
    'dis' => '43353',
  ),
  'object_01' =>
  array (
    'type' => 'prop',
    'elem' => 'object',
    'test' => 'objectAltNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H27',
    'scs' => '1.1.1',
    'dis' => '54152',
  ),
  'scope_01' =>
  array (
    'type' => 'decr',
    'elem' => 'table',
    'test' => 'scopeNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'H63',
    'scs' => '1.3.1',
    'dis' => '53353',
  ),
  'table_01' =>
  array (
    'type' => 'prop',
    'elem' => 'tableLayout',
    'test' => 'tableLayoutCaption',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F46',
    'scs' => '1.3.1',
    'dis' => '51421',
  ),
  'table_02' =>
  array (
    'type' => 'prop',
    'elem' => 'tableData',
    'test' => 'tableDataCaption',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H39',
    'scs' => '1.3.1',
    'dis' => '52211',
  ),
  'table_03' =>
  array (
    'type' => 'prop',
    'elem' => 'table',
    'test' => 'tableCaptionSummary',
    'score' => 4,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H73',
    'scs' => '1.3.1',
    'dis' => '33152',
  ),
  'table_04' =>
  array (
    'type' => 'prop',
    'elem' => 'table',
    'test' => 'tableNested',
    'score' => 3,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'F49',
    'scs' => '1.3.2',
    'dis' => '53311',
  ),
  'table_05a' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'tableLayout',
    'score' => 4,
    'level' => 'a',
    'trust' => '1',
    'top' => 1,
    'steps' => 1,
    'ref' => 'H51',
    'scs' => '1.3.1',
    'dis' => '53352',
  ),
  'table_06' =>
  array (
    'type' => 'decr',
    'elem' => 'tableComplex',
    'test' => 'tableComplexError',
    'score' => 4,
    'level' => 'a',
    'trust' => '0.8',
    'top' => 1,
    'steps' => 1,
    'ref' => 'H43',
    'scs' => '1.3.1',
    'dis' => '53211',
  ),
  'title_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'titleVrs',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H25',
    'scs' => '2.4.2',
    'dis' => '52112',
  ),
  'title_02' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'titleNo',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'H25',
    'scs' => '2.4.2',
    'dis' => '52112',
  ),
  'title_03' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'titleNull',
    'score' => 3,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F25',
    'scs' => '2.4.2',
    'dis' => '33151',
  ),
  'title_04' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'titleLong',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.9',
    'top' => 64,
    'steps' => 10,
    'ref' => 'G88',
    'scs' => '2.4.2',
    'dis' => '42253',
  ),
  'title_05' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'titleChars',
    'score' => 4,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'G88',
    'scs' => '2.4.2',
    'dis' => '42253',
  ),
  'title_06' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'titleOk',
    'score' => 10,
    'level' => 'a',
    'trust' => '0.9',
    'ref' => 'H25',
    'scs' => '2.4.2',
    'dis' => '52112',
  ),
  'title_07' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'titleSame',
    'score' => 4,
    'level' => 'A',
    'trust' => '1',
    'ref' => 'F25',
    'scs' => '2.4.2',
    'dis' => '33151',
  ),
  'values_01a' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'valueAbsHtml',
    'score' => 4,
    'level' => 'AA',
    'trust' => '0.9',
    'top' => 1,
    'steps' => 1,
    'ref' => 'G146',
    'scs' => '1.4.4',
    'dis' => '15222',
  ),
  'values_01b' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'valueRelHtml',
    'score' => 10,
    'level' => 'aa',
    'trust' => '0.9',
    'ref' => 'G146',
    'scs' => '1.4.4',
    'dis' => '15222',
  ),
  'values_02a' =>
  array (
    'type' => 'decr',
    'elem' => 'all',
    'test' => 'valueAbsCss',
    'score' => 3,
    'level' => 'AAA',
    'trust' => '0.9',
    'top' => 1,
    'steps' => 1,
    'ref' => 'C24',
    'scs' => '1.4.8',
    'dis' => '15113',
  ),
  'values_02b' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'valueRelCss',
    'score' => 10,
    'level' => 'aaa',
    'trust' => '1',
    'ref' => 'C24',
    'scs' => '1.4.8',
    'dis' => '15113',
  ),
  'w3c_validator_01a' =>
  array (
    'type' => 'fals',
    'elem' => 'w3cValidator',
    'test' => 'w3cValidatorErrors',
    'score' => 10,
    'level' => 'a',
    'trust' => '1',
    'ref' => 'G134',
    'scs' => '4.1.1',
    'dis' => '22232',
  ),
  'w3c_validator_01b' =>
  array (
    'type' => 'decr',
    'elem' => 'w3cValidator',
    'test' => 'w3cValidatorErrors',
    'score' => 5,
    'level' => 'A',
    'trust' => '1',
    'top' => 10,
    'steps' => 10,
    'ref' => 'G134',
    'scs' => '4.1.1',
    'dis' => '22232',
  ),
  'win_01' =>
  array (
    'type' => 'true',
    'elem' => 'all',
    'test' => 'newWinOnLoad',
    'score' => 3,
    'level' => 'A',
    'trust' => '0.9',
    'ref' => 'F52',
    'scs' => '3.2.1',
    'dis' => '53454',
  ),
);
	return $tests;
} // testList