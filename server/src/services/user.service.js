import { userRepository } from '../repositories/user.repository.js';
import { hashPassword } from '../utils/hash.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';

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

export const userService = {
  /**
   * Get list of users/employees for a company
   */
  async getUsers(companyId) {
    const whereClause = {};
    if (companyId) {
      whereClause.company_id = Number(companyId);
    }
    return await userRepository.findAll(whereClause);
  },

  /**
   * Create user/employee by admin
   */
  async createUser({ fullName, username, password, role: requestedRole, status }) {
    if (!username || !password) {
      throw new ApiError(400, 'Username and password are required');
    }

    const existing = await userRepository.findByUsername(username.trim());
    if (existing) {
      throw new ApiError(400, 'Username is already taken');
    }

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { company_name: 'Viral Print Media' },
      });
    }

    const { name: targetRoleName, label: targetRoleLabel } = mapRoleNameToDb(requestedRole || 'OPERATOR');
    let role = await prisma.role.findFirst({ where: { name: targetRoleName } });
    if (!role) {
      role = await prisma.role.create({
        data: { name: targetRoleName, label: targetRoleLabel },
      });
    }

    const password_hash = await hashPassword(password);
    const newUser = await userRepository.create({
      full_name: (fullName || username).trim(),
      username: username.trim(),
      password_hash,
      company_id: company.id,
      role_id: role.id,
      status: status || 'ACTIVE',
    });

    return newUser;
  },

  /**
   * Update user details
   */
  async updateUser(userId, { fullName, username, password, role: requestedRole, status }) {
    const user = await userRepository.findById(Number(userId));
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const updateData = {};
    if (fullName) updateData.full_name = fullName.trim();
    if (username && username.trim() !== user.username) {
      const existing = await userRepository.findByUsername(username.trim());
      if (existing && existing.id !== user.id) {
        throw new ApiError(400, 'Username is already in use');
      }
      updateData.username = username.trim();
    }

    if (password && password.trim().length > 0) {
      updateData.password_hash = await hashPassword(password);
    }

    if (status) {
      updateData.status = status;
    }

    if (requestedRole) {
      const { name: targetRoleName, label: targetRoleLabel } = mapRoleNameToDb(requestedRole);
      let role = await prisma.role.findFirst({ where: { name: targetRoleName } });
      if (!role) {
        role = await prisma.role.create({
          data: { name: targetRoleName, label: targetRoleLabel },
        });
      }
      updateData.role_id = role.id;
    }

    return await userRepository.updateById(Number(userId), updateData);
  },

  /**
   * Update user account status (ACTIVE / INACTIVE)
   */
  async updateUserStatus(userId, status) {
    const user = await userRepository.findById(Number(userId));
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const newStatus = status ? status : (user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    return await userRepository.updateById(Number(userId), { status: newStatus });
  },

  /**
   * Delete user account
   */
  async deleteUser(userId) {
    const user = await userRepository.findById(Number(userId));
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return await userRepository.deleteById(Number(userId));
  }
};
