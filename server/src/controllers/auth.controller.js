import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Async handler utility to eliminate redundant try/catch blocks
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const authController = {
  /**
   * Handle user and company registration
   */
  register: asyncHandler(async (req, res) => {
    const { name, username, password, companyName } = req.body;
    
    const result = await authService.registerUser({
      name,
      username,
      password,
      companyName
    });

    res.status(201).json(
      new ApiResponse(201, result, 'User and Company registered successfully')
    );
  }),

  /**
   * Handle user login authentication
   */
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    const result = await authService.loginUser({
      username,
      password
    });

    res.status(200).json(
      new ApiResponse(200, result, 'Login successful')
    );
  }),

  /**
   * Retrieve current authenticated user profile
   */
  getMe: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profile = await authService.getUserProfile(userId);

    res.status(200).json(
      new ApiResponse(200, profile, 'User profile fetched successfully')
    );
  })
};
