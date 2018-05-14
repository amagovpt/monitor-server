<?php
  /**
   * Global variables and functions
   */
  
  require_once(__DIR__."/_error_messages.php");

  /**
   * Creates a connection to the database
   */
  function connect_db()
  {
    try {
      $config = json_decode(file_get_contents(__DIR__."/database.json"), true);
      $db = new Database(
        $config[ENV]["host"],
        $config[ENV]["user"],
        $config[ENV]["password"],
        $config[ENV]["name"]
      );

      return $db;
    } catch(Exception $e) {
      log_error("system", null, $e->getMessage());
      return null;
    }
  }

  /**
   * Obtains the value of a parameter (GET or POST) TESTS ONLY!!!
   * @param string $param
   * @return any value 
   */
  function get_param_value($param)
  {
    try {
      if (isset($_GET[$param])) {
        return $_GET[$param];
      } elseif (isset($_POST[$param])) {
        return $_POST[$param];
      }

      return null;
    } catch (Exception $e) {
      log_error("system", null, $e->getMessage());
      return null;
    }
  }

  /**
   * Obtains the value of a parameter (POST)
   * @param string $param
   * @return any value
   */
  function post_param_value($param)
  {
    try {
      if (isset($_POST[$param])) {
        return $_POST[$param];
      }

      return null;
    } catch (Exception $e) {
      log_error("system", null, $e->getMessage());
      return null;
    }
  }

  /**
   * Obtains the value of a parameter (FILE)
   * @param string $param
   * @return any value
   */
  function file_param_value($param)
  {
    try {
      if (isset($_FILES[$param])) {
        return $_FILES[$param];
      }

      return null;
    } catch (Exception $e) {
      log_error("system", null, $e->getMessage());
      return null;
    }
  }

  /**
   * Check if the params are defined
   * @param object $params
   * @return array undefined params
   */
  function check_params($params)
  {
    try {
      if ($params == []) {
        return false;
      }

      $errorParams = [];

      foreach ($params as $key => $value) {
        if ($value == null) {
          array_push($errorParams, $key);
        }
      }

      return get_success_response($errorParams);;
    } catch (Exception $e) {
      log_error("system", null, $e->getMessage());
      return get_server_error();
    }
  }

  /**
   * Quick access to the success response
   * @param any $results
   * @return object success response
   */
  function get_success_response($results = null)
  {
    return ["success" => "SUCCESS", "message" => "NO_ERROR", "results" => $results];
  }

  function get_neutral_response($message = "SOME_ERRORS", $errors = null, $results = null)
  {
    return ["success" => "NEUTRAL", "message" => $message, "errors" => $errors, "results" => $results];
  }

  /**
   * Quick access to the user auth error response
   * @return object user auth success
   */
  function get_user_auth_error()
  {
    return ["success" => "ERROR_USER_AUTH", "message" => "USER_VERIFICATION_ERROR"];
  }

  /**
   * Quick access to the server error response
   * @return object server success
   */
  function get_server_error() 
  {
    return ["success" => "ERROR_SERVER", "message" => "UNEXPECTED_SERVER_ERROR"];
  }

  /**
   * Quick access to the database error response
   * @return object database success
   */
  function get_database_error()
  {
    return ["success" => "ERROR_DB", "message" => "UNEXPECTED_DATABASE_ERROR"];
  }

  /**
   * Quick access to the params undefined error
   * @param array $params
   * @return object params success
   */
  function get_params_error($params = [])
  {
    return ["success" => "ERROR_PARAM", "message" => "PARAM_UNDEFINED_ERROR", "results" => $params];
  }

  /**
   * Gets the webservice response
   * @param any $msg
   * @return object response
   */
  function get_response($msg)
  {
    try {
      return build_response($msg["success"], $msg["message"], $msg["results"], $msg["errors"]);
    } catch (Exception $e) {
      log_error("system", null, $e->getMessage());
      return null;
    }
  }

  /**
   * Builds the webservice response
   * @param int $error
   * @param string $message
   * @param any $results
   * @return object response
   */
  function build_response($error, $message, $results=null, $errors=null)
  {
    try{
      global $EC, $EM;

      if ($error == null || $message == null) {
        return null;
      }

      $response = [
        "success" => $EC[$error],
        "message" => $EM[$message],
        "results" => $results
      ];

      if ($errors != null) {
        $response["errors"] = $errors;
      }

      return json_encode($response);
    } catch (Exception $e) {
      log_error("system", null, $e->getMessage());
      return null;
    }
  }

  /**
   * Logs every error to his correspondent log file
   * @param string $local
   * @param string $fileName
   * @param string $error
   */
  function log_error($local, $fileName, $error)
  {
    try {
      $path = null;

      if ($local == "system") {
        $path = __DIR__."/../logs/system.log";
      } else if ($local == "database") {
        $path = __DIR__."/../logs/database.log";
      } else {
        $path = __DIR__."/../logs/".$local."/".$fileName;
      }

      $date = date("Y-m-d H:i:s");
      file_put_contents($path, $date." - ".$error."\n", FILE_APPEND | LOCK_EX);
      echo $error;
    } catch (Exception $e) {
      $date = date("Y-m-d H:i:s");
      file_put_contents(__DIR__."/../logs/system.log", $date." - ".$e->getMessage()."\n", FILE_APPEND | LOCK_EX);
    }
  }