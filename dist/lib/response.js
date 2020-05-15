"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.success = void 0;
function success(result = null) {
    return {
        success: 1,
        message: 'NO_ERROR',
        errors: null,
        result
    };
}
exports.success = success;
function error(err, result = null) {
    return {
        success: err.code,
        message: err.message,
        errors: err.err,
        result
    };
}
exports.error = error;
//# sourceMappingURL=response.js.map