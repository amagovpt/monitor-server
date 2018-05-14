<?php
	/**
	 * Library file - Database object
	 * Every model class should extend this class to acess any database
	 * It serves as an API to do operate the database
	 */

	class Database {

		/**
		 * Database variable
     * @var object database
		 */
		private $db = null;

    /**
     * Error flag
     * @var boolean $error
     */
    private $error = false;

    /**
     * Error message
     * @var string $errorMessage
     */
    private $errorMessage = null;

		/**
		 * Object constructor - establishes a connection to the database
     * @param string $host
     * @param string $user
     * @param string $password
     * @param string $name
		 */
		public function __construct($host, $user, $password, $name) {
		  $password = ENV == "server" ? null : $password;
			
      $this->db = new mysqli($host, $user, $password, $name);

			mysqli_set_charset($this->db, "utf8");
			
      if (mysqli_connect_errno()) {
        $this->error = true;
        $this->errorMessage = mysqli_connect_error();
        log_error("database", null, $this->errorMessage);
			}
		}

    /**
     * Verifies if there was an error
     * @return boolean has_error
     */
    public function has_error()
    {
      $error = $this->error;
      $this->error = false;
      return $error;
    }

    /**
     * Gets error message
     * @return string error_message
     */
    public function get_error_message()
    {
      $msg = $this->errorMessage;
      $this->errorMessage = null;
      $this->error = false;
      return $msg;
    }

		/**
		 * Gets last inserted id
     * @return int id
		 */
		public function get_insert_id() {
			return $this->db->insert_id;
		}

		/**
		 * Executes only a query
		 * It serves to do INSERT, UPDATE and DELETE statements
		 * @param string $query
     * @param string $types
     * @param array $values
		 */
		public function execute_only($query, $types, $values) {
			try {
				$stmt = $this->db->prepare($query);
				if (!$stmt) {
	        $this->error = true;
					$this->errorMessage = $this->db->error;
					log_error("database", null, $this->errorMessage);
				}
				if ($types != "" && $values != []) {
	        $this->bind_param_array($stmt, $types, $values);
	      }
				if (!$stmt->execute()) {
	        $this->error = true;
					$this->errorMessage = $this->db->error;
					log_error("database", null, $this->errorMessage);
				}
				if (!$stmt->close()) {
	        $this->error = true;
					$this->errorMessage = $this->db->error;
					log_error("database", null, $this->errorMessage);
				}
			} catch (Exception $e) {
				log_error("database", null, $this->errorMessage);
				$this->error = true;
			}
		}

		/**
		 * Executes a query and returns it's result
		 * It serves to do SELECT statements
		 * @param string $query
     * @param string $types
     * @param array $values
     * @return array values
		 */
		public function execute_and_fetch($query, $types, $values) {
			try {
				$stmt = $this->db->prepare($query);
				if (!$stmt) {
	        $this->error = true;
					$this->errorMessage = $this->db->error;
					log_error("database", null, $this->errorMessage);
				}

	      if ($types != "" && $values != []) {
				  $this->bind_param_array($stmt, $types, $values);
	      }
				if (!$stmt->execute()) {
	        $this->error = true;
					$this->errorMessage = $this->db->error;
					log_error("database", null, $this->errorMessage);
				}
				$result = array();
	 			$row = $this->bind_result_array($stmt);
				while ($success = $stmt->fetch()) {
					if ($success) {
						$tmp = array();
						foreach ($row as $key => $value) {
							$tmp[$key] = $value;
						}
						$result[] = $tmp;
					}
					else {
	          $this->error = true;
						$this->errorMessage = $this->db->error;
						log_error("database", null, $this->errorMessage);
	          break;
					}
				}
				if (!$stmt->close()) {
	        $this->error = true;
					$this->errorMessage = $this->db->error;
					log_error("database", null, $this->errorMessage);
				}

				return $result;
			} catch (Exception $e) {
				log_error("database", null, $this->errorMessage);
				$this->error = true;
				return [];
			}
		}

		/**
		 * Private function
		 * It helps to associate dynamic values to the bind_param function
     * @param object $stmt
     * @param string $a_param_type
     * @param array $a_bind_params
		 */
		private function bind_param_array($stmt, $a_param_type, $a_bind_params) {
			// Bind parameters. Types: s = string, i = integer, d = double,  b = blob
			$a_params = array();
			$n = count($a_bind_params);

			// with call_user_func_array, array params must be passed by reference
			$a_params[] = &$a_param_type;

			for($i = 0; $i < $n; $i++) {
			  // with call_user_func_array, array params must be passed by reference
			  $a_params[] = & $a_bind_params[$i];
			}

			if (!call_user_func_array(array($stmt, "bind_param"), $a_params)) {
        $this->error = true;
				$this->errorMessage = $this->db->error;
				log_error("database", null, $this->errorMessage);
			}
		}

		/**
		 * Private function
		 * It helps to associate the result values to an array
		 * @param object $stmt
     * @return array values
		 */
		private function bind_result_array($stmt) {
	    $meta = $stmt->result_metadata();
	    $result = array();
	    while ($field = $meta->fetch_field()) {
	      $result[$field->name] = null;
	      $params[] = &$result[$field->name];
	    }

	    if (!call_user_func_array(array($stmt, "bind_result"), $params)) {
        $this->error = true;
	    	$this->errorMessage = $this->db->error;
	    	log_error("database", null, $this->errorMessage);
	    }
      
	    return $result;
		}

		/**
		 * Closes the connection to the database
		 */
		public function close() {
			try {
				$this->db->close();
				$this->db = null;
			} catch (Exception $e) {
				log_error("database", null, $e->getMessage());
			} 
		}
	}