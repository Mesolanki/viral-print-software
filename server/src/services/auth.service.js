import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Format a database user record into a clean, safe API response.
 * Never exposes password_hash.
 */
const formatUserResponse = (user) => {
  const permissions =
    user.role?.permissions?.map((rp) => rp.permission.permission_name) || [];

  return {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    status: user.status,
    lastLogin: user.last_login,
    role: {
      id: user.role?.id,
      name: user.role?.name,
      label: user.role?.label,
    },
    permissions,
    company: {
      id: user.company?.id,
      name: user.company?.company_name,
      gstNumber: user.company?.gst_number,
      address: user.company?.address,
      phone: user.company?.phone,
    },
  };
};

export const authService = {
  /**
   * Authenticate user login.
   * Checks: user exists → password correct → status is ACTIVE
   * Records last login time on success.
   */
  async loginUser({ username, password }) {
    // 1. Find user
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new ApiError(401, 'Invalid username or password');
    }

    // 2. Verify password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid username or password');
    }

    // 3. Check account status — inactive users cannot log in
    if (user.status === 'INACTIVE') {
      throw new ApiError(
        403,
        'Your account is inactive. Please contact the administrator.'
      );
    }

    // 4. Record last login timestamp
    await userRepository.updateLastLogin(user.id);

    // 5. Generate JWT
    const userPayload = formatUserResponse(user);
    const token = generateToken({ id: user.id, username: user.username });

    return { user: userPayload, token };
  },

  /**
   * Get the currently authenticated user's profile.
   */
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }
    return formatUserResponse(user);
  },

  /**
   * Change password for a user.
   * Verifies old password before updating.
   */
  async changePassword({ userId, oldPassword, newPassword }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await comparePassword(oldPassword, user.password_hash);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    await userRepository.updateById(userId, { password_hash: newHash });

    return { message: 'Password changed successfully' };
  },
};
