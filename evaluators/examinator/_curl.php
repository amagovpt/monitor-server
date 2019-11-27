<?php
class myCurl {
	public $ch = false;
	public $params = array();
	public $error = '';
	public $info = '';
	public $pagecode = '';
	public $uri = '';
	public $header = false;
	private $redir = 0;
	private $site = 'all';
	public $curling = '';

	function __construct($site='all', $time=null) {
		$this->curlIni($time);
		$this->site = $site;
		if ($site == 'examinator') {
			$this->uri = API_URI;
			curl_setopt($this->ch,CURLOPT_POST,true);
			$this->params = array(
				'output' => 'php',
				'key' => API_KEY,
				'lang' => LANGUAGE
				);
		} else {
			if ($site == 'all') {
				if (ini_get('open_basedir') != '' || (ini_get('safe_mode') != 'Off')) {
					// No funcionará CURLOPT_FOLLOWLOCATION y necesitamos el header de la página
					// para resolver las posibles redirecciones
					curl_setopt($this->ch,CURLOPT_HEADER,true);
					$this->header = true;
				}
			}
		}
	}

	function getPage() {
		if ($this->redir > 2) {
			$this->error = 'Too many redirects';
			return;
		}
		$this->error = '';
		if ($this->site == 'examinator') {
			$this->params['pagecode'] = $this->pagecode;
			$this->params['info'] = $this->info;
			curl_setopt($this->ch, CURLOPT_POSTFIELDS, $this->params);
		} else {
			$this->info = '';
			$this->pagecode = '';
			$this->uri = str_replace(array('%2F','%3A','&amp;','%3F','%3D'), array('/',':','&','?','='), $this->uri);
		}
		curl_setopt($this->ch,CURLOPT_URL,$this->uri);
		$result = @curl_exec($this->ch);
		$this->error = curl_error($this->ch);
		if ($this->error != '') {
			return;
		}
		$this->info = curl_getinfo($this->ch);
		$this->curling = $this->info;
		if ($this->header) {
			// Separar header de contenido
			// list($headers, $content) = explode("\r\n\r\n", $ret, 2);
			$header_size = $this->info['header_size'];
			$headers = substr($result, 0, $header_size);
			$this->pagecode = substr($result, $header_size);
		} else {
			$this->pagecode = $result;
		}
		if ($this->info['http_code'] == 200) {
			if ($this->site == 'all') {
				$this->getInfo();
			}
			return;
		}
		if ($this->info['http_code'] == 301 || $this->info['http_code'] == 302) {
			if (preg_match('/Location:(.*?)\n/i', $headers, $matches)) {
				$this->uri = trim(array_pop($matches));
				$this->redir++;
				$this->getPage();
			} else {
				if (preg_match("@href=([\"\'])? (?(1) (.*?)\\1 | ([^\s\>]+))@ix",$this->pagecode,$matches)) {
					$this->uri = trim($matches[2]);
					$this->redir++;
					$this->getPage();
				} else {
					$this->error = $this->info['http_code'];
				}
			}
		}
		
	}

	/*function hasError304()
	{	
		return $this->info['http_code'] == 304;
	} */

	function getInfo() {
		$new = array();
		$new['url'] = $this->info['url'];
		$new['hash'] = md5($this->pagecode);
		if (isset($this->info['content_type'])) {
			if (stristr($this->info['content_type'], ';')) {
				$explode_content = explode(';', $this->info['content_type'], 2);
				if (isset($explode_content[0])) {
					$cont = trim($explode_content[0]);
				}
				if (isset($explode_content[1])) {
					list(,$charset) = explode('=', $explode_content[1]);
					if (isset($charset)) {
						$new['encoding'] = trim(strtolower($charset));
					}
				}
			} else {
				$cont = $this->info['content_type'];
			}
			if ($this->site == 'all') {
				if (stristr($cont, 'html')) {
					$new['content'] = $cont;
				} else {
					$this->error = Lang('URIErrorD', $cont);
				}
			}
		} else {
			$new['content'] = 'html';
		}
		if (isset($this->info['size_download']) && ($this->info['size_download'] > 0)) {
			$new['size'] = $this->info['size_download'];
		} else {
			$new['size'] = strlen($this->pagecode);
		}
		$new['date'] = gmdate('Y-m-d H:i:s');
		$this->info = $new;
    
		return;
	} // getInfo

