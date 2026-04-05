import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_51HqjqKqKqKqKqKqKq',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_for_development'
});

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        if (!amount || !currency) {
            res.status(400).json({
                success: false,
                message: 'Amount and currency are required'
            });
            return
        }

        const options = {
            amount: amount, // amount in paise
            currency: currency,
            receipt: receipt || `order_${Date.now()}`,
            notes: notes || {}
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            res.status(400).json({
                success: false,
                message: 'Payment verification parameters are required'
            });
            return
        }

        // Verify the payment signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_for_development')
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Payment is verified
            // Here you can save payment details to database
            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
