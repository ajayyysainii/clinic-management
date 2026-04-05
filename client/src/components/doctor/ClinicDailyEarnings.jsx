import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { BACKEND_URL } from '../../utils/urlConstants';
import { Calendar, Users, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

const ClinicDailyEarnings = () => {
  const { clinicId } = useParams();
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchClinicEarnings();
  }, [clinicId, selectedDate]);

  const fetchClinicEarnings = async () => {
    if (!clinicId) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authtoken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `${BACKEND_URL}/doctor/billing/clinic/${clinicId}/daily-earnings?date=${selectedDate}`,
        { headers }
      );

      setEarnings(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch clinic earnings data');
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

  const calculateTotalEarnings = () => {
    return earnings.reduce((sum, earning) => sum + (earning.doctor_earnings || 0), 0);
  };

  const calculateTotalRevenue = () => {
    return earnings.reduce((sum, earning) => sum + (earning.total_revenue || 0), 0);
  };

  const calculateTotalAppointments = () => {
    return earnings.reduce((sum, earning) => sum + (earning.completed_appointments || 0), 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading clinic earnings data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Select Date</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Doctor Earnings</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotalEarnings())}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotalRevenue())}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{calculateTotalAppointments()}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Doctors Earnings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Doctors Daily Earnings</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No earnings data found for the selected date.
                  </td>
                </tr>
              ) : (
                earnings.map((earning, index) => (
                  <tr key={earning._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {earning.doctor_id?.user_id?.name?.charAt(0) || 'D'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {earning.doctor_id?.user_id?.name || 'Unknown Doctor'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {earning.doctor_id?.specialization || 'General'}
                          </div>
                        </div>
                      </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPayoutModelColor(earning.payout_model || 'NONE')}`}>
                         {earning.payout_model || 'NONE'}
                       </span>
                     </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {earning.appointments}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {formatCurrency(earning.revenue)}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                       {formatCurrency(earning.earnings)}
                     </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                       {earning.breakdown?.fixed_salary_portion > 0 && (
                         <div>Salary: {formatCurrency(earning.breakdown.fixed_salary_portion)}</div>
                       )}
                       {earning.breakdown?.commission_portion > 0 && (
                         <div>Commission: {formatCurrency(earning.breakdown.commission_portion)}</div>
                       )}
                       {earning.breakdown?.daily_rate_portion > 0 && (
                         <div>Daily Rate: {formatCurrency(earning.breakdown.daily_rate_portion)}</div>
                       )}
                       {earning.breakdown?.hybrid_portion > 0 && (
                         <div>Hybrid: {formatCurrency(earning.breakdown.hybrid_portion)}</div>
                       )}
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClinicDailyEarnings; 