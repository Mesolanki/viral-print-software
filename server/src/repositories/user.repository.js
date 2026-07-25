import { prisma } from '../config/database.js';

/**
 * Standard include block for user queries — always loads role + permissions + company
 */
const userInclude = {
  company: true,
  role: {
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  },
};

export const userRepository = {
  /**
   * Find user by username (used for login)
   */
  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
      include: userInclude,
    });
  },

  /**
   * Find user by ID (used for JWT verification and profile)
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
  },

  /**
   * Find all users in a company (for User Management list)
   * Excludes password_hash from result
   */
  async findAllByCompany(companyId) {
    return await prisma.user.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        full_name: true,
        username: true,
        status: true,
        created_by: true,
        last_login: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true, label: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Create a new user
   */
  async create(data) {
    return await prisma.user.create({
      data,
      include: userInclude,
    });
  },

  /**
   * Update user by ID
   */
  async updateById(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
      include: userInclude,
    });
  },

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id) {
    return await prisma.user.update({
      where: { id },
      data: { last_login: new Date() },
    });
  },

  /**
   * Check if username already exists (optional excludeId for updates)
   */
  async usernameExists(username, excludeId = null) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return false;
    if (excludeId && user.id === excludeId) return false;
    return true;
  },

  /**
   * Soft-delete: set status to INACTIVE
   */
  async deactivate(id) {
    return await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  },
};
