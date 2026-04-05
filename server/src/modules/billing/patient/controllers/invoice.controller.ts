import { Request, Response } from 'express';
import * as invoiceService from '../services/invoice.service';
import * as razorpayService from '../services/razorpay.service';
import { AuthenticatedRequest } from '../../../../types';
import mongoose from 'mongoose';

export const createInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clinic_id = req.currentUser?.clinic
    if (!clinic_id) {
      res.status(400).json({
        success: false,
        error: 'Clinic information is required',
      })
      return
    }
    const { invoice, payments, discounts, refunds, items, paymentMethod = 'CASH' } = req.body;
    invoice.clinic_id = clinic_id;

    // Check if any payment method other than CASH is selected
    const hasNonCashPayment = payments && payments.some((payment: any) => payment.mode !== 'CASH');

    if (hasNonCashPayment || paymentMethod !== 'CASH') {
      // Create invoice with payment requirement
      const result = await invoiceService.createInvoiceWithPayment({ invoice, payments, discounts, refunds, items }, paymentMethod);

      if ('requiresPayment' in result && result.requiresPayment) {
        // Create Razorpay order
        const orderPayload = {
          amount: invoice.total_amount,
          currency: 'INR',
          receipt: `invoice_${(result.invoice as any)._id}`,
          notes: {
            invoice_id: (result.invoice as any)._id.toString(),
            clinic_id: clinic_id.toString(),
          }
        };

        const razorpayOrder = await razorpayService.createRazorpayOrder(orderPayload);

         res.status(201).json({
          success: true,
          data: {
            ...result,
            razorpay_order: razorpayOrder,
            requiresPayment: true
          }

        });
         return;
      }
    }

    // For CASH payments, create invoice directly
    const result = await invoiceService.createInvoice({ invoice, payments, discounts, refunds, items });
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const completePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { invoice_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!invoice_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        error: 'All payment parameters are required',
      });
      return
    }

    console.log('🔍 Completing payment:', {
      invoice_id,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    });

    // Verify payment with Razorpay
    const verificationResult = await razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!verificationResult.success) {
      console.error('❌ Payment verification failed');
      res.status(400).json({
        success: false,
        error: 'Payment verification failed',
      });
      return
    }

    console.log('✅ Payment verification successful');

    // Get payment details
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);

    // Update invoice after successful payment
    const paymentData = {
      amount: (paymentDetails as any).data.payment.amount / 100, // Convert from paise to rupees
      method: (paymentDetails as any).data.payment.method,
      payment_id: razorpay_payment_id,
    };

    const result = await invoiceService.updateInvoiceAfterPayment(invoice_id, paymentData);

    // Import the InvoicePayment model to update reference_id
    const InvoicePayment = (await import('../models/invoicePayment.model')).default;

    // Find and update the payment record with the order_id as reference_id
    const updatedPayment = await InvoicePayment.findOneAndUpdate(
      {
        invoice_id: invoice_id,
        reference_id: { $regex: razorpay_payment_id, $options: 'i' } // Find by payment_id in reference_id
      },
      {
        reference_id: razorpay_order_id, // Save order_id to reference_id
        notes: `Payment completed via Razorpay - Payment ID: ${razorpay_payment_id} - Order ID: ${razorpay_order_id}`
      },
      { new: true }
    );

    if (updatedPayment) {
      console.log('✅ Payment record updated with order_id as reference_id:', {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        reference_id: updatedPayment.reference_id
      });
    } else {
      console.log('⚠️ No payment record found to update for payment_id:', razorpay_payment_id);
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error completing payment:', error);
    res.status(400).json({ error: error.message });
  }
};

