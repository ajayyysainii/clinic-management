import express from 'express';
import { authenticate } from '../../../../middlewares/auth.middleware';
import * as razorpayController from '../controllers/razorpay.controller';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', authenticate, razorpayController.createPaymentOrder);

// Verify payment
router.post('/verify-payment', razorpayController.verifyPayment);

// Get payment details
router.get('/payment/:payment_id', razorpayController.getPaymentDetails);

// Razorpay webhook endpoint (no authentication required)
router.post('/webhook', razorpayController.handleWebhook);

export default router;
