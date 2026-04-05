const crypto = require('crypto');

// Test webhook payload for successful payment
const testWebhookPayload = {
  event: 'payment.captured',
  payload: {
    entity: {
      payment: {
        id: 'pay_test123456789',
        order_id: 'order_test123456789',
        amount: 50000, // 500 rupees in paise
        currency: 'INR',
        status: 'captured',
        method: 'card',
        email: 'test@example.com',
        contact: '+919876543210',
        created_at: 1640995200
      }
    }
  }
};

// Simulate webhook signature generation
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(testWebhookPayload))
  .digest('hex');

console.log('🧪 Testing Order ID Save to Reference ID');
console.log('==========================================');
console.log('\n📋 Test Payment Details:');
console.log('Payment ID:', testWebhookPayload.payload.entity.payment.id);
console.log('Order ID:', testWebhookPayload.payload.entity.payment.order_id);
console.log('Amount:', testWebhookPayload.payload.entity.payment.amount / 100, 'rupees');

console.log('\n🔐 Generated Signature:', signature);

console.log('\n📋 Expected Database Update:');
console.log('InvoicePayment Model:');
console.log('  - reference_id: "order_test123456789" (Order ID)');
console.log('  - notes: "Payment processed via Razorpay - Payment ID: pay_test123456789 - Order ID: order_test123456789"');

console.log('\n🔄 To test the webhook, send a POST request to:');
console.log('POST /api/patient/billing/razorpay/webhook');
console.log('Headers:');
console.log('Content-Type: application/json');
console.log('x-razorpay-signature: ' + signature);
console.log('\nBody:');
console.log(JSON.stringify(testWebhookPayload, null, 2));

console.log('\n📊 Expected Console Logs:');
console.log('🔔 Razorpay Webhook Received: { timestamp: "...", ... }');
console.log('✅ Webhook signature verified successfully');
console.log('💰 Payment Details from Webhook: { payment_id: "pay_test123456789", order_id: "order_test123456789", ... }');
console.log('📋 Webhook Event Type: payment.captured');
console.log('✅ Payment Captured Successfully: { payment_id: "pay_test123456789", amount: 50000, status: "captured" }');
console.log('🔄 Updating invoice for payment: pay_test123456789');
console.log('📊 Payment data to update invoice: { amount: 500, method: "card", payment_id: "pay_test123456789", ... }');
console.log('✅ Payment record updated with order_id as reference_id: { payment_id: "pay_test123456789", order_id: "order_test123456789", reference_id: "order_test123456789" }');
console.log('💾 Invoice updated in database for payment: pay_test123456789');
console.log('🔗 Order ID saved to reference_id: order_test123456789');

console.log('\n💡 Key Points:');
console.log('1. When payment is successful, the Razorpay order_id is saved to the reference_id field');
console.log('2. The payment_id is stored in the notes field for reference');
console.log('3. This happens both through webhooks and manual payment verification');
console.log('4. The reference_id field now contains the order_id for easy tracking');

module.exports = {
  testWebhookPayload,
  signature
};
