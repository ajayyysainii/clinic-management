import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { BACKEND_URL } from '../../utils/urlConstants';
import { Calendar, TrendingUp, IndianRupee, Users, CalendarDays, BarChart3, Settings, Clock, FileText, AlertCircle } from 'lucide-react';

const DoctorDailyEarnings = () => {
  const { doctorId, clinicId } = useParams();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
  });

  useEffect(() => {
    fetchEarnings();
  }, [doctorId, clinicId, dateRange]);

  const fetchEarnings = async () => {
    if (!doctorId || !clinicId) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authtoken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch daily earnings data from the new API endpoint
      const earningsResponse = await axios.get(
        `${BACKEND_URL}/doctor/billing/${doctorId}/${clinicId}/detailed-earnings?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { headers }
      );

      const data = earningsResponse.data?.data || [];
      console.log('📊 Received earnings data:', data);
      setEarnings(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPayoutModelColor = (model) => {
    const colors = {
      SALARIED: 'bg-blue-100 text-blue-800',
      PER_VISIT: 'bg-green-100 text-green-800',
      DAILY: 'bg-purple-100 text-purple-800',
      HYBRID: 'bg-orange-100 text-orange-800',
      NONE: 'bg-gray-100 text-gray-800',
    };
    return colors[model] || colors.NONE;
  };



  const calculateExpectedEarnings = () => {
    if (!earnings || earnings.length === 0) {
      return 0;
    }

    // Calculate total commission from all earnings records
    return earnings.reduce((total, earning) => total + (earning.commission_amount || 0), 0);
  };

  const calculateTotalRevenue = () => {
    if (!earnings || earnings.length === 0) {
      return 0;
    }

    // Calculate total revenue from all earnings records
    return earnings.reduce((total, earning) => total + (earning.invoice_amount || 0), 0);
  };

  const calculateTotalCommission = () => {
    if (!earnings || earnings.length === 0) {
      return 0;
    }

    // Calculate total commission from all earnings records
    return earnings.reduce((total, earning) => total + (earning.commission_amount || 0), 0);
  };

  const calculateAverageCommissionPercentage = () => {
    if (!earnings || earnings.length === 0) {
      return 0;
    }

    // Calculate average commission percentage
    const totalPercentage = earnings.reduce((total, earning) => total + (earning.commission_percentage || 0), 0);
    return totalPercentage / earnings.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No earnings data available</p>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering with earnings data:', earnings);

  if (!earnings || earnings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No daily earnings data found for this doctor.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Date Range</h3>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Earnings Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">Total Commission</p>
            <p className="text-2xl font-bold text-blue-800">
              {formatCurrency(calculateTotalCommission())}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">Avg Commission %</p>
            <p className="text-2xl font-bold text-green-800">
              {calculateAverageCommissionPercentage().toFixed(1)}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-800">
              {formatCurrency(calculateTotalRevenue())}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-600">Total Records</p>
            <p className="text-2xl font-bold text-orange-800">
              {earnings.length}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Daily Earnings Table */}
      {earnings && earnings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Detailed Daily Earnings ({earnings.length})</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                 
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Model</th>

                 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earnings.map((earning, index) => (
                  <tr key={earning._id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {earning.invoice_id?._id || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(earning.invoice_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(earning.invoice_amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {earning.commission_percentage?.toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(earning.commission_amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPayoutModelColor(earning.payout_model)}`}>
                        {earning.payout_model || 'N/A'}
                      </span>
                    </td>
                   
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDailyEarnings; 