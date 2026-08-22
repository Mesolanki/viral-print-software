import { Router } from 'express';
import { getInvoices, createOrUpdateInvoice, deleteInvoice } from '../controllers/invoice.controller.js';

const router = Router();

router.get('/', getInvoices);
router.post('/', createOrUpdateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
