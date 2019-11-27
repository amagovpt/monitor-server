'use strict';

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

module.exports.error = (err, result=null) => {
  return {
    success: err.code,
    message: err.message,
    errors: err.err,
    result
  };
}