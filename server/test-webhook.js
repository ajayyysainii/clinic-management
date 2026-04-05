const crypto = require('crypto');

// Test webhook payload (simulating Razorpay webhook)
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

console.log('🧪 Test Webhook Payload:');
console.log(JSON.stringify(testWebhookPayload, null, 2));
console.log('\n🔐 Generated Signature:', signature);
console.log('\n📋 To test the webhook, send a POST request to:');
console.log('POST /api/patient/billing/razorpay/webhook');
console.log('Headers:');
console.log('Content-Type: application/json');
console.log('x-razorpay-signature: ' + signature);
console.log('\nBody:');
console.log(JSON.stringify(testWebhookPayload, null, 2));

// Example curl command
console.log('\n🔄 Example curl command:');
console.log(`curl -X POST http://localhost:5000/api/patient/billing/razorpay/webhook \\
  -H "Content-Type: application/json" \\
  -H "x-razorpay-signature: ${signature}" \\
  -d '${JSON.stringify(testWebhookPayload)}'`);

module.exports = {
  testWebhookPayload,
  signature
}; 