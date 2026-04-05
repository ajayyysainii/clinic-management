// This file ensures all billing models are registered with Mongoose
// Import all models to register them with Mongoose

// Patient billing models
import './patient/models/invoice.model';
import './patient/models/invoiceItem.model';
import './patient/models/invoicePayment.model';
import './patient/models/invoiceDiscount.model';
import './patient/models/invoiceRefund.model';

// Doctor billing models
import './doctor/models/doctorPayoutConfig.model';
import './doctor/models/doctorDailyEarning.model';

// Staff billing models (if any)
// import './staff/models/...';

console.log('✅ All billing models registered with Mongoose');
