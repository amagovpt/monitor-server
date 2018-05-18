<?php
  
  /**
   * Init examinator
   */
  
  require_once(__DIR__."/lib/_lang.php");
  require_once(__DIR__."/lib/_curl.php");
  require_once(__DIR__."/lib/_xpath.php");
  require_once(__DIR__."/lib/_tests.php");
  require_once(__DIR__."/lib/_tests_results.php");
  require_once(__DIR__."/lib/_see_elems.php");
  require_once(__DIR__."/lib/_txt_techniques.php");
  require_once(__DIR__.'/_examinator.php');
  require_once(__DIR__.'/_util.php');

  try {
    $url = $argv[1];

    $webpage = get_webpage($url);
    if ($webpage) {
      $data = evaluate_url($url, $webpage[0], $webpage[1], $webpage[2]);

      $tot = unserialize(gzuncompress(base64_decode($data[4])));
      $nodes = unserialize(gzuncompress(base64_decode($data[5])));
      
      $pdata = process_data_observatorio($tot, $webpage[1], $nodes, $url);
      
      //echo json_encode($pdata['elems']);

      global $tests, $elems, $xpath;

      foreach ($pdata['elems'] as $ele) {
        //$ele = $tests[$ee]['elem'];
        //echo $ele.' '; 
        //if (array_key_exists($ele, $xpath))
        if ($ele != 'all' && array_key_exists($ele, $xpath)) {
          $pdata['elems'][$ele] = element_evaluation($tot, $webpage[1], $nodes, $url, $ele);
        }
      }

      echo json_encode(["pagecode" => $webpage[1], "evaluation" => $data, "processed" => $pdata]);
    } else {
      echo json_encode(null);
    }
  } catch (Exception $e) {
    echo json_encode(null);
  }
