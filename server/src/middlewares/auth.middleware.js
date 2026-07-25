import { verifyToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Verify JWT Bearer token and attach the decoded user to req.user.
 * Also checks that the user's account is still ACTIVE.
 */
export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized: Authorization token is missing or malformed');
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Unauthorized: Invalid or expired access token');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'Unauthorized: User session not found');
    }

    // Re-check status on every request — deactivated mid-session users are blocked
    if (user.status === 'INACTIVE') {
      throw new ApiError(403, 'Your account has been deactivated. Please contact the administrator.');
    }

    const permissions =
      user.role?.permissions?.map((rp) => rp.permission.permission_name) || [];

    // Attach clean user payload to the request
    req.user = {
      id: user.id,
      fullName: user.full_name,
      username: user.username,
      role: user.role?.name,
      roleLabel: user.role?.label,
      permissions,
      companyId: user.company_id,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Permission guard middleware factory.
 * Usage: requirePermission('manage_users')
 * Throws 403 if the logged-in user does not have the required permission.
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized: Not authenticated'));
    }
    if (!req.user.permissions.includes(permission)) {
      return next(
        new ApiError(
          403,
          `Forbidden: You do not have permission to perform this action (${permission})`
        )
      );
    }
    next();
  };
};

/**
 * Role guard middleware factory.
 * Usage: requireRole('ADMIN') or requireRole(['ADMIN', 'MANAGER'])
 */
export const requireRole = (roles) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized: Not authenticated'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(
        new ApiError(403, `Forbidden: This action requires one of these roles: ${allowed.join(', ')}`)
      );
    }
    next();
  };
};
