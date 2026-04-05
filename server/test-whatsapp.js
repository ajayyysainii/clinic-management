const WhatsAppService = require('./src/utils/whatsappService').default;

async function testWhatsAppIntegration() {
  const whatsappService = new WhatsAppService();

  try {
    console.log('🧪 Testing WhatsApp Integration...');

    // Test 1: Send a simple text message
    console.log('\n📱 Test 1: Sending text message...');
    await whatsappService.sendMessage(
      'Hello! This is a test message from PrevaCare WhatsApp integration.',
      '919214061551'
    );
    console.log('✅ Text message test completed');

    // Test 2: Send EMR PDF link
    console.log('\n📄 Test 2: Sending EMR PDF link...');
    await whatsappService.sendEmrPdfLink(
      'Test Patient',
      'Dr. Test Doctor',
      'https://prevacare-clinic.s3.ap-south-1.amazonaws.com/pdfs/emr_688e40853587241273e1855d_1754153094286.pdf',
      '919214061551'
    );
    console.log('✅ EMR PDF link test completed');

    // Test 3: Send E-Prescription PDF link
    console.log('\n💊 Test 3: Sending E-Prescription PDF link...');
    await whatsappService.sendEprescriptionPdfLink(
      'Test Patient',
      'Dr. Test Doctor',
      'https://prevacare-clinic.s3.ap-south-1.amazonaws.com/pdfs/emr_688e40853587241273e1855d_1754153094286.pdf',
      '919214061551'
    );
    console.log('✅ E-Prescription PDF link test completed');

    console.log('\n🎉 All WhatsApp integration tests completed successfully!');

  } catch (error) {
    console.error('❌ WhatsApp integration test failed:', error);
  }
}

// Run the test
testWhatsAppIntegration();