	function curlIni($time=null) {
		$header = array (
		  0 => 'Accept: text/html, text/css, application/xml;q=0.9, application/xhtml+xml, */*;q=0.1',
		  1 => 'Cache-Control: max-age=0',
		  2 => 'Connection: keep-alive',
		  3 => 'Keep-Alive: 300',
		  4 => 'Accept-Charset: ISO-8859-1,UTF-8;q=0.7,*;q=0.7',
		  5 => 'Accept-Language: pt-pt,pt;q=0.9,en;q=0.8',
		  6 => 'Pragma: ');
		$this->ch = curl_init();

		if ($time) {
			curl_setopt($this->ch, CURLOPT_TIMEVALUE, $time);
			curl_setopt($this->ch, CURLOPT_TIMECONDITION, CURLOPT_TIMECOND_IFMODIFIEDSINCE);
		}

    //$version = curl_version();
    //$ssl_supported= ($version['features'] & CURL_VERSION_SSL);

    //echo $ssl_supported;

		curl_setopt($this->ch,CURLOPT_CONNECTTIMEOUT,30);
		curl_setopt($this->ch,CURLOPT_COOKIEJAR, "cookie.txt");
		curl_setopt($this->ch,CURLOPT_COOKIEFILE, "cookie.txt");
		curl_setopt($this->ch,CURLOPT_ENCODING,'gzip,deflate');
		curl_setopt($this->ch,CURLOPT_FAILONERROR,true);
		@curl_setopt($this->ch,CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($this->ch,CURLOPT_HEADER,false);
		curl_setopt($this->ch,CURLOPT_HTTPHEADER,$header);
		//curl_setopt($this->ch,CURLOPT_MAXREDIRS, 3);
		curl_setopt($this->ch,CURLOPT_NOBODY,false);
		curl_setopt($this->ch,CURLOPT_REFERER,'http://www.google.com');
		curl_setopt($this->ch,CURLOPT_RETURNTRANSFER,true);
		curl_setopt($this->ch,CURLOPT_TIMEOUT,20);
		//curl_setopt($this->ch,CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($this->ch, CURLOPT_SSL_VERIFYPEER, 0);
    //curl_setopt($this->ch, CURLOPT_SSLVERSION, $ssl_supported);
		curl_setopt($this->ch,CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'); //'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
	}

	function close() {
		curl_close($this->ch);
	}
}

function CheckURI(&$uri, &$error) {
	$user = '';
	$password = '';
	if ($uri == "") {
		return false;
	} else {
		if (!preg_match("@\:\/\/@", $uri)) {
			$uri = 'http://'.$uri;
		}
		$parse = @parse_url($uri);
		if ((strtolower($parse['scheme']) != 'http') && (strtolower($parse['scheme']) != 'https')) {
			return false;
		} else if ((strtolower($parse['host']) == 'localhost') || (strtolower($parse['host']) == 'file')) {
			return false;
		} else {
			$uri = $parse['scheme'].'://';
			if (($user != '') || ($password != '')) {
				$uri .= rawurlencode($user).":".rawurlencode($password)."@";
			} else {
				$uri .= (isset($parse['user']))? $parse['user'].($parse['pass']? ':'.$parse['pass'] : '').'@':'';
			}
			$uri .= (isset($parse['host']))? $parse['host'] : '';
			$uri .= (isset($parse['port']))? ':'.$parse['port'] : '';
			if (!isset($parse['path'])) {
				if (substr($uri, -1) != "/") {
					$uri .= "/";
				}
			} else {
				$uri .= rawurlencode($parse['path']);
			}
			//$uri .= (isset($parse['query']))? '?'.$parse['query'] : '';
			return true;
		}
	}
} // CheckURI