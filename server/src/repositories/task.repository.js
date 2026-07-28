import { prisma } from '../config/database.js';

export const taskRepository = {
  /**
   * Find tasks with filter criteria
   * @param {object} whereClause 
   * @returns {Promise<Array>}
   */
  async findMany(whereClause = {}) {
    return await prisma.task.findMany({
      where: whereClause,
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
        created_by: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
      },
      orderBy: [
        { due_date: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  },

  /**
   * Find single task by ID
   * @param {number} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    return await prisma.task.findUnique({
      where: { id: Number(id) },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
        created_by: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
      },
    });
  },

  /**
   * Create a new task record
   * @param {object} data 
   * @returns {Promise<object>}
   */
  async create(data) {
    return await prisma.task.create({
      data,
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
        created_by: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
      },
    });
  },

  /**
   * Update an existing task record
   * @param {number} id 
   * @param {object} data 
   * @returns {Promise<object>}
   */
  async update(id, data) {
    return await prisma.task.update({
      where: { id: Number(id) },
      data,
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
        created_by: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
      },
    });
  },

  /**
   * Update task status
   * @param {number} id 
   * @param {string} status 
   * @returns {Promise<object>}
   */
  async updateStatus(id, status) {
    return await prisma.task.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
            username: true,
          },
        },
      },
    });
  },

  /**
   * Delete task by ID
   * @param {number} id 
   * @returns {Promise<object>}
   */
  async delete(id) {
    return await prisma.task.delete({
      where: { id: Number(id) },
    });
  }
};
