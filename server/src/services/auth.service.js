import { userRepository } from '../repositories/user.repository.js';
import { prisma } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Format database user record into a clean profile response object
 */
const formatUserResponse = (user) => {
  const permissions = user.role?.permissions?.map(rp => rp.permission.permission_name) || [];
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role?.name,
    permissions,
    company: {
      id: user.company.id,
      name: user.company.company_name,
      gstNumber: user.company.gst_number,
      address: user.company.address,
      phone: user.company.phone
    }
  };
};

export const authService = {
  /**
   * Register a new company and its administrator
   */
  async registerUser({ name, username, password, companyName }) {
    // 1. Check if user already exists
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      throw new ApiError(400, 'Username already exists. Please choose a different one.');
    }

    // 2. Fetch the ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' }
    });
    if (!adminRole) {
      throw new ApiError(500, 'System role (ADMIN) not initialized in the database. Please seed the database.');
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password);

    // 4. Perform transaction to create Company and User
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          company_name: companyName,
          gst_number: '',
          address: '',
          phone: '',
          logo: ''
        }
      });

      // Create admin user linked to this company
      const user = await tx.user.create({
        data: {
          name,
          username,
          password: hashedPassword,
          company_id: company.id,
          role_id: adminRole.id
        },
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

      return user;
    });

    // 5. Generate token & return
    const userPayload = formatUserResponse(result);
    const token = generateToken({ id: userPayload.id, username: userPayload.username });

    return { user: userPayload, token };
  },

  /**
   * Login user and generate access token
   */
  async loginUser({ username, password }) {
    // 1. Retrieve user
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new ApiError(401, 'Invalid username or password');
    }

    // 2. Compare password
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Invalid username or password');
    }

    // 3. Generate token & return
    const userPayload = formatUserResponse(user);
    const token = generateToken({ id: userPayload.id, username: userPayload.username });

    return { user: userPayload, token };
  },

  /**
   * Get user profile by user id
   */
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }
    return formatUserResponse(user);
  }
};
