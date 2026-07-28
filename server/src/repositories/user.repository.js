import { prisma } from '../config/database.js';

export const userRepository = {
  /**
   * Find user by username
   */
  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        company: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  },

  /**
   * Find user by id
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        company: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  },

  /**
   * Create user
   */
  async create(data) {
    return await prisma.user.create({
      data,
      include: {
        company: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
  },

  /**
   * Update last_login timestamp for a user
   */
  async updateLastLogin(id) {
    return await prisma.user.update({
      where: { id: Number(id) },
      data: { last_login: new Date() }
    });
  },

  /**
   * Update user by id
   */
  async updateById(id, data) {
    return await prisma.user.update({
      where: { id: Number(id) },
      data,
      include: {
        company: true,
        role: {
          select: {
            id: true,
            name: true,
            label: true,
          }
        }
      }
    });
  },

  /**
   * Delete user by id
   */
  async deleteById(id) {
    return await prisma.user.delete({
      where: { id: Number(id) }
    });
  },

  /**
   * Find all users matching where clause
   */
  async findAll(whereClause = {}) {
    return await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        full_name: true,
        username: true,
        company_id: true,
        status: true,
        last_login: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            label: true,
          },
        },
      },
      orderBy: {
        full_name: 'asc',
      },
    });
  }
};
