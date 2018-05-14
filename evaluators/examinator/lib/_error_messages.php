<?php

  /**
   * Backend error codes for all situations
   * @var object $EC - Error Codes
   */
  $EC = [
    "SUCCESS" => 1, // reserved
    "NEUTRAL" => 0, // variable
    "ERROR_1" => -1, // variable
    "ERROR_2" => -2, // variable
    "ERROR_3" => -3, // variable
    "ERROR_4" => -4, // variable
    "ERROR_5" => -5, // variable
    "ERROR_6" => -6, // variable
    "ERROR_USER_AUTH" => -10, // reserved
    "ERROR_PARAM" => -11, // reserved
    "ERROR_SERVER" => -12, // reserved
    "ERROR_DB" => -13, // reserved,
    "ERROR_SERVICE" => -14, // reserved
    "ERROR_URL" => -15, // reserved
    "ERROR_EVALUATION" => -16 // reserved
  ];

  /**
   * Backend error messages for all situations
   * @var object $EM - Error Messages
   */
  $EM = [
    "NO_ERROR" => "",
    "SOME_ERRORS" => "Some errors ocurred but they didn't interrupt all the functionalty",
    "SERVICE_NOT_AVAILABLE" => "The given service is not available",
    "UNEXPECTED_SERVER_ERROR" => "An unexpected server error has ocurred.",
    "UNEXPECTED_DATABASE_ERROR" => "An unexpected database error has ocurred.",
    "USER_VERIFICATION_ERROR" => "There was an error verifying user credentials.",
    "USER_LOGIN_WRONG_PASSWORD" => "The user password is not the same.",
    "USER_LOGIN_WRONG_TYPE" => "The user doens't have access to this application.",
    "USER_DOESNT_EXIST" => "The user requested doesn't exist.",
    "USER_CHANGE_PASSWORD_WRONG_CONFIRMATION" => "The new password and it's confirmation are not the same.",
    "USER_CHANGE_PASSWORD_WRONG_PASSWORD" => "The user's old password is not the same.",
    "USER_PASSWORD_WRONG_CONFIRMATION" => "The password and it's confirmation are not the same.",
    "PAGE_DOESNT_EXIST" => "The page requested doesn't exist.",
    "DOMAIN_DOESNT_EXIST" => "The domain requested doesn't exist.",
    "CATEGORY_DOESNT_EXIST" => "The category requested doesn't exist.",
    "DOMAIN_STATISTICS_ZERO_PAGES" => "The given domain has zero pages associated. Can't update statistics.",
    "CATEGORY_STATISTICS_ZERO_DOMAINS" => "The given category has zero domains associated. Can't update statistics.",
    "PARAM_UNDEFINED_ERROR" => "Some params are not defined",
    "USER_HAS_DOMAIN" => "The given user already is associated to the given domain",
    "ADD_PAGES_FILE_EMPTY" => "The given file is empty",
    "ADD_PAGES_URLS_EMPTY" => "The given urls array is empty",
    "ALL_ADD_PAGES_URLS_ERROR" => "Error trying to add all urls",
    "SOME_ADD_PAGES_URLS_ERROR" => "Some given urls had errors",
    "INVALID_URL" => "The given url is invalid",
    "DIFFERENT_DOMAIN_NAME_ERROR" => "The given url doesn't belong to the given domain",
    "GETTING_PAGE_ERROR" => "An error ocurred while trying to obtain the pagecode",
    "MONITOR_DOMAIN_CATEGORIES_EMPTY" => "A domain should be associated to at least one category when it's being created",
    "USER_DOMAINS_EMPTY_CATEGORIES" => "The user is associated to zero categories",
    "ERROR_PARSING_DOMAIN_NAME" => "An error has ocurred when trying to parse the domain name",
    "ERROR_PARSING_URI" => "An error has ocurred when trying to parse the uri",
    "DOMAIN_NOT_FULLY_CREATED" => "The given domain is not fully created",
    "EQUAL_EVALUATION_PAGECODE" => "The given url pagecode is equal to the one in the database"
  ];