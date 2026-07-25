import { taskService } from '../services/task.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const taskController = {
  /**
   * Get list of tasks with filters
   */
  getTasks: asyncHandler(async (req, res) => {
    const tasks = await taskService.getTasks(req.query);

    res.status(200).json(
      new ApiResponse(200, tasks, 'Tasks retrieved successfully')
    );
  }),

  /**
   * Get single task by ID
   */
  getTaskById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const task = await taskService.getTaskById(id);

    res.status(200).json(
      new ApiResponse(200, task, 'Task retrieved successfully')
    );
  }),

  /**
   * Create a new task
   */
  createTask: asyncHandler(async (req, res) => {
    const newTask = await taskService.createTask(req.body);

    res.status(201).json(
      new ApiResponse(201, newTask, 'Task created successfully')
    );
  }),

  /**
   * Update task details
   */
  updateTask: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedTask = await taskService.updateTask(id, req.body);

    res.status(200).json(
      new ApiResponse(200, updatedTask, 'Task updated successfully')
    );
  }),

  /**
   * Quick status update
   */
  updateTaskStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const updatedTask = await taskService.updateTaskStatus(id, status);

    res.status(200).json(
      new ApiResponse(200, updatedTask, 'Task status updated successfully')
    );
  }),

  /**
   * Delete task
   */
  deleteTask: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await taskService.deleteTask(id);

    res.status(200).json(
      new ApiResponse(200, result, 'Task deleted successfully')
    );
  }),
};
