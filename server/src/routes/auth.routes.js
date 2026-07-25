import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateLogin, validateChangePassword } from '../validators/auth.validator.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// ── Public Routes (no authentication required) ──────────────
// Login — the only public entry point
router.post('/login', validate(validateLogin), authController.login);

// ── Protected Routes (JWT required) ─────────────────────────
// Get current user profile
router.get('/me', verifyJWT, authController.getMe);

// Change own password
router.patch(
  '/change-password',
  verifyJWT,
  validate(validateChangePassword),
  authController.changePassword
);

export default router;
