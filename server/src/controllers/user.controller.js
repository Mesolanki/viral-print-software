import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const userController = {
  /**
   * GET /api/users
   */
  getUsers: asyncHandler(async (req, res) => {
    const { company_id } = req.query;
    const users = await userService.getUsers(company_id);
    res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully'));
  }),

  /**
   * POST /api/users
   */
  createUser: asyncHandler(async (req, res) => {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(new ApiResponse(201, newUser, 'User created successfully'));
  }),

  /**
   * PUT /api/users/:id
   */
  updateUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedUser = await userService.updateUser(id, req.body);
    res.status(200).json(new ApiResponse(200, updatedUser, 'User updated successfully'));
  }),

  /**
   * PATCH /api/users/:id/status
   */
  updateUserStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const updatedUser = await userService.updateUserStatus(id, status);
    res.status(200).json(new ApiResponse(200, updatedUser, 'User status updated successfully'));
  }),

  /**
   * DELETE /api/users/:id
   */
  deleteUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
  })
};
