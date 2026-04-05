import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { authenticate } from '../../../middlewares';

const router = Router();

// Create Razorpay order
router.post('/create-order', authenticate, createOrder);

// Verify payment
router.post('/verify', authenticate, verifyPayment);

// Razorpay webhook endpoint (no authentication required)
router.post('/webhook', async (req: any, res: any) => {
  try {
    console.log('🔔 Razorpay Webhook Received (Main Payment Route):', {
      timestamp: new Date().toISOString(),
      event: req.body.event,
      payment_id: req.body.payload?.entity?.payment?.id
    });

    // Import and use the webhook handler from billing module
    const { handleWebhook } = await import('../../billing/patient/controllers/razorpay.controller');
    await handleWebhook(req, res);
  } catch (error: any) {
    console.error('💥 Error in main payment webhook route:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

export default router;