export const createPaymentOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clinic_id = req.currentUser?.clinic
    if (!clinic_id) {
      res.status(400).json({
        success: false,
        error: 'Clinic information is required',
      })
      return
    }

    const { amount, currency, receipt, notes } = req.body;

    if (!amount || !currency || !receipt) {
      res.status(400).json({
        success: false,
        error: 'Amount, currency, and receipt are required',
      });
      return
    }

    // Create Razorpay order
    const orderPayload = {
      amount,
      currency,
      receipt,
      notes: {
        ...notes,
        clinic_id: clinic_id.toString(),
      }
    };

    const razorpayOrder = await razorpayService.createRazorpayOrder(orderPayload);

    res.status(201).json({
      success: true,
      data: razorpayOrder
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        error: 'All payment parameters are required',
      });
      return
    }

    console.log('✅ Payment verification parameters received:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    });

    // Verify payment with Razorpay
    const verificationResult = await razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!verificationResult.success) {
      console.error('❌ Payment verification failed');
      res.status(400).json({
        success: false,
        error: 'Payment verification failed',
      });
      return
    }

    console.log('✅ Payment verification successful:', {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    });

    // Import the InvoicePayment model to update reference_id
    const InvoicePayment = (await import('../models/invoicePayment.model')).default;

    // Find and update the payment record with the order_id as reference_id
    const updatedPayment = await InvoicePayment.findOneAndUpdate(
      {
        reference_id: { $regex: razorpay_payment_id, $options: 'i' } // Find by payment_id in reference_id
      },
      {
        reference_id: razorpay_order_id, // Save order_id to reference_id
        notes: `Payment verified via Razorpay - Payment ID: ${razorpay_payment_id} - Order ID: ${razorpay_order_id}`
      },
      { new: true }
    );

    if (updatedPayment) {
      console.log('✅ Payment record updated with order_id as reference_id:', {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        reference_id: updatedPayment.reference_id
      });
    } else {
      console.log('⚠️ No payment record found to update for payment_id:', razorpay_payment_id);
    }

    res.status(200).json({
      success: true,
      data: verificationResult
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

export const createInvoiceWithPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clinic_id = req.currentUser?.clinic
    if (!clinic_id) {
      res.status(400).json({
        success: false,
        error: 'Clinic information is required',
      })
      return
    }

    const { invoice, payments, discounts, refunds, items, paymentMethod = 'CASH', payment_details } = req.body;
    invoice.clinic_id = clinic_id;

    // Verify that payment was successful
    if (!payment_details || !payment_details.verified) {
      res.status(400).json({
        success: false,
        error: 'Payment verification is required',
      });
      return
    }

    console.log('💰 Creating invoice with payment details:', {
      payment_id: payment_details.razorpay_payment_id,
      order_id: payment_details.razorpay_order_id,
      amount: invoice.total_amount
    });

    // Create invoice with payment details
    const result = await invoiceService.createInvoiceWithPayment({ invoice, payments, discounts, refunds, items }, paymentMethod);

    // Add payment record with order_id as reference_id
    if (payment_details.razorpay_payment_id && payment_details.razorpay_order_id) {
      const paymentRecord = {
        invoice_id: (result.invoice as any)._id,
        mode: 'CARD', // or determine from payment method
        amount: invoice.total_amount,
        paid_on: new Date(),
        reference_id: payment_details.razorpay_order_id, // Save order_id as reference_id
        notes: `Payment processed via Razorpay - Payment ID: ${payment_details.razorpay_payment_id} - Order ID: ${payment_details.razorpay_order_id}`
      };

      console.log('💾 Creating payment record with order_id as reference_id:', {
        order_id: payment_details.razorpay_order_id,
        payment_id: payment_details.razorpay_payment_id,
        reference_id: paymentRecord.reference_id
      });

      await invoiceService.addPaymentRecord(paymentRecord);
    }

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error creating invoice with payment:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    await invoiceService.deleteInvoice(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.listInvoices(req.query);
    res.json(invoices);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


export const getInvoicesByClinicId = async (req: AuthenticatedRequest, res: Response) => {
  console.log('getInvoicesByClinicId route hit');
  console.log('Request headers:', req.headers);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  try {
    const clinic_id = req.currentUser?.clinic;
    console.log('Current user:', req.currentUser);
    console.log('Clinic ID:', clinic_id);

    if (!clinic_id) {
      console.log('No clinic ID found in user');
      // Return empty array instead of error
      res.json({ success: true, data: [] });
      return
    }

    // Fetch invoices filtered by clinic_id
    // Now includes gstInvoice: { exists: boolean, pdfUrl?: string } for each invoice
    const invoices = await invoiceService.getInvoicesByClinicId(clinic_id);
    console.log('Found invoices:', invoices.length);
    res.json({ success: true, data: invoices });
  } catch (error: any) {
    console.error('Error in getInvoicesByClinicId:', error);
    res.status(400).json({ error: error.message });
  }
};

