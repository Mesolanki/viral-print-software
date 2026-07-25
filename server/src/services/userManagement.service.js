import { prisma } from '../config/database.js';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword } from '../utils/hash.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Format a user record for API responses.
 * Never exposes password_hash.
 */
const formatUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  username: user.username,
  status: user.status,
  createdBy: user.created_by,
  lastLogin: user.last_login,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  role: user.role
    ? { id: user.role.id, name: user.role.name, label: user.role.label }
    : null,
});

export const userManagementService = {
  /**
   * Get all users in the admin's company.
   */
  async getAllUsers(companyId) {
    const users = await userRepository.findAllByCompany(companyId);
    return users.map(formatUser);
  },

  /**
   * Get a single user by ID (must belong to same company).
   */
  async getUserById(userId, companyId) {
    const user = await userRepository.findById(userId);
    if (!user || user.company_id !== companyId) {
      throw new ApiError(404, 'User not found');
    }
    return formatUser(user);
  },

  /**
   * Create a new user (Admin only).
   * Steps:
   *  1. Check username uniqueness
   *  2. Resolve role by name
   *  3. Hash password
   *  4. Create user record
   */
  async createUser({ fullName, username, password, role, status = 'ACTIVE' }, createdBy, companyId) {
    // 1. Username uniqueness check
    const taken = await userRepository.usernameExists(username.trim());
    if (taken) {
      throw new ApiError(400, `Username "${username}" already exists. Please choose a different one.`);
    }

    // 2. Resolve role
    const roleRecord = await prisma.role.findUnique({
      where: { name: role.toUpperCase() },
    });
    if (!roleRecord) {
      throw new ApiError(400, `Role "${role}" is not recognized`);
    }

    // 3. Hash password
    const password_hash = await hashPassword(password);

    // 4. Create user
    const user = await userRepository.create({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      password_hash,
      role_id: roleRecord.id,
      status: status.toUpperCase(),
      company_id: companyId,
      created_by: createdBy,
    });

    return formatUser(user);
  },

  /**
   * Update an existing user (Admin only).
   * Partial update — only provided fields are changed.
   */
  async updateUser(userId, updates, companyId) {
    // Verify user exists in this company
    const existing = await userRepository.findById(userId);
    if (!existing || existing.company_id !== companyId) {
      throw new ApiError(404, 'User not found');
    }

    const data = {};

    if (updates.fullName !== undefined) {
      data.full_name = updates.fullName.trim();
    }

    if (updates.username !== undefined) {
      const newUsername = updates.username.trim().toLowerCase();
      const taken = await userRepository.usernameExists(newUsername, userId);
      if (taken) {
        throw new ApiError(400, `Username "${newUsername}" already exists.`);
      }
      data.username = newUsername;
    }

    if (updates.password !== undefined) {
      data.password_hash = await hashPassword(updates.password);
    }

    if (updates.role !== undefined) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: updates.role.toUpperCase() },
      });
      if (!roleRecord) {
        throw new ApiError(400, `Role "${updates.role}" is not recognized`);
      }
      data.role_id = roleRecord.id;
    }

    if (updates.status !== undefined) {
      data.status = updates.status.toUpperCase();
    }

    const updated = await userRepository.updateById(userId, data);
    return formatUser(updated);
  },

  /**
   * Toggle user status between ACTIVE and INACTIVE.
   */
  async toggleStatus(userId, companyId) {
    const user = await userRepository.findById(userId);
    if (!user || user.company_id !== companyId) {
      throw new ApiError(404, 'User not found');
    }

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await userRepository.updateById(userId, { status: newStatus });
    return formatUser(updated);
  },

  /**
   * Reset a user's password (Admin sets a new password without knowing the old one).
   */
  async resetPassword(userId, newPassword, companyId) {
    const user = await userRepository.findById(userId);
    if (!user || user.company_id !== companyId) {
      throw new ApiError(404, 'User not found');
    }

    const password_hash = await hashPassword(newPassword);
    await userRepository.updateById(userId, { password_hash });

    return { message: 'Password reset successfully' };
  },

  /**
   * Get all available roles (for the role dropdown in Add User form).
   */
  async getRoles() {
    return await prisma.role.findMany({
      select: { id: true, name: true, label: true },
      orderBy: { id: 'asc' },
    });
  },
};
