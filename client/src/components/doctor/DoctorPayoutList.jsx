import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import DownloadButton from '../ui/DownloadButton';
import { Eye, IndianRupee } from 'lucide-react';

const DoctorPayoutList = () => {
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
        const response = await axios.get(`${BACKEND_URL}/doctor/billing/payout-configs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setConfigs(response.data?.data || []);
        console.log("🔍 Payout configs:", JSON.stringify(response.data?.data));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch payout configs');
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  // Filter configs by doctor, clinic, or model
  const filteredConfigs = configs.filter(cfg => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (cfg.doctor_id?.name?.toLowerCase() || '').includes(searchLower) ||
      (cfg.doctor_id?.email?.toLowerCase() || '').includes(searchLower) ||
      (cfg.clinic_id?.name?.toLowerCase() || '').includes(searchLower) ||
      (cfg.model?.toLowerCase() || '').includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading payout configs...</div>
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
        <div className="h-16 flex items-center justify-between px-10">
          <input
            type="text"
            placeholder="Search by Doctor (name/email), Clinic, or Model"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-1/3 rounded-xl bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-gray-300 px-3 py-2 transition duration-300 ease-in-out focus:border-blue-500 hover:border-blue-300 outline-none"
          />
          <div className='border border-gray-200 rounded-sm p-1 hover:scale-110 transition-all duration-300'>
            <DownloadButton />
          </div>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fixed Salary</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Visit %</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hybrid %</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConfigs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No payout configs found matching your search.' : 'No payout configs found.'}
                </td>
              </tr>
            ) : (
              filteredConfigs.map((cfg, idx) => (
                <tr key={cfg._id || idx} className="hover:bg-gray-50 transition-colors duration-150 border-t border-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cfg.doctor_id?.name || cfg.doctor_id?.email || (
                      typeof cfg.doctor_id === 'string' ? (
                        <span className="text-gray-500 text-sm">Doctor ID: {cfg.doctor_id}</span>
                      ) : (
                        <span className="text-red-500 text-sm">No doctor assigned</span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{cfg.clinic_id?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cfg.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cfg.fixed_salary ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cfg.daily_rate ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cfg.per_visit_percent ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cfg.hybrid_percent ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cfg.effective_from ? new Date(cfg.effective_from).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                                             <button
                         onClick={() => {
                           console.log('🔍 Doctor config data:', cfg);
                           console.log('👨‍⚕️ Doctor ID:', cfg.doctor_id);
                           console.log('🏥 Clinic ID:', cfg.clinic_id);
                           
                           // Handle both string doctor_id and object doctor_id
                           const doctorId = typeof cfg.doctor_id === 'string' ? cfg.doctor_id : cfg.doctor_id?._id;
                           
                           // Handle both string clinic_id and object clinic_id
                           const clinicId = typeof cfg.clinic_id === 'string' ? cfg.clinic_id : cfg.clinic_id?._id;
                           
                           if (!doctorId) {
                             alert('This payout config has no doctor assigned. Please recreate it with a valid doctor.');
                             return;
                           }
                           
                           if (!clinicId) {
                             alert('This payout config has no clinic assigned. Please recreate it with a valid clinic.');
                             return;
                           }
                           
                           window.open(`/clinic/doctor-earnings/${doctorId}/${clinicId}`, '_blank');
                         }}
                         className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                         title="View Daily Earnings"
                       >
                         <IndianRupee className="w-3 h-3" />
                         Earnings
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorPayoutList; 