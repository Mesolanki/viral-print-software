import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to restrict access based on user permissions
 * @param {string[]} requiredPermissions - List of permissions required to access the route
 */
export const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized request: Missing user context');
      }

      // Admin has all privileges and can skip checks
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Check if user has all the required permissions
      const hasPermission = requiredPermissions.every((perm) =>
        req.user.permissions.includes(perm)
      );

      if (!hasPermission) {
        throw new ApiError(403, 'Forbidden: You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
