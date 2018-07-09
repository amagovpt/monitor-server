<?php
  
  /**
   * Init examinator
   */
  
  require_once(__DIR__.'/_util.php');

  try {
    $url = $argv[1];

    $webpage = get_webpage($url);
    
    if ($webpage) {
      $data = evaluate_url($url, $webpage[0], $webpage[1], $webpage[2]);

      echo json_encode(["pagecode" => $webpage[1], "data" => $data]);
    } else {
      echo json_encode(null);
    }
  } catch (Exception $e) {
    echo json_encode($e->getMessage());
  }