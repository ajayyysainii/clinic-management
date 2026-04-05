import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import DownloadButton from '../ui/DownloadButton';
import { IndianRupee } from 'lucide-react';

const StaffPayoutList = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authtoken');
        const response = await axios.get(`${BACKEND_URL}/staff/billing/payout-configs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        console.log('API Response:', response.data); // Debug log
        
        // Handle different response structures
        let data = [];
        if (response.data?.data) {
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data?.payoutConfigs) {
          data = response.data.payoutConfigs;
        }
        
        console.log('Processed data:', data); // Debug log
        setConfigs(data);
      } catch (err) {
        console.error('Error fetching payout configs:', err);
        setError(err.response?.data?.error || 'Failed to fetch payout configs');
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  // Filter configs by staff, clinic, or model
  const filteredConfigs = configs.filter(cfg => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Safe property access with fallbacks
    const staffName = cfg.staff_id?.user_id?.name || cfg.staff_name || cfg.staffName || '';
    const clinicName = cfg.clinic_id?.name || cfg.clinic_name || cfg.clinicName || '';
    const model = cfg.model || '';
    
    return (
      staffName.toLowerCase().includes(searchLower) ||
      clinicName.toLowerCase().includes(searchLower) ||
      model.toLowerCase().includes(searchLower)
    );
  });

  // Helper function to safely get staff name
  const getStaffName = (cfg) => {
    return cfg.staff_id?.user_id?.name || 
           cfg.staff_name || 
           cfg.staffName || 
           cfg.staff_id?.name ||
           '-';
  };

  // Helper function to safely get clinic name
  const getClinicName = (cfg) => {
    return cfg.clinic_id?.name || 
           cfg.clinic_name || 
           cfg.clinicName ||
           '-';
  };

  // Helper function to safely get salary
  const getSalary = (cfg) => {
    if (cfg.model === 'SALARIED') {
      return cfg.fixed_salary || cfg.salary || cfg.monthly_salary || 0;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading staff salary configurations...</div>
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Staff Salary Configurations</h3>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search staff, clinic, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <DownloadButton />
          </div>
        </div>
      </div>
      
      {/* Debug info - remove in production */}
      <div className="px-6 py-2 bg-gray-50 text-xs text-gray-600">
        Total configs: {configs.length} | Filtered: {filteredConfigs.length}
      </div>
      
      <table className="w-full">
        <thead className="border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Salary</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
          </tr>
        </thead>
        <tbody>
          {filteredConfigs.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                {searchTerm ? 'No salary configurations found matching your search.' : 'No salary configurations found.'}
              </td>
            </tr>
          ) : (
            filteredConfigs.map((cfg, idx) => (
              <tr key={cfg._id || cfg.id || idx} className="hover:bg-gray-50 transition-colors duration-150 border-t border-gray-200">
                <td className="px-6 py-4 whitespace-nowrap">{getStaffName(cfg)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getClinicName(cfg)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cfg.model === 'SALARIED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {cfg.model || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cfg.model === 'SALARIED' && getSalary(cfg) ? (
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-700">
                        ₹{parseFloat(getSalary(cfg)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cfg.effective_from ? new Date(cfg.effective_from).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StaffPayoutList; 