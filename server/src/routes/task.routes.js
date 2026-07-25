import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateUpdateTaskStatus,
} from '../validators/task.validator.js';

const router = Router();

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', validate(validateCreateTask), taskController.createTask);
router.put('/:id', validate(validateUpdateTask), taskController.updateTask);
router.patch('/:id/status', validate(validateUpdateTaskStatus), taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

export default router;
