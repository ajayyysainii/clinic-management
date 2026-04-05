import React, { useState, useEffect } from 'react';
import numberToWords from 'number-to-words';
import { useNavigate } from 'react-router-dom';
import {BACKEND_URL} from '../../utils/urlConstants'
import {
  Plus,
  Trash2,
  IndianRupee,
  CreditCard,
  Smartphone,
  Wallet,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Percent,
  Tag,
  Sparkles,
  Receipt,
  Calculator,
  Zap,
  X,
  Check,
  AlertCircle,
  Calendar
} from 'lucide-react';
import axios from 'axios'
import Breadcrumbs from '../ui/Breadcrumbs';
import Autocomplete from '../ui/Autocomplete';
import { FormLoader } from '../ui/FormLoader';

const InvoiceForm = () => {
  const navigate = useNavigate();
  var converter = numberToWords.toWords;
  // Invoice items state
  const [items, setItems] = useState([
    {
      id: Date.now() + Math.random(),
      type: 'SERVICE',
      name: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      gst_rate: 0,
      gst_amount: 0,
      total_amount: 0
    }
  ]);

  // Payment state
  const [payments, setPayments] = useState([
    {
      id: Date.now(),
      mode: 'CASH',
      amount: 0,
      paid_on: new Date().toISOString().split('T')[0],
      reference_id: '',
      notes: ''
    }
  ]);

  // Invoice summary state
  const [subtotal, setSubtotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [amountDue, setAmountDue] = useState(0);
  const [status, setStatus] = useState('UNPAID');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Add new state for invoice-level discount
  const [invoiceDiscount, setInvoiceDiscount] = useState({
    type: 'PERCENTAGE',
    value: 0,
    reason: ''
  });
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState('');

  // Calculate invoice totals whenever items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const newTotalDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.discount / 100), 0);
    const newTaxAmount = items.reduce((sum, item) => sum + item.gst_amount, 0);

    // Calculate invoice-level discount amount
    let invoiceDiscountAmount = 0;
    if (invoiceDiscount.type === 'PERCENTAGE' && invoiceDiscount.value > 0) {
      invoiceDiscountAmount = (newSubtotal - newTotalDiscount) * (invoiceDiscount.value / 100);
    } else if (invoiceDiscount.type === 'FIXED' && invoiceDiscount.value > 0) {
      invoiceDiscountAmount = Math.min(invoiceDiscount.value, newSubtotal - newTotalDiscount);
    }

    const newTotalAmount = (newSubtotal - newTotalDiscount - invoiceDiscountAmount) + newTaxAmount;

    setSubtotal(newSubtotal);
    setTotalDiscount(newTotalDiscount + invoiceDiscountAmount);
    setTaxAmount(newTaxAmount);
    setTotalAmount(newTotalAmount);
  }, [items, invoiceDiscount]);

  // Calculate amount paid and due whenever payments change
  useEffect(() => {
    const newAmountPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount.toString()) || 0), 0);
    setAmountPaid(newAmountPaid);
    setAmountDue(totalAmount - newAmountPaid);

    // Update status based on payments
    if (newAmountPaid >= totalAmount) {
      setStatus('PAID');
    } else if (newAmountPaid > 0) {
      setStatus('PARTIAL');
    } else {
      setStatus('UNPAID');
    }
  }, [payments, totalAmount]);

  // Auto-update first payment amount to match total amount
  useEffect(() => {
    if (totalAmount > 0 && payments.length > 0) {
      // Only update if the first payment amount is 0 or if it's the initial load
      const firstPayment = payments[0];
      if (firstPayment && (firstPayment.amount === 0 || firstPayment.amount === '')) {
        setPayments(payments.map((payment, index) => {
          if (index === 0) {
            return {
              ...payment,
              amount: totalAmount
            };
          }
          return payment;
        }));
      }
    }
  }, [totalAmount]); // Only depend on totalAmount to avoid infinite loops

  // Fetch appointments for the clinic on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authtoken');
        const response = await axios.get(`${BACKEND_URL}/appointments/clinic`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data.data)
        setAppointments(response.data.data || []);
      } catch {
        setError('Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Invoice item handlers
  const handleAddItem = () => {
    try {
      console.log('Add Item button clicked!'); // Debug log
      const newItem = {
        id: Date.now() + Math.random(), // Ensure unique ID
        type: 'SERVICE',
        name: '',
        quantity: 1,
        unit_price: 0,
        discount: 0,
        gst_rate: 0,
        gst_amount: 0,
        total_amount: 0
      };
      
      console.log('Creating new item:', newItem); // Debug log
      console.log('Current items before adding:', items); // Debug log
      
      setItems(prevItems => {
        const updatedItems = [...prevItems, newItem];
        console.log('Updated items after adding:', updatedItems); // Debug log
        return updatedItems;
      });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleInputChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        // Calculate GST amount and total amount when relevant fields change
        if (["quantity", "unit_price", "discount", "gst_rate"].includes(field)) {
          const subtotal = updatedItem.quantity * updatedItem.unit_price;
          const discountAmount = subtotal * (updatedItem.discount / 100);
          const amountAfterDiscount = subtotal - discountAmount;
          updatedItem.gst_amount = amountAfterDiscount * (updatedItem.gst_rate / 100);
          updatedItem.total_amount = amountAfterDiscount + updatedItem.gst_amount;
        }

        return updatedItem;
      }
      return item;
    }));
  };

  // Handle inventory item selection for consumables
  const handleInventoryItemSelect = (id, inventoryItem) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          name: inventoryItem.itemName,
          unit_price: inventoryItem.sellingPrice || inventoryItem.costPrice || 0,
          // Store inventory reference for potential stock updates
          inventoryItemId: inventoryItem._id,
          inventoryQuantity: inventoryItem.quantity,
          inventoryUnit: inventoryItem.unit,
        };

        // Recalculate totals
        const subtotal = updatedItem.quantity * updatedItem.unit_price;
        const discountAmount = subtotal * (updatedItem.discount / 100);
        const amountAfterDiscount = subtotal - discountAmount;
        updatedItem.gst_amount = amountAfterDiscount * (updatedItem.gst_rate / 100);
        updatedItem.total_amount = amountAfterDiscount + updatedItem.gst_amount;

        return updatedItem;
      }
      return item;
    }));
  };

  // Handle service selection for services
  const handleServiceSelect = (id, serviceItem) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          name: serviceItem.serviceName,
          unit_price: serviceItem.sellingPrice || serviceItem.basePrice || 0,
          // Store service reference
          serviceItemId: serviceItem._id,
          serviceDuration: serviceItem.duration,
        };

        // Recalculate totals
        const subtotal = updatedItem.quantity * updatedItem.unit_price;
        const discountAmount = subtotal * (updatedItem.discount / 100);
        const amountAfterDiscount = subtotal - discountAmount;
        updatedItem.gst_amount = amountAfterDiscount * (updatedItem.gst_rate / 100);
        updatedItem.total_amount = amountAfterDiscount + updatedItem.gst_amount;

        return updatedItem;
      }
      return item;
    }));
  };

  // Payment handlers
  const handleAddPayment = () => {
    // Calculate remaining amount due
    const currentAmountPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount.toString()) || 0), 0);
    const remainingAmount = Math.max(0, totalAmount - currentAmountPaid);
    
    setPayments([
      ...payments,
      {
        id: Date.now(),
        mode: 'CASH',
        amount: remainingAmount > 0 ? remainingAmount : 0,
        paid_on: new Date().toISOString().split('T')[0],
        reference_id: '',
        notes: ''
      }
    ]);
  };

  const handleRemovePayment = (id) => {
    setPayments(payments.filter(payment => payment.id !== id));
  };

  const handlePaymentChange = (id, field, value) => {
    setPayments(payments.map(payment => {
      if (payment.id === id) {
        const updatedPayment = { ...payment, [field]: value };
        
        // If amount is being changed, recalculate remaining payments
        if (field === 'amount') {
          const currentAmountPaid = payments.reduce((sum, p) => {
            if (p.id === id) return sum; // Exclude current payment from calculation
            return sum + (parseFloat(p.amount.toString()) || 0);
          }, 0) + (parseFloat(value) || 0);
          
          const remainingAmount = Math.max(0, totalAmount - currentAmountPaid);
          
          // If there's remaining amount and this is the last payment, auto-fill it
          if (remainingAmount > 0 && payments.length > 1) {
            const lastPaymentIndex = payments.findIndex(p => p.id === id);
            if (lastPaymentIndex === payments.length - 1) {
              // This is the last payment, auto-fill remaining amount
              updatedPayment.amount = parseFloat(value) + remainingAmount;
            }
          }
        }
        
        return updatedPayment;
      }
      return payment;
    }));
  };

  // Function to auto-distribute total amount across payments
  const autoDistributeAmount = () => {
    if (payments.length === 0 || totalAmount <= 0) return;
    
    const newPayments = [...payments];
    const amountPerPayment = totalAmount / newPayments.length;
    
    newPayments.forEach((payment, index) => {
              if (index === newPayments.length - 1) {
          // Last payment gets the remaining amount to avoid rounding issues
          const previousAmounts = newPayments.slice(0, index).reduce((sum) => sum + amountPerPayment, 0);
          payment.amount = totalAmount - previousAmounts;
        } else {
          payment.amount = amountPerPayment;
        }
    });
    
    setPayments(newPayments);
  };

  // Add handler for invoice discount changes
  const handleInvoiceDiscountChange = (field, value) => {
    setInvoiceDiscount({
      ...invoiceDiscount,
      [field]: value
    });
  };

  // Add function to apply invoice discount
  const applyInvoiceDiscount = () => {
    setShowDiscountModal(false);
  };

  // Add function to remove invoice discount
  const removeInvoiceDiscount = () => {
    setInvoiceDiscount({
      type: 'PERCENTAGE',
      value: 0,
      reason: ''
    });
  };

  // Get icon for payment mode
  const getPaymentModeIcon = (mode) => {
    switch (mode) {
      case 'CASH': return <IndianRupee size={20} className="text-green-500" />;
      case 'CARD': return <CreditCard size={20} className="text-blue-500" />;
      case 'UPI': return <Smartphone size={20} className="text-purple-500" />;
      case 'WALLET': return <Wallet size={20} className="text-orange-500" />;
      case 'INSURANCE': return <HeartPulse size={20} className="text-red-500" />;
      default: return <IndianRupee size={20} className="text-green-500" />;
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCreatingInvoice(true);
    setError('');
    
    // Determine payment method
    const selectedPaymentMethod = payments.some(payment => payment.mode !== 'CASH') ? 'ONLINE' : 'CASH';
    
    const selectedAppointment = appointments.find(app => app._id === appointmentId);
    const patientId = selectedAppointment?.clinicPatient?.userId || '';
    
    // For cash payments, create invoice directly
    if (selectedPaymentMethod === 'CASH') {
      const invoiceData = {
        invoice: {
          appointment_id: appointmentId,
          patient_id: patientId,
          subtotal,
          discount: totalDiscount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          amount_word: converter(totalAmount),
          amount_paid: amountPaid,
          amount_due: amountDue,
          status,
        },
        items,
        payments,
        paymentMethod: selectedPaymentMethod
      };

      try {
        const token = localStorage.getItem('authtoken')
        const headers = {
          'Authorization': `Bearer ${token}`,
        };
        
        const response = await axios.post(`${BACKEND_URL}/patient/billing/`, invoiceData, { headers });
        
        if (response.data.success) {
          resetForm();
          alert('Invoice created successfully!');
          navigate('/invoice-list');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error creating invoice');
      } finally {
        setLoading(false);
        setCreatingInvoice(false);
      }
      return;
    }

    // For non-cash payments, create payment order first
    try {
      const token = localStorage.getItem('authtoken')
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      
      // Create payment order
      const paymentOrderData = {
        amount: totalAmount,
        currency: 'INR',
        receipt: `invoice_payment_${Date.now()}`,
        notes: {
          appointment_id: appointmentId,
          patient_id: patientId,
          clinic_id: selectedAppointment?.clinic || '',
        }
      };
      
      const orderResponse = await axios.post(`${BACKEND_URL}/patient/billing/create-payment-order`, paymentOrderData, { headers });
      
      if (orderResponse.data.success) {
        // Store invoice data for after payment completion
        const invoiceData = {
          invoice: {
            appointment_id: appointmentId,
            patient_id: patientId,
            subtotal,
            discount: totalDiscount,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            amount_word: converter(totalAmount),
            amount_paid: amountPaid,
            amount_due: amountDue,
            status,
          },
          items,
          payments,
          paymentMethod: selectedPaymentMethod
        };
        
        setCurrentInvoice({
          razorpay_order: orderResponse.data.data,
          invoice_data: invoiceData
        });

        setShowPaymentModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating payment order');
    } finally {
      setLoading(false);
      setCreatingInvoice(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setAppointmentId('');
    setItems([
      {
        id: Date.now(),
        type: 'SERVICE',
        name: '',
        quantity: 1,
        unit_price: 0,
        discount: 0,
        gst_rate: 0,
        gst_amount: 0,
        total_amount: 0
      }
    ]);
    setPayments([
      {
        id: Date.now(),
        mode: 'CASH',
        amount: 0,
        paid_on: new Date().toISOString().split('T')[0],
        reference_id: '',
        notes: ''
      }
    ]);
    setInvoiceDiscount({ type: 'PERCENTAGE', value: 0, reason: '' });
    setSubtotal(0);
    setTotalDiscount(0);
    setTaxAmount(0);
    setTotalAmount(0);
    setAmountPaid(0);
    setAmountDue(0);
    setStatus('UNPAID');
    setError('');
    setCreatingInvoice(false);
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    if (!currentInvoice || !currentInvoice.razorpay_order) {
      setError('Payment order not found');
      return;
    }

    const options = {
      key: import.meta.env.VITE_APP_RAZORPAY_KEY_ID || "rzp_test_u5bPjgtTwwvMlQ",
      amount: currentInvoice.razorpay_order.amount,
      currency: currentInvoice.razorpay_order.currency,
      name: 'Preva Care',
      description: 'Medical Invoice Payment',
      order_id: currentInvoice.razorpay_order.order_id,
      handler: async function (response) {
        try {
          // Close payment modal and show creating invoice loader
          setShowPaymentModal(false);
          setCreatingInvoice(true);
          
          const token = localStorage.getItem('authtoken');
          const headers = {
            'Authorization': `Bearer ${token}`,
          };
          
          // First verify the payment
          const paymentData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };
          
          const verificationResponse = await axios.post(`${BACKEND_URL}/patient/billing/verify-payment`, paymentData, { headers });
          
          if (verificationResponse.data.success) {
            // Now create the invoice with payment details
            const invoiceData = {
              ...currentInvoice.invoice_data,
              payment_details: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                verified: true
              }
            };
            
            const invoiceResponse = await axios.post(`${BACKEND_URL}/patient/billing/create-invoice-with-payment`, invoiceData, { headers });
            
            if (invoiceResponse.data.success) {
              setCurrentInvoice(null);
              setCreatingInvoice(false);
              resetForm();
              alert('Payment completed successfully! Invoice created.');
              navigate('/invoice-list');
            } else {
              setCreatingInvoice(false);
              setError('Failed to create invoice after payment');
            }
          } else {
            setCreatingInvoice(false);
            setError('Payment verification failed');
          }
        } catch (err) {
          setCreatingInvoice(false);
          setError(err.response?.data?.message || err.message || 'Payment verification failed');
        }
      },
      prefill: {
        name: currentInvoice.invoice_data.invoice.patient_name || '',
        email: '',
        contact: '',
      },
      theme: {
        color: '#3B82F6',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  // Add go back handler
  const goBack = () => {
    navigate('/invoice-list')
  };

  return (
    <>
      <Breadcrumbs />
      <div className="min-h-screen bg-white relative mobile-scroll-container">
        {/* Success/Error notifications */}
        {(error) && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 sm:p-4 rounded-xl bg-white border shadow-lg transition-all duration-300 border-red-200 text-red-600`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen">
          {/* Main Invoice Form */}
          <div className="w-full lg:w-2/3 transition-all duration-500 ease-in-out">
            <div className="p-4 sm:p-6 lg:p-8 lg:h-full lg:overflow-y-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
                
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium shadow-sm transition-all duration-300 text-sm sm:text-base"
                >
                  <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Go Back</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="group relative flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 rounded-xl text-white font-bold text-base sm:text-lg shadow hover:shadow-md hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {loading ? (
                    <FormLoader size="md" text="Creating Invoice..." />
                  ) : (
                    <>
                      <span className="hidden sm:inline">Create Invoice</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  )}
                </button>
              </div>
              {/* Appointment selection dropdown */}
              <div className="mb-6 lg:mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 shadow p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                     <Calendar className="text-blue-500 flex-shrink-0 sm:w-7 sm:h-7" size={24} />
                  <div className="flex-1 w-full">
                    <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">Select Appointment</label>
                    <select
                      value={appointmentId}
                      onChange={e => setAppointmentId(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                      required
                    >
                      <option value="">-- Select an appointment --</option>
                      {appointments.map(app => (
                        <option key={app._id} value={app._id}>
                          {app.clinicPatient?.user?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6 lg:mb-8">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Calculator size={20} className="sm:w-6 sm:h-6 text-blue-500" />
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Invoice Items</h2>
                      </div>
                                             <button
                         type="button"
                         onClick={handleAddItem}
                         className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 rounded-xl text-white font-medium shadow hover:shadow-md hover:bg-blue-600 transition-all duration-300 w-full sm:w-auto"
                       >
                         <div className="flex items-center justify-center sm:justify-start gap-2">
                           <Plus size={18} className="sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                           <span>Add Item</span>
                         </div>
                       </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 overflow-x-auto">
                    <div className="min-w-full">
                      {/* Desktop Table Header */}
                      <div className="hidden lg:grid grid-cols-9 gap-4 mb-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        <div>Type</div>
                        <div className="col-span-2">Name</div>
                        <div>Qty</div>
                        <div>Unit Price</div>
                        <div>Discount %</div>
                        <div>GST %</div>
                        <div>GST Amount</div>
                        <div>Action</div>
                      </div>

                      {/* Desktop Table Rows */}
                      <div className="hidden lg:block lg:space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="grid grid-cols-9 gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-300 group">
                            <div>
                              <select
                                value={item.type}
                                onChange={(e) => handleInputChange(item.id, 'type', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                              >
                                <option value="SERVICE" className="bg-white text-gray-800">Service</option>
                                <option value="CONSUMABLE" className="bg-white text-gray-800">Consumable</option>
                              </select>
                            </div>
                            <div className='col-span-2'>
                              {item.type === 'CONSUMABLE' ? (
                                <div className="space-y-2">
                                  <Autocomplete
                                    value={item.name}
                                    onChange={(value) => handleInputChange(item.id, 'name', value)}
                                    onSelect={(inventoryItem) => handleInventoryItemSelect(item.id, inventoryItem)}
                                    placeholder="Search inventory items..."
                                    searchEndpoint="/inventory/search"
                                    searchParams={{}}
                                    minQueryLength={2}
                                    debounceMs={300}
                                    maxResults={8}
                                    className="w-full"
                                    noResultsMessage="No consumables found"
                                    loadingMessage="Searching inventory..."
                                  />
                                  {item.inventoryItemId && (
                                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                                      <div>Stock: {item.inventoryQuantity} {item.inventoryUnit}</div>
                                      <div>Price: ₹{item.unit_price}</div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Autocomplete
                                    value={item.name}
                                    onChange={(value) => handleInputChange(item.id, 'name', value)}
                                    onSelect={(serviceItem) => handleServiceSelect(item.id, serviceItem)}
                                    placeholder="Search services..."
                                    searchEndpoint="/services/search"
                                    searchParams={{}}
                                    minQueryLength={2}
                                    debounceMs={300}
                                    maxResults={8}
                                    className="w-full"
                                    noResultsMessage="No services found"
                                    loadingMessage="Searching services..."
                                    renderOption={(service) => (
                                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer">
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-900">{service.serviceName}</div>
                                          {service.description && (
                                            <div className="text-sm text-gray-500">{service.description}</div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-medium text-gray-900">
                                            ₹{service.sellingPrice || service.basePrice || 0}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {service.duration} min
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  />
                                  {item.serviceItemId && (
                                    <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
                                      <div>Duration: {item.serviceDuration} minutes</div>
                                      <div>Price: ₹{item.unit_price}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleInputChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => handleInputChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) => handleInputChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={item.gst_rate}
                                onChange={(e) => handleInputChange(item.id, 'gst_rate', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                              />
                            </div>
                            <div className="flex items-center">
                              <span className="text-green-600 font-medium">₹{item.gst_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                                             {/* Mobile Table Rows */}
                       <div className="block lg:hidden space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <select
                                  value={item.type}
                                  onChange={(e) => handleInputChange(item.id, 'type', e.target.value)}
                                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                >
                                  <option value="SERVICE" className="bg-white text-gray-800">Service</option>
                                  <option value="CONSUMABLE" className="bg-white text-gray-800">Consumable</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-300"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {item.type === 'CONSUMABLE' ? (
                                <div className="space-y-2">
                                  <Autocomplete
                                    value={item.name}
                                    onChange={(value) => handleInputChange(item.id, 'name', value)}
                                    onSelect={(inventoryItem) => handleInventoryItemSelect(item.id, inventoryItem)}
                                    placeholder="Search inventory items..."
                                    searchEndpoint="/inventory/search"
                                    searchParams={{}}
                                    minQueryLength={2}
                                    debounceMs={300}
                                    maxResults={8}
                                    className="w-full"
                                    noResultsMessage="No consumables found"
                                    loadingMessage="Searching inventory..."
                                  />
                                  {item.inventoryItemId && (
                                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                                      <div>Stock: {item.inventoryQuantity} {item.inventoryUnit}</div>
                                      <div>Price: ₹{item.unit_price}</div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Autocomplete
                                    value={item.name}
                                    onChange={(value) => handleInputChange(item.id, 'name', value)}
                                    onSelect={(serviceItem) => handleServiceSelect(item.id, serviceItem)}
                                    placeholder="Search services..."
                                    searchEndpoint="/services/search"
                                    searchParams={{}}
                                    minQueryLength={2}
                                    debounceMs={300}
                                    maxResults={8}
                                    className="w-full"
                                    noResultsMessage="No services found"
                                    loadingMessage="Searching services..."
                                    renderOption={(service) => (
                                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer">
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-900">{service.serviceName}</div>
                                          {service.description && (
                                            <div className="text-sm text-gray-500">{service.description}</div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-medium text-gray-900">
                                            ₹{service.sellingPrice || service.basePrice || 0}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {service.duration} min
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  />
                                  {item.serviceItemId && (
                                    <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
                                      <div>Duration: {item.serviceDuration} minutes</div>
                                      <div>Price: ₹{item.unit_price}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleInputChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => handleInputChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.discount}
                                  onChange={(e) => handleInputChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">GST %</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.gst_rate}
                                  onChange={(e) => handleInputChange(item.id, 'gst_rate', parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                />
                              </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-600">GST Amount: <span className="text-green-600 font-medium">₹{item.gst_amount.toFixed(2)}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="mb-6 lg:mb-8">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Sparkles size={20} className="sm:w-6 sm:h-6 text-blue-500" />
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Invoice Summary</h2>
                      </div>
                      <button
                        onClick={() => setShowDiscountModal(true)}
                        className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 rounded-xl text-white font-medium shadow hover:shadow-md hover:bg-blue-600 transition-all duration-300 w-full sm:w-auto"
                      >
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <Tag size={18} className="sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                          <span className="hidden sm:inline">Apply Discount</span>
                          <span className="sm:hidden">Discount</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                          <span className="text-gray-600 text-sm sm:text-base">Subtotal</span>
                          <span className="text-gray-800 font-bold text-base sm:text-lg">₹{subtotal.toFixed(2)}</span>
                        </div>

                        {invoiceDiscount.value > 0 && (
                          <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-xl border border-blue-100">
                            <span className="text-blue-600 text-sm sm:text-base">
                              Invoice Discount ({invoiceDiscount.type === 'PERCENTAGE' ? `${invoiceDiscount.value}%` : `₹${invoiceDiscount.value}`})
                            </span>
                            <span className="text-blue-600 font-bold text-sm sm:text-base">
                              -₹{(invoiceDiscount.type === 'PERCENTAGE'
                                ? ((subtotal - items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.discount / 100), 0)) * invoiceDiscount.value / 100).toFixed(2)
                                : Math.min(invoiceDiscount.value, subtotal - items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.discount / 100), 0)).toFixed(2))}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                          <span className="text-gray-600 text-sm sm:text-base">Item Discounts</span>
                          <span className="text-orange-600 font-bold text-sm sm:text-base">-₹{(totalDiscount - (invoiceDiscount.value > 0 ?
                            (invoiceDiscount.type === 'PERCENTAGE'
                              ? (subtotal - items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.discount / 100), 0)) * invoiceDiscount.value / 100
                              : Math.min(invoiceDiscount.value, subtotal - items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.discount / 100), 0)))
                            : 0)).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                          <span className="text-gray-600 text-sm sm:text-base">Total GST</span>
                          <span className="text-green-600 font-bold text-sm sm:text-base">₹{taxAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="text-center p-6 sm:p-8 bg-blue-50 rounded-2xl border border-blue-100 w-full">
                          <div className="text-2xl sm:text-3xl font-bold text-blue-500 mb-2">₹{totalAmount.toFixed(2)}</div>
                          <div className="text-gray-600 text-xs sm:text-sm uppercase tracking-wide">Grand Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Sidebar */}
          <div className="w-full lg:w-1/3 bg-white border-t lg:border-l border-gray-200 shadow-lg lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto order-first lg:order-last">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 sm:p-3 bg-blue-500 rounded-2xl shadow">
                  <IndianRupee size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Payment Details</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Manage payment methods</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:bg-gray-50 transition-all duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          {getPaymentModeIcon(payment.mode)}
                          <select
                            value={payment.mode}
                            onChange={(e) => handlePaymentChange(payment.id, 'mode', e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="CASH" className="bg-white text-gray-800">Cash</option>
                            <option value="CARD" className="bg-white text-gray-800">Card</option>
                            <option value="UPI" className="bg-white text-gray-800">UPI</option>
                            <option value="WALLET" className="bg-white text-gray-800">Wallet</option>
                            <option value="INSURANCE" className="bg-white text-gray-800">Insurance</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(payment.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Amount
                            {payment.amount === totalAmount && totalAmount > 0 && (
                              <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                Auto-filled
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={payment.amount}
                            onChange={(e) => handlePaymentChange(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                              payment.amount === totalAmount && totalAmount > 0 ? 'border-green-300 bg-green-50' : ''
                            }`}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Date</label>
                          <input
                            type="date"
                            value={payment.paid_on}
                            onChange={(e) => handlePaymentChange(payment.id, 'paid_on', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        {/* <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-2">Reference ID</label>
                          <input
                            type="text"
                            value={payment.reference_id}
                            onChange={(e) => handlePaymentChange(payment.id, 'reference_id', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="Transaction reference"
                          />
                        </div> */}

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-2">Notes</label>
                          <textarea
                            value={payment.notes}
                            onChange={(e) => handlePaymentChange(payment.id, 'notes', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                            rows={2}
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="w-full py-3 bg-gray-50 border border-blue-200 rounded-xl text-blue-500 font-medium hover:bg-blue-50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Plus size={20} />
                      Add Payment Method
                    </div>
                  </button>

                  {/* Auto-distribute button */}
                  {payments.length > 1 && totalAmount > 0 && (
                    <button
                      type="button"
                      onClick={autoDistributeAmount}
                      className="w-full py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 font-medium hover:bg-green-100 transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Calculator size={20} />
                        Auto-Distribute Amount
                      </div>
                    </button>
                  )}


                  {/* Payment Summary */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-base sm:text-lg">Grand Total</span>
                      <span className="text-xl sm:text-2xl font-bold text-gray-800">₹{totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-base sm:text-lg">Total Paid</span>
                      <span className="text-lg sm:text-xl font-bold text-green-600">₹{amountPaid.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className={`flex justify-between items-center ${amountDue > 0 ? 'text-red-600' : amountDue < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        <span className="text-base sm:text-lg font-medium">
                          {amountDue > 0 ? 'Balance Due' : amountDue < 0 ? 'Overpaid' : 'Fully Paid'}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold">₹{Math.abs(amountDue).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-600 text-sm sm:text-base">Status</span>
                      <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${status === 'PAID' ? 'bg-green-100 text-green-800 border border-green-200' :
                          status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                        {status}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button removed from sidebar */}
                </div>
              </form>
            </div>
          </div>

          {/* Discount Modal */}
          {showDiscountModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-xl">
                        <Percent size={18} className="sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">Apply Invoice Discount</h3>
                    </div>
                    <button
                      onClick={() => setShowDiscountModal(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300"
                    >
                      <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-3">Discount Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleInvoiceDiscountChange('type', 'PERCENTAGE')}
                        className={`p-3 rounded-xl border transition-all duration-300 ${invoiceDiscount.type === 'PERCENTAGE'
                            ? 'bg-blue-100 border-blue-200 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        <Percent size={16} className="mx-auto mb-1" />
                        <div className="text-sm font-medium">Percentage</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInvoiceDiscountChange('type', 'FIXED')}
                        className={`p-3 rounded-xl border transition-all duration-300 ${invoiceDiscount.type === 'FIXED'
                            ? 'bg-blue-100 border-blue-200 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        <IndianRupee size={16} className="mx-auto mb-1" />
                        <div className="text-sm font-medium">Fixed Amount</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {invoiceDiscount.type === 'PERCENTAGE' ? 'Percentage' : 'Amount'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={invoiceDiscount.type === 'PERCENTAGE' ? '100' : undefined}
                      step={invoiceDiscount.type === 'PERCENTAGE' ? '1' : '0.01'}
                      value={invoiceDiscount.value}
                      onChange={(e) => handleInvoiceDiscountChange('value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder={invoiceDiscount.type === 'PERCENTAGE' ? '0' : '0.00'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Reason (Optional)</label>
                    <input
                      type="text"
                      value={invoiceDiscount.reason}
                      onChange={(e) => handleInvoiceDiscountChange('reason', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Reason for discount..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {invoiceDiscount.value > 0 && (
                      <button
                        type="button"
                        onClick={removeInvoiceDiscount}
                        className="flex-1 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-100 transition-all duration-300"
                      >
                        Remove Discount
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDiscountModal(false)}
                      className="flex-1 py-3 bg-white border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyInvoiceDiscount}
                      className="flex-1 py-3 bg-blue-500 rounded-xl text-white font-medium hover:bg-blue-600 transition-all duration-300"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Modal */}
          {showPaymentModal && currentInvoice && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-xl">
                        <CreditCard size={18} className="sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">Complete Payment</h3>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300"
                    >
                      <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Invoice Payment</h4>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">Amount to pay: ₹{currentInvoice.invoice_data.invoice.total_amount}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleRazorpayPayment}
                      className="w-full py-3 sm:py-4 bg-blue-500 rounded-xl text-white font-medium hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <CreditCard size={18} className="sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Pay with Razorpay</span>
                      <span className="sm:hidden">Pay Now</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="w-full py-3 bg-white border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Creating Invoice Loader */}
          {creatingInvoice && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl">
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Creating Invoice</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Please wait while we process your request and create the invoice...</p>
                  <div className="mt-4 flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
export default InvoiceForm;

