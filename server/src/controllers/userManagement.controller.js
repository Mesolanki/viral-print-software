import { userManagementService } from '../services/userManagement.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Wraps async route handlers to forward errors to Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const userManagementController = {
  /**
   * GET /api/users
   * Returns list of all users in the company.
   * Permission required: manage_users
   */
  getAllUsers: asyncHandler(async (req, res) => {
    const users = await userManagementService.getAllUsers(req.user.companyId);
    res.status(200).json(new ApiResponse(200, users, 'Users fetched successfully'));
  }),

  /**
   * GET /api/users/:id
   * Returns a single user's details.
   * Permission required: manage_users
   */
  getUserById: asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const user = await userManagementService.getUserById(userId, req.user.companyId);
    res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
  }),

  /**
   * POST /api/users
   * Admin creates a new user.
   * Permission required: manage_users
   * Body: { fullName, username, password, confirmPassword, role, status }
   */
  createUser: asyncHandler(async (req, res) => {
    const { fullName, username, password, role, status } = req.body;

    const newUser = await userManagementService.createUser(
      { fullName, username, password, role, status },
      req.user.id,        // createdBy
      req.user.companyId  // company scope
    );

    res
      .status(201)
      .json(new ApiResponse(201, newUser, 'User created successfully'));
  }),

  /**
   * PATCH /api/users/:id
   * Admin updates an existing user.
   * Permission required: manage_users
   * Body (all optional): { fullName, username, password, confirmPassword, role, status }
   */
  updateUser: asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const updated = await userManagementService.updateUser(
      userId,
      req.body,
      req.user.companyId
    );
    res.status(200).json(new ApiResponse(200, updated, 'User updated successfully'));
  }),

  /**
   * PATCH /api/users/:id/toggle-status
   * Toggle the user's active/inactive status.
   * Permission required: manage_users
   */
  toggleStatus: asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const updated = await userManagementService.toggleStatus(userId, req.user.companyId);

    const msg =
      updated.status === 'ACTIVE'
        ? 'User activated successfully'
        : 'User deactivated successfully';

    res.status(200).json(new ApiResponse(200, updated, msg));
  }),

  /**
   * POST /api/users/:id/reset-password
   * Admin resets a user's password (no old password required).
   * Permission required: manage_users
   * Body: { newPassword }
   */
  resetPassword: asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json(
        new ApiResponse(400, null, 'New password must be at least 6 characters')
      );
    }

    const result = await userManagementService.resetPassword(
      userId,
      newPassword,
      req.user.companyId
    );

    res.status(200).json(new ApiResponse(200, result, 'Password reset successfully'));
  }),

  /**
   * GET /api/users/roles
   * Returns all available roles for the Add User form dropdown.
   * Permission required: manage_users
   */
  getRoles: asyncHandler(async (req, res) => {
    const roles = await userManagementService.getRoles();
    res.status(200).json(new ApiResponse(200, roles, 'Roles fetched successfully'));
  }),
};
