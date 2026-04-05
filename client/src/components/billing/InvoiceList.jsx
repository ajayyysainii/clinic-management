import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router'
import { Plus, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { BACKEND_URL } from '../../utils/urlConstants';
import ActionList from '../ActionList';
import DoctorAvatar from '../ui/DoctorAvatar';
import DownloadButton from '../ui/DownloadButton';
import { exportToCSV, formatInvoiceDataForCSV } from '../../utils/csvExport';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gstLoading, setGstLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  // Filtered invoices based on search
  const filteredInvoices = invoices.filter(inv => {
    const patientName = inv.patient_id?.name?.toLowerCase() || '';
    const invoiceId = inv._id?.toLowerCase() || '';
    return (
      patientName.includes(searchTerm.toLowerCase()) ||
      invoiceId.includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authtoken');
        if (!token) throw new Error('No authentication token found');
        if (!user || !user.data) return;
        const res = await axios.get(`${BACKEND_URL}/patient/billing/clinic`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success) {
          setInvoices(res.data.data || []);
        } else {
          setInvoices([]);
          setError('No invoices found or API error');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error fetching invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [user]);

  const handleDeleteInvoice = async (invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice._id}?`)) return;
    try {
      const token = localStorage.getItem('authtoken');
      await axios.delete(`${BACKEND_URL}/patient/billing/${invoice._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(prev => prev.filter(inv => inv._id !== invoice._id));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete invoice');
    }
  };

  // Handler to generate GST invoice
  const handleGenerateGstInvoice = async (invoice) => {
    setGstLoading(true);
    try {
      const token = localStorage.getItem('authtoken');
      const res = await axios.post(
        `${BACKEND_URL}/forms/gstform/${invoice._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.gstPdfUrl) {
        // Update invoice in state to store GST invoice info
        setInvoices(prev => prev.map(inv =>
          inv._id === invoice._id
            ? { ...inv, gstInvoice: { exists: true, pdfUrl: res.data.gstPdfUrl } }
            : inv
        ));
        // Automatically open the generated PDF
        window.open(res.data.gstPdfUrl, '_blank');
      } else {
        alert('GST Invoice generated, but no PDF URL returned.');
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to generate GST invoice');
    } finally {
      setGstLoading(false);
    }
  };

  // Handler for CSV export
  const handleExportToCSV = async () => {
    if (invoices.length === 0) {
      alert('No invoices to export');
      return;
    }

    setIsExporting(true);
    try {
      const formattedData = formatInvoiceDataForCSV(invoices);
      const headers = ['Patient Name', 'Patient Email', 'Invoice Date', 'Total Amount', 'Status', 'Invoice ID'];
      exportToCSV(formattedData, 'invoices', headers);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {gstLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-blue-600 font-medium">Generating GST Invoice...</span>
          </div>
        </div>
      )}
      <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className='h-16 flex items-center justify-between px-4 sm:px-10 space-x-5 sm:space-y-0'>
            <input
              type="text"
              placeholder="Search Invoices by Patient or ID"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-1/3 rounded-xl bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-gray-300 px-3 py-2 transition duration-300 ease-in-out focus:border-blue-500 hover:border-blue-300 outline-none"
            />
            <div className='flex items-center gap-2 text-nowrap mx-0 sm:mx-5'>
              <div className='border border-gray-200 rounded-sm p-1 hover:scale-110 transition-all duration-300'>
                <DownloadButton onDownload={handleExportToCSV} loading={isExporting} />
              </div>
              <Link to="/add-invoice">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2">
                  <Plus size={16} />
                  New Invoice
                </button>
              </Link>
            </div>
          </div>

          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No invoices found matching your search.' : 'No invoices found.'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={inv._id} className="hover:bg-gray-50 transition-colors duration-150 border-t border-gray-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DoctorAvatar name={inv.patient_id?.name || 'Unknown'} id={idx} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {inv.patient_id?.name || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {inv.patient_id?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">Rs {inv.total_amount?.toFixed(2) ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">
                      <span className={
                        inv.status === 'PAID' ? 'text-green-600' :
                          inv.status === 'PARTIAL' ? 'text-yellow-600' :
                            'text-red-600'
                      }>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionList
                        item={inv}
                        actions={[
                          {
                            label: 'View',
                            icon: Eye,
                            onClick: (invoice) => {
                              if (invoice.invoicePdfUrl) {
                                window.open(invoice.invoicePdfUrl, '_blank');
                              } else {
                                alert('No PDF available for this invoice.');
                              }
                            },
                            className: 'text-blue-600 hover:bg-blue-50',
                          },
                          {
                            label: inv.gstInvoice && inv.gstInvoice.exists ? 'Show GST Invoice' : 'Create GST Invoice',
                            icon: FileText,
                            onClick: inv.gstInvoice && inv.gstInvoice.exists
                              ? (invoice) => {
                                if (invoice.gstInvoice && invoice.gstInvoice.pdfUrl) {
                                  window.open(invoice.gstInvoice.pdfUrl, '_blank');
                                } else {
                                  alert('No GST PDF available for this invoice.');
                                }
                              }
                              : handleGenerateGstInvoice,
                            className: inv.gstInvoice && inv.gstInvoice.exists
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-indigo-600 hover:bg-indigo-50',
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            onClick: handleDeleteInvoice,
                            className: 'text-red-600 hover:bg-red-50',
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default InvoiceList; 