import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const userController = {
  /**
   * Get users for company
   */
  getUsers: asyncHandler(async (req, res) => {
    const { company_id } = req.query;
    const users = await userService.getUsers(company_id);

    res.status(200).json(
      new ApiResponse(200, users, 'Users retrieved successfully')
    );
  }),
};
