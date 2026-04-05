import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

const TestEarningsCalculation = () => {
  const [formData, setFormData] = useState({
    doctorId: '',
    clinicId: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0]
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('authtoken');
      const response = await axios.post(
        `${BACKEND_URL}/doctor/billing/calculate-earnings-manual`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResult(response.data?.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Test Earnings Calculation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doctor ID
          </label>
          <input
            type="text"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinic ID
          </label>
          <input
            type="text"
            name="clinicId"
            value={formData.clinicId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

                 <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Start Date
           </label>
           <input
             type="date"
             name="startDate"
             value={formData.startDate}
             onChange={handleChange}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             required
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
             End Date
           </label>
           <input
             type="date"
             name="endDate"
             value={formData.endDate}
             onChange={handleChange}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
             required
           />
         </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Earnings'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
          <h3 className="font-semibold">Success!</h3>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestEarningsCalculation; 