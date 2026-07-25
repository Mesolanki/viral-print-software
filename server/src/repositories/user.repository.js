import { prisma } from '../config/database.js';

export const userRepository = {
  /**
   * Find user by username
   * @param {string} username 
   * @returns {Promise<object|null>}
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
   * @param {number} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
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
   * @param {object} data 
   * @returns {Promise<object>}
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
   * Find all users matching where clause
   * @param {object} whereClause 
   * @returns {Promise<Array>}
   */
  async findAll(whereClause = {}) {
    return await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        company_id: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
};
