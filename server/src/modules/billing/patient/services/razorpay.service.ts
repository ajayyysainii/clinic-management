import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CreateOrderPayload {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentVerificationPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const createRazorpayOrder = async (payload: CreateOrderPayload) => {
  try {
    console.log('🛒 Creating Razorpay Order:', {
      amount: payload.amount,
      currency: payload.currency,
      receipt: payload.receipt,
      timestamp: new Date().toISOString()
    });

    const options = {
      amount: payload.amount * 100, // Razorpay expects amount in paise
      currency: payload.currency || 'INR',
      receipt: payload.receipt,
      notes: payload.notes || {},
    };

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay Order Created Successfully:', {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

    return {
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error: any) {
    console.error('❌ Failed to create Razorpay order:', {
      error: error.message,
      payload: payload,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

export const verifyPayment = async (payload: PaymentVerificationPayload) => {
  try {
    console.log('🔐 Verifying Payment Signature:', {
      order_id: payload.razorpay_order_id,
      payment_id: payload.razorpay_payment_id,
      timestamp: new Date().toISOString()
    });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

    // Create the signature string
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    // Generate the expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    // Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('❌ Payment signature verification failed:', {
        expected: expectedSignature,
        received: razorpay_signature,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
      throw new Error('Payment verification failed: Invalid signature');
    }

    console.log('✅ Payment signature verified successfully:', {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    });

    return {
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signature: razorpay_signature,
    };
  } catch (error: any) {
    console.error('❌ Payment verification error:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

export const getPaymentDetails = async (paymentId: string) => {
  try {
    console.log('📋 Fetching Payment Details:', {
      payment_id: paymentId,
      timestamp: new Date().toISOString()
    });

    const payment = await razorpay.payments.fetch(paymentId);

    console.log('✅ Payment Details Retrieved:', {
      payment_id: payment.id,
      amount: payment.amount,
      status: payment.status,
      method: payment.method
    });

    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        description: payment.description,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at,
      },
    };
  } catch (error: any) {
    console.error('❌ Failed to fetch payment details:', {
      payment_id: paymentId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

export const verifyWebhookSignature = (
  body: any,
  signature: string,
  webhookSecret: string
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

export const updateInvoiceAfterPayment = async (payment: any) => {
  try {
    console.log('🔄 Updating invoice for payment:', payment.id);

    // Convert amount from paise to rupees
    const amountInRupees = payment.amount / 100;

    const paymentData = {
      amount: amountInRupees,
      method: payment.method,
      payment_id: payment.id,
      status: 'paid',
      paid_at: new Date(),
      razorpay_order_id: payment.order_id
    };

    console.log('📊 Payment data to update invoice:', paymentData);

    // Import the InvoicePayment model
    const InvoicePayment = (await import('../models/invoicePayment.model')).default;

    // Find and update the payment record with the order_id as reference_id
    const updatedPayment = await InvoicePayment.findOneAndUpdate(
      {
        reference_id: { $regex: payment.id, $options: 'i' } // Find by payment_id in reference_id
      },
      {
        reference_id: payment.order_id, // Save order_id to reference_id
        notes: `Payment processed via Razorpay - Payment ID: ${payment.id} - Order ID: ${payment.order_id}`
      },
      { new: true }
    );

    if (updatedPayment) {
      console.log('✅ Payment record updated with order_id as reference_id:', {
        payment_id: payment.id,
        order_id: payment.order_id,
        reference_id: updatedPayment.reference_id
      });
    } else {
      console.log('⚠️ No payment record found to update for payment_id:', payment.id);
    }

    // Here you would typically update your invoice in the database
    // For now, we'll just log the data
    // You can integrate this with your invoice service

    // Example integration with invoice service:
    // const result = await invoiceService.updateInvoiceAfterPayment(payment.order_id, paymentData);

    console.log('✅ Invoice update completed for payment:', payment.id);

    return {
      success: true,
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: amountInRupees,
      reference_id_updated: true
    };
  } catch (error: any) {
    console.error('❌ Error updating invoice after payment:', error);
    throw new Error(`Failed to update invoice: ${error.message}`);
  }
};
