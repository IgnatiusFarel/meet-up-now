export class ApiResponse {
  constructor(success, statusCode, message, data = null, error = null) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = 'Success', statusCode = 200) {
    return new ApiResponse(true, statusCode, message, data);
  }

  static error(message = 'Internal Server Error', statusCode = 500, error = null) {
    return new ApiResponse(false, statusCode, message, null, error);
  }

  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(true, 201, message, data);
  }

  static notFound(message = 'Resource not found') {
    return new ApiResponse(false, 404, message);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiResponse(false, 401, message);
  }

  static forbidden(message = 'Forbidden access') {
    return new ApiResponse(false, 403, message);
  }

  static badRequest(message = 'Bad request', error = null) {
    return new ApiResponse(false, 400, message, null, error);
  }

  static conflict(message = 'Resource conflict') {
    return new ApiResponse(false, 409, message);
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.data && { data: this.data }),
      ...(this.error && { error: this.error }),
      timestamp: this.timestamp
    };
  }
}