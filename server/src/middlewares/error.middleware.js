import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(env.nodeEnv === 'development' ? { stack: error.stack } : {})
  };

  // Log error message (and stack in development)
  console.error(`[ERROR] ${error.statusCode} - ${error.message}`);
  if (env.nodeEnv === 'development' && error.stack) {
    console.error(error.stack);
  }

  res.status(error.statusCode).json(response);
};
