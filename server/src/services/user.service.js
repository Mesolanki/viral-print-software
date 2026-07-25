import { userRepository } from '../repositories/user.repository.js';

export const userService = {
  /**
   * Get list of users/employees for a company
   * @param {number|null} companyId 
   * @returns {Promise<Array>}
   */
  async getUsers(companyId) {
    const whereClause = {};
    if (companyId) {
      whereClause.company_id = Number(companyId);
    }
    return await userRepository.findAll(whereClause);
  }
};
