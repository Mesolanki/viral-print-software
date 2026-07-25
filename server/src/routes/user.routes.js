import { Router } from 'express';
import { userManagementController } from '../controllers/userManagement.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateCreateUser, validateUpdateUser } from '../validators/user.validator.js';
import { verifyJWT, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// All user management routes require authentication + manage_users permission
router.use(verifyJWT);
router.use(requirePermission('manage_users'));

// ── Role list (for Add/Edit User dropdowns) ──────────────────
router.get('/roles', userManagementController.getRoles);

// ── User CRUD ────────────────────────────────────────────────
// GET all users in company
router.get('/', userManagementController.getAllUsers);

// GET single user
router.get('/:id', userManagementController.getUserById);

// POST create new user
router.post('/', validate(validateCreateUser), userManagementController.createUser);

// PATCH update user (partial)
router.patch('/:id', validate(validateUpdateUser), userManagementController.updateUser);

// ── Special actions ──────────────────────────────────────────
// Toggle ACTIVE / INACTIVE status
router.patch('/:id/toggle-status', userManagementController.toggleStatus);

// Admin force-reset a user's password
router.post('/:id/reset-password', userManagementController.resetPassword);

export default router;
