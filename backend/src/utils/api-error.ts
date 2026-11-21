export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(
    statusCodeOrMessage: number | string,
    messageOrStatusCode?: string | number,
    code: string = 'ERROR'
  ) {
    let statusCode = 500;
    let message = 'An unexpected error occurred';

    if (typeof statusCodeOrMessage === 'number') {
      statusCode = statusCodeOrMessage;
      message = typeof messageOrStatusCode === 'string' ? messageOrStatusCode : 'Error';
    } else {
      message = statusCodeOrMessage;
      if (typeof messageOrStatusCode === 'number') {
        statusCode = messageOrStatusCode;
      }
    }

    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code = 'BAD_REQUEST'): ApiError {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT'): ApiError {
    return new ApiError(409, message, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, code);
  }
}
