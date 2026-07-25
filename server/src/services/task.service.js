import { taskRepository } from '../repositories/task.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

export const taskService = {
  /**
   * Get all tasks based on filters
   */
  async getTasks({ company_id, status, priority, assigned_to_id, search, startDate, endDate }) {
    const whereClause = {};

    if (company_id) {
      whereClause.company_id = Number(company_id);
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (priority && priority !== 'ALL') {
      whereClause.priority = priority;
    }

    if (assigned_to_id && assigned_to_id !== 'ALL') {
      if (assigned_to_id === 'UNASSIGNED') {
        whereClause.assigned_to_id = null;
      } else {
        whereClause.assigned_to_id = Number(assigned_to_id);
      }
    }

    if (startDate || endDate) {
      whereClause.due_date = {};
      if (startDate) {
        whereClause.due_date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.due_date.lte = new Date(endDate);
      }
    }

    if (search && String(search).trim() !== '') {
      const searchStr = String(search).trim();
      whereClause.OR = [
        { title: { contains: searchStr, mode: 'insensitive' } },
        { description: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    return await taskRepository.findMany(whereClause);
  },

  /**
   * Get task by ID
   */
  async getTaskById(id) {
    if (!id || isNaN(Number(id))) {
      throw new ApiError(400, 'Valid task ID parameter is required');
    }

    const task = await taskRepository.findById(id);
    if (!task) {
      throw new ApiError(404, `Task with ID ${id} not found`);
    }

    return task;
  },

  /**
   * Create a task
   */
  async createTask({ company_id, title, description, priority, status, start_date, due_date, assigned_to_id, created_by_id }) {
    if (!company_id) {
      throw new ApiError(400, 'company_id is required');
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new ApiError(400, 'Valid task title is required');
    }

    // Verify company exists
    const companyExists = await prisma.company.findUnique({
      where: { id: Number(company_id) },
    });
    if (!companyExists) {
      throw new ApiError(404, `Company with ID ${company_id} not found`);
    }

    // Verify assigned user if specified
    if (assigned_to_id) {
      const assignedUser = await userRepository.findById(Number(assigned_to_id));
      if (!assignedUser) {
        throw new ApiError(404, `Assigned user with ID ${assigned_to_id} not found`);
      }
    }

    const taskData = {
      company_id: Number(company_id),
      title: title.trim(),
      description: description ? String(description).trim() : null,
      priority: priority || 'MEDIUM',
      status: status || 'PENDING',
      start_date: start_date ? new Date(start_date) : null,
      due_date: due_date ? new Date(due_date) : null,
      assigned_to_id: assigned_to_id ? Number(assigned_to_id) : null,
      created_by_id: created_by_id ? Number(created_by_id) : null,
    };

    return await taskRepository.create(taskData);
  },

  /**
   * Update task details
   */
  async updateTask(id, { title, description, priority, status, start_date, due_date, assigned_to_id }) {
    if (!id || isNaN(Number(id))) {
      throw new ApiError(400, 'Valid task ID parameter is required');
    }

    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new ApiError(404, `Task with ID ${id} not found`);
    }

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        throw new ApiError(400, 'Valid task title is required');
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (start_date !== undefined) {
      updateData.start_date = start_date ? new Date(start_date) : null;
    }

    if (due_date !== undefined) {
      updateData.due_date = due_date ? new Date(due_date) : null;
    }

    if (assigned_to_id !== undefined) {
      if (assigned_to_id === null || assigned_to_id === '' || assigned_to_id === 'UNASSIGNED') {
        updateData.assigned_to_id = null;
      } else {
        const assignedUser = await userRepository.findById(Number(assigned_to_id));
        if (!assignedUser) {
          throw new ApiError(404, `Assigned user with ID ${assigned_to_id} not found`);
        }
        updateData.assigned_to_id = Number(assigned_to_id);
      }
    }

    return await taskRepository.update(id, updateData);
  },

  /**
   * Update status of task
   */
  async updateTaskStatus(id, status) {
    if (!id || isNaN(Number(id))) {
      throw new ApiError(400, 'Valid task ID parameter is required');
    }

    if (!status) {
      throw new ApiError(400, 'Status is required');
    }

    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new ApiError(404, `Task with ID ${id} not found`);
    }

    return await taskRepository.updateStatus(id, status);
  },

  /**
   * Delete task
   */
  async deleteTask(id) {
    if (!id || isNaN(Number(id))) {
      throw new ApiError(400, 'Valid task ID parameter is required');
    }

    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new ApiError(404, `Task with ID ${id} not found`);
    }

    await taskRepository.delete(id);
    return { id: Number(id) };
  }
};
