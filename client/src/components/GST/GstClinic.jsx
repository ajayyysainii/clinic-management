import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import DownloadButton from '../ui/DownloadButton';
import { exportToCSV, formatGstClinicDataForCSV } from '../../utils/csvExport';

const GstClinic = () => {
  const [gstInvoices, setGstInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchGstInvoices = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authtoken');
        const res = await axios.get(`${BACKEND_URL}/forms/gst-clinic-invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success) {
          setGstInvoices(res.data.data || []);
        } else {
          setGstInvoices([]);
          setError('No GST clinic invoices found or API error');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error fetching GST clinic invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchGstInvoices();
  }, []);

  const filteredInvoices = gstInvoices.filter(inv => {
    const customerName = inv.customerName?.toLowerCase() || '';
    const invoiceNumber = inv.invoiceNumber?.toLowerCase() || '';
    return (
      customerName.includes(searchTerm.toLowerCase()) ||
      invoiceNumber.includes(searchTerm.toLowerCase())
    );
  });

  // Handler for CSV export
  const handleExportToCSV = async () => {
    if (gstInvoices.length === 0) {
      alert('No GST invoices to export');
      return;
    }
    
    setIsExporting(true);
    try {
      const formattedData = formatGstClinicDataForCSV(gstInvoices);
      const headers = ['Invoice Number', 'Invoice Date', 'Customer Name', 'HSN/SAC Code', 'Taxable Value', 'CGST', 'SGST', 'Total GST', 'Place of Supply'];
      exportToCSV(formattedData, 'gst-clinic-invoices', headers);
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
          <div className="text-gray-500">Loading GST clinic invoices...</div>
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
    <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className='h-16 flex items-center justify-between px-10'>
          <input
            type="text"
            placeholder="Search GST Clinic Invoices by Customer or Invoice Number"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-1/3 rounded-xl bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-gray-300 px-3 py-2 transition duration-300 ease-in-out focus:border-blue-500 hover:border-blue-300 outline-none"
          />
          <div className='border border-gray-200 rounded-sm p-1 hover:scale-110 transition-all duration-300'>
            <DownloadButton onDownload={handleExportToCSV} loading={isExporting} />
          </div>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Value</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGST</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SGST</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total GST</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Place of Supply</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No GST clinic invoices found matching your search.' : 'No GST clinic invoices found.'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <tr key={inv._id} className="hover:bg-gray-50 transition-colors duration-150 border-t border-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.hsnOrSacCode}</td>
                                     <td className="px-6 py-4 whitespace-nowrap">Rs {inv.taxableValue?.toFixed(2)}</td>
                   <td className="px-6 py-4 whitespace-nowrap">Rs {inv.cgst?.toFixed(2)}</td>
                   <td className="px-6 py-4 whitespace-nowrap">Rs {inv.sgst?.toFixed(2)}</td>
                   <td className="px-6 py-4 whitespace-nowrap">Rs {inv.totalGst?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.placeOfSupply}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GstClinic; 