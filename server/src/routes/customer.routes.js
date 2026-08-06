import { Router } from 'express';
import { getCustomers, lookupGst, createOrUpdateCustomer } from '../controllers/customer.controller.js';

const router = Router();

router.get('/', getCustomers);
router.get('/lookup-gst/:gstNo', lookupGst);
router.post('/', createOrUpdateCustomer);

export default router;
