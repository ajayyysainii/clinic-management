const mongoose = require('mongoose');
const Invoice = require('./src/modules/billing/patient/models/invoice.model').default;

// Test function to check monthly revenue calculation
async function testMonthlyRevenue() {
  try {
    console.log('🧪 Testing Monthly Revenue Calculation...');

    // Connect to database (you'll need to set your connection string)
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Get current date and calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    console.log('📅 Current date:', now.toISOString());
    console.log('📅 Start of current month:', startOfMonth.toISOString());
    console.log('📅 Start of previous month:', startOfPreviousMonth.toISOString());

    // Test 1: Check if there are any invoices in the database
    const totalInvoices = await Invoice.countDocuments();
    console.log('📊 Total invoices in database:', totalInvoices);

    if (totalInvoices === 0) {
      console.log('⚠️ No invoices found in database. Creating test invoice...');

      // Create a test invoice
      const testInvoice = new Invoice({
        invoice_id: 'TEST-INVOICE-001',
        appointment_id: new mongoose.Types.ObjectId(),
        patient_id: new mongoose.Types.ObjectId(),
        clinic_id: new mongoose.Types.ObjectId(),
        subtotal: 1000,
        tax_amount: 180,
        total_amount: 1180,
        amount_word: 'One thousand one hundred eighty rupees only',
        amount_paid: 1180,
        amount_due: 0,
        status: 'PAID',
        created_at: new Date() // Current date
      });

      await testInvoice.save();
      console.log('✅ Test invoice created');
    }

    // Test 2: Calculate current month revenue
    const currentMonthInvoices = await Invoice.find({
      created_at: { $gte: startOfMonth }
    });

    const currentMonthRevenue = currentMonthInvoices.reduce((total, invoice) => {
      return total + (invoice.total_amount || 0);
    }, 0);

    console.log('💰 Current month invoices found:', currentMonthInvoices.length);
    console.log('💰 Current month revenue:', currentMonthRevenue);

    // Test 3: Calculate previous month revenue
    const previousMonthInvoices = await Invoice.find({
      created_at: { $gte: startOfPreviousMonth, $lt: startOfMonth }
    });

    const previousMonthRevenue = previousMonthInvoices.reduce((total, invoice) => {
      return total + (invoice.total_amount || 0);
    }, 0);

    console.log('💰 Previous month invoices found:', previousMonthInvoices.length);
    console.log('💰 Previous month revenue:', previousMonthRevenue);

    // Test 4: Calculate growth
    const revenueGrowth = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

    console.log('📈 Revenue growth:', revenueGrowth.toFixed(2) + '%');

    // Test 5: Show sample invoices
    const sampleInvoices = await Invoice.find().limit(5);
    console.log('📋 Sample invoices:');
    sampleInvoices.forEach((invoice, index) => {
      console.log(`  ${index + 1}. Invoice ID: ${invoice.invoice_id}`);
      console.log(`     Amount: ₹${invoice.total_amount}`);
      console.log(`     Created: ${invoice.created_at}`);
      console.log(`     Status: ${invoice.status}`);
    });

    console.log('✅ Monthly revenue calculation test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing monthly revenue:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testMonthlyRevenue();
