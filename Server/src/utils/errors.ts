export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

class ApiError<TData = unknown> extends Error {
  statusCode: number;
  data: TData | null;
  success: boolean;
  errors: ValidationError[];
  code?: string;

  constructor(
    statusCode: number,
    message = "Something went wrong!",
    errors: ValidationError[] = [],
    code?: string,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;
    this.code = code;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Static factory methods for common errors
  static badRequest(message: string, errors: ValidationError[] = [], code = "BAD_REQUEST") {
    return new ApiError(400, message, errors, code);
  }

  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new ApiError(401, message, [], code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new ApiError(403, message, [], code);
  }

  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new ApiError(404, message, [], code);
  }

  static conflict(message: string, field?: string, code = "CONFLICT") {
    const errors = field ? [{ field, message }] : [];
    return new ApiError(409, message, errors, code);
  }

  static validationError(message: string, errors: ValidationError[], code = "VALIDATION_ERROR") {
    return new ApiError(400, message, errors, code);
  }

  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new ApiError(500, message, [], code);
  }
}

export { ApiError };


