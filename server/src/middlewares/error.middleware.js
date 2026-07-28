import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Catch database connection & credential errors
  if (err.message && (err.message.includes('Postgres credentials are incorrect') || err.message.includes("Can't reach database server"))) {
    error = new ApiError(
      500,
      'Database connection failed: Please update your PostgreSQL connection string in server/.env file (DATABASE_URL).'
    );
  } else if (!(error instanceof ApiError)) {
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
