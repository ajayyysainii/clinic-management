import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';

const ReferralList = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

 

  useEffect(() => {
    const fetchReferrals = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authtoken');  
        const res = await axios.get(`${BACKEND_URL}/api/form/referral/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setReferrals(res.data.data || []);
      } catch (error) {
        
        if (error.response?.status === 403) {
          setError('Access denied. You do not have permission to view referral forms.');
        } else if (error.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(`Failed to fetch referral forms: ${error.response?.data?.message || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [user]);

  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Referral Forms</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
      ) : referrals.length === 0 ? (
        <div className="p-4 text-sm text-gray-700 bg-gray-100 rounded-lg">No referral forms found.</div>
      ) : (
        <div className="overflow-x-auto text-nowrap">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.map((ref) => (
                <tr key={ref._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{ref.patientId?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ref.referredBy?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ref.referredTo?.doctorId?.name
                      ? ref.referredTo.doctorId.name
                      : ref.referredTo?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{ref.reasonForReferral}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ref.provisionalDiagnosis}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(ref.referralDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ref.pdfUrl && (
                      <button
                        onClick={() => window.open(ref.pdfUrl, '_blank')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReferralList; 