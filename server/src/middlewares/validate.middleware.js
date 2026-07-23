import { ApiError } from '../utils/ApiError.js';

/**
 * Express middleware runner for request validation helper functions
 * @param {Function} validatorFn - The validator logic function
 */
export const validate = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req.body);
    if (!isValid) {
      return next(new ApiError(400, 'Validation Error', errors));
    }
    next();
  };
};
