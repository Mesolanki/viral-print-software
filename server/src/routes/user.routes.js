import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';

const router = Router();

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id', userController.updateUser);
router.patch('/:id/status', userController.updateUserStatus);
router.patch('/:id/toggle-status', userController.updateUserStatus);
router.delete('/:id', userController.deleteUser);

export default router;
