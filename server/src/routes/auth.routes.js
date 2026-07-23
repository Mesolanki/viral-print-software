import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', validate(validateRegister), authController.register);
router.post('/login', validate(validateLogin), authController.login);

// Protected routes
router.get('/me', verifyJWT, authController.getMe);

export default router;
