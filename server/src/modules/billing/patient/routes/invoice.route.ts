import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import { authenticate, authorize } from '../../../../middlewares'

const router = Router();


// Invoice routes
router.post('/',authenticate, invoiceController.createInvoice);
router.post('/create-payment-order', authenticate, invoiceController.createPaymentOrder);
router.post('/verify-payment', authenticate, invoiceController.verifyPayment);
router.post('/create-invoice-with-payment', authenticate, invoiceController.createInvoiceWithPayment);
router.post('/complete-payment', authenticate, invoiceController.completePayment);
router.get('/clinic', authenticate, invoiceController.getInvoicesByClinicId);
router.get('/', invoiceController.listInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
