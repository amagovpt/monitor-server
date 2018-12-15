<?php
  
  /**
   * Init examinator
   */
  
  require_once(__DIR__.'/_util.php');

  try {
    $url = $argv[1];
    
    $webpage = get_webpage($url);
    //echo $webpage;
    if ($webpage) {
      $data = evaluate_url($url, $webpage[0], $webpage[1], $webpage[2]);
      if ($data) {
        echo json_encode(["pagecode" => $webpage[1], "data" => $data]);
      } else {
        echo null;
      }
    } else {
      echo null;
    }
  } catch (Exception $e) {
    echo json_encode($e->getMessage());
  }