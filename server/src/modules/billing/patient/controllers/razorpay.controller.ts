import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../../types';
import * as razorpayService from '../services/razorpay.service';

export const createPaymentOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clinic_id = req.currentUser?.clinic;
    if (!clinic_id) {
      res.status(400).json({
        success: false,
        error: 'Clinic information is required',
      });
      return
    }

    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || !receipt) {
      res.status(400).json({
        success: false,
        error: 'Amount and receipt are required',
      });
      return
    }

    const orderPayload = {
      amount,
      currency,
      receipt,
      notes: {
        clinic_id: clinic_id.toString(),
        ...notes,
      },
    };

    const result = await razorpayService.createRazorpayOrder(orderPayload);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Alias for createPaymentOrder to match route expectations
export const createOrder = createPaymentOrder;

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Payment Verification Request:', {
      timestamp: new Date().toISOString(),
      body: req.body
    });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing payment verification parameters');
      res.status(400).json({
        success: false,
        error: 'Payment verification parameters are required',
      });
      return
    }

    console.log('✅ Payment verification parameters received:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    });

    const result = await razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    console.log('✅ Payment verification successful:', {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Payment verification failed:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getPaymentDetails = async (req: Request, res: Response) => {
  try {
    const { payment_id } = req.params;

    if (!payment_id) {
      res.status(400).json({
        success: false,
        error: 'Payment ID is required',
      });
      return
    }

    const result = await razorpayService.getPaymentDetails(payment_id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    console.log('🔔 Razorpay Webhook Received:', {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body
    });

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET not configured');
      res.status(500).json({
        success: false,
        error: 'Webhook secret not configured'
      });
      return;
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      console.error('❌ Missing Razorpay signature in webhook');
      res.status(400).json({
        success: false,
        error: 'Missing signature'
      });
      return;
    }

    // Verify webhook authenticity
    const isWebhookAuthentic = razorpayService.verifyWebhookSignature(
      req.body,
      signature,
      webhookSecret
    );

    if (!isWebhookAuthentic) {
      console.error('❌ Invalid webhook signature');
      res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
      return;
    }

    console.log('✅ Webhook signature verified successfully');

    // Extract payment details from webhook
    const { payload } = req.body;
    const { payment } = payload.entity;

    console.log('💰 Payment Details from Webhook:', {
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      created_at: payment.created_at
    });

    // Handle different webhook events
    const event = req.body.event;
    console.log('📋 Webhook Event Type:', event);

    switch (event) {
      case 'payment.captured':
        console.log('✅ Payment Captured Successfully:', {
          payment_id: payment.id,
          amount: payment.amount,
          status: payment.status
        });

        // Update invoice status in database and save order_id to reference_id
        await razorpayService.updateInvoiceAfterPayment(payment);

        console.log('💾 Invoice updated in database for payment:', payment.id);
        console.log('🔗 Order ID saved to reference_id:', payment.order_id);
        break;

      case 'payment.failed':
        console.log('❌ Payment Failed:', {
          payment_id: payment.id,
          error_code: payment.error_code,
          error_description: payment.error_description
        });
        break;

      case 'order.paid':
        console.log('🎉 Order Paid Successfully:', {
          order_id: payment.order_id,
          payment_id: payment.id
        });
        break;

      default:
        console.log('ℹ️ Unhandled webhook event:', event);
    }

    // Return success response to Razorpay
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    console.error('💥 Webhook Processing Error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};
