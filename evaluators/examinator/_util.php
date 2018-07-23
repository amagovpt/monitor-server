<?php
  
  require_once(__DIR__."/_curl.php");
  require_once(__DIR__."/_examinator.php");

  function get_webpage($url, $time=null)
  {
    try {
      $url = rawurldecode(trim($url));

      $error = "";
      $info = array();
      $pagecode = "";
      $start = microtime(true);

      if (CheckURI($url, $error)) {
        $curl = new myCurl("all", $time);
        $curl->uri = $url;
        $curl->getPage();
        
        if ($curl->error != "") {
          return null;
        } else {
          if ((count($curl->info) == 0) || ($curl->pagecode == "")) {
            return null;
          } else {
            $pagecode = $curl->pagecode;
            $info = $curl->info;
            if (isset($curl->info["encoding"]) && ($curl->info["encoding"] != "utf-8")) {
              $pagecode = utf8_encode($curl->pagecode);
            }
          }
        }
      } else {
        return null;
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
      $nodes = $examinator->nodes;

      $data = array(
        "title" => $tot["info"]["title"],
        "score" => $tot["info"]["score"],
        "rawUrl" => $rawUrl,
        "tot" => $tot,
        "nodes" => $nodes,
        "conform" => $tot["info"]["conform"],
        "elems" => $tot["elems"],
        "date" => date("Y-m-d H:i:s")
      );

      return $data;
    } catch (Exception $e) {
      echo $e->getMessage();
      return null;
    } 
  }