import React, { useState } from 'react';

const PaymentSidebar = ({ invoiceId, onPaymentAdded }) => {
  const [payment, setPayment] = useState({
    mode: 'CASH',
    amount: 0,
    paid_on: new Date().toISOString().split('T')[0],
    reference_id: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPayment({
      ...payment,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newPayment = {
        ...payment,
        invoice_id: "",
        amount: parseFloat(payment.amount),
        paid_on: new Date(payment.paid_on)
      };
      onPaymentAdded(newPayment);
      // Reset form
      setPayment({
        mode: 'CASH',
        amount: 0,
        paid_on: new Date().toISOString().split('T')[0],
        reference_id: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Add Payment</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
          <select
            name="mode"
            value={payment.mode}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
            <option value="WALLET">Wallet</option>
            <option value="INSURANCE">Insurance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            value={payment.amount}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
          <input
            type="date"
            name="paid_on"
            value={payment.paid_on}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
          <input
            type="text"
            name="reference_id"
            value={payment.reference_id}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={payment.notes}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adding Payment...
            </>
          ) : (
            'Add Payment'
          )}
        </button>
      </form>

      {/* Payment History Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Payment History</h3>
        {/* You would map through payment history here */}
        <div className="space-y-2">
          {/* Example payment history item */}
          <div className="p-2 border rounded-md">
            <div className="flex justify-between">
              <span className="font-medium">CASH</span>
              <span>$100.00</span>
            </div>
            <div className="text-sm text-gray-500">2023-05-15</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSidebar;