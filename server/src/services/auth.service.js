import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';

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

const mapRoleNameToDb = (requestedRole) => {
  if (!requestedRole) return { name: 'OPERATOR', label: 'Operator' };
  const r = String(requestedRole).toUpperCase();
  if (r.includes('ADMIN')) return { name: 'ADMIN', label: 'Administrator' };
  if (r.includes('MANAGER')) return { name: 'MANAGER', label: 'Shop Manager' };
  if (r.includes('DESIGN')) return { name: 'DESIGNER', label: 'Graphic Designer' };
  if (r.includes('OPERAT')) return { name: 'OPERATOR', label: 'Print Operator' };
  if (r.includes('SALE') || r.includes('BILL')) return { name: 'SALES', label: 'Sales & Billing' };
  if (r.includes('ACCOUNT')) return { name: 'ACCOUNTANT', label: 'Accountant' };
  if (r.includes('CASHIER')) return { name: 'CASHIER', label: 'Cashier' };
  return { name: r, label: requestedRole };
};

export const authService = {
  /**
   * Register a new user account.
   */
  async registerUser({ fullName, username, password, role: requestedRole, email, phone, status }) {
    // 1. Check existing username
    const existing = await userRepository.findByUsername(username.trim());
    if (existing) {
      throw new ApiError(400, 'Username is already taken');
    }

    // 2. Ensure company exists
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { company_name: 'Viral Print Media' },
      });
    }

    // 3. Find or create specified role
    const { name: targetRoleName, label: targetRoleLabel } = mapRoleNameToDb(requestedRole || 'OPERATOR');
    let role = await prisma.role.findFirst({ where: { name: targetRoleName } });
    if (!role) {
      // Fallback search by label or first available role
      role = await prisma.role.findFirst({
        where: { label: { contains: targetRoleName, mode: 'insensitive' } }
      });
    }
    if (!role) {
      role = await prisma.role.create({
        data: { name: targetRoleName, label: targetRoleLabel },
      });
    }

    // 4. Hash password & create user
    const password_hash = await hashPassword(password);
    const newUser = await userRepository.create({
      full_name: fullName.trim(),
      username: username.trim(),
      password_hash,
      company_id: company.id,
      role_id: role.id,
      status: status || 'ACTIVE',
    });

    // 5. Generate token & response payload
    const userPayload = formatUserResponse(newUser);
    const token = generateToken({ id: newUser.id, username: newUser.username });

    return { user: userPayload, token };
  },

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
