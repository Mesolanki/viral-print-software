import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Wraps async route handlers to forward errors to Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const authController = {
  /**
   * POST /api/auth/login
   * Public — no auth required.
   * Body: { username, password }
   */
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const result = await authService.loginUser({ username, password });

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Login successful'));
  }),

  /**
   * GET /api/auth/me
   * Protected — requires valid JWT.
   */
  getMe: asyncHandler(async (req, res) => {
    const profile = await authService.getUserProfile(req.user.id);

    res
      .status(200)
      .json(new ApiResponse(200, profile, 'User profile fetched successfully'));
  }),

  /**
   * PATCH /api/auth/change-password
   * Protected — requires valid JWT.
   * Body: { oldPassword, newPassword, confirmPassword }
   */
  changePassword: asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword({
      userId: req.user.id,
      oldPassword,
      newPassword,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Password changed successfully'));
  }),
};
