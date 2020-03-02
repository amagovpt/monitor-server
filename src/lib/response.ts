export function success(result: any = null): any {
  return {
    success: 1,
    message: 'NO_ERROR',
    errors: null,
    result 
  };
}

export function error(err: any, result: any = null): any {
  return {
    success: err.code,
    message: err.message,
    errors: err.err,
    result
  };
}