import { verifyToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized request: Authorization token is missing or malformed');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new ApiError(401, 'Unauthorized request: Invalid or expired access token');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'Unauthorized request: User session not found');
    }

    // Format user payload including permissions list
    const permissions = user.role?.permissions?.map(rp => rp.permission.permission_name) || [];
    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role?.name,
      permissions,
      companyId: user.company_id
    };

    next();
  } catch (error) {
    next(error);
  }
};
