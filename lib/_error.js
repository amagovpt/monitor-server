'use strict';

class ServerError extends Error {

  constructor(err) {
    super(err);
    this.code = -17;
    this.message = 'SERVER_ERROR';
    this.err = err;
  }
}

class ParamsError extends ServerError {

  constructor(err) {
    super(err);
    this.code = -15;
    this.message = 'INVALID_PARAMETERS';
  }
}

class DbError extends ServerError {

  constructor(err) {
    super(err);
    this.code = -16;
    this.message = 'DATABASE_ERROR';
  }
}

class EvalError extends ServerError {

  constructor(err) {
    super(err);
    this.code = -14;
    this.message = 'EVALUATOR_ERROR';
  }
}

class InvalidUrlError extends EvalError {

  constructor(err) {
    super(err);
    this.code = -2;
    this.message = 'INVALID_URL';
  }
}

class UserError extends ServerError {

  constructor(err, code=-13, message='USER_ERROR') {
    super(err);
    this.code = code;
    this.message = message;
  }
}

class UserNotFoundError extends UserError {

  constructor(err=null) {
    super(err);
    this.code = -10;
    this.message = 'USER_NOT_FOUND';
  }
}

class UserDataCompromisedError extends UserError {

  constructor(err=null) {
    super(err);
    this.code = -11;
    this.message = 'USER_DATA_COMPROMISED';
  }
}

class PermissionDeniedError extends UserError {

  constructor(err=null) {
    super(err);
    this.code = -12;
    this.message = 'PERMISSION_DENIED';
  }
}

class SessionExpiredError extends UserError {

  constructor(err=null) {
    super(err);
    this.code = -13;
    this.message = 'SESSION_EXPIRED';
  }
}

class InvalidTagTypeError extends ServerError {

   constructor(err) {
    super(err);
    this.code = -2;
    this.message = 'INVALID_TAG_TYPE';
   }
}

class EntityNotFoundError extends ServerError {

  constructor(err) {
    super(err);
    this.code = -2;
    this.message = 'ENTITY_NOT_FOUND';
   }
}

module.exports.ServerError = ServerError;
module.exports.ParamsError = ParamsError;
module.exports.DbError = DbError;
module.exports.EvalError = EvalError;
module.exports.InvalidUrlError = InvalidUrlError;
module.exports.UserError = UserError;
module.exports.UserNotFoundError = UserNotFoundError;
module.exports.UserDataCompromisedError = UserDataCompromisedError;
module.exports.PermissionDeniedError = PermissionDeniedError;
module.exports.SessionExpiredError = SessionExpiredError;
module.exports.InvalidTagTypeError = InvalidTagTypeError;
module.exports.EntityNotFoundError = EntityNotFoundError;