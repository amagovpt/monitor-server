"use strict";

/**
 * Response message module
 */

module.exports.success = (result=null) => {
  return {
    success: 1,
    message: 'NO_ERROR',
    errors: null,
    result 
  };
}

module.exports.no_service = () => {
  return {
    success: -11,
    message: 'NO_SERVICE_AVAILABLE',
    errors: null,
    result: null
  };
}

module.exports.params_error = (errors) => {
  return {
    success: -12,
    message: 'INVALID PARAMETERS',
    errors,
    result: null
  };
}

module.exports.error = (success, message, errors=null, result=null) => {
  return {
    success,
    message,
    errors,
    result
  };
}