import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { IndianRupee, Calendar as CalendarIcon, Percent, UserCheck } from 'lucide-react';
import { FormLoader } from '../ui/FormLoader';

const payoutModels = [
  'NONE',
  'SALARIED',
  'PER_VISIT',
  'DAILY',
  'HYBRID',
];

const payoutModelFieldMap = {
  SALARIED: ['fixed_salary'],
  DAILY: ['daily_rate'],
  PER_VISIT: ['per_visit_percent'],
  HYBRID: ['fixed_salary', 'hybrid_percent'],
};

const fieldHelpers = {
  fixed_salary: 'Monthly fixed salary for the doctor.',
  daily_rate: 'Amount paid per working day.',
  per_visit_percent: 'Percentage of each visit fee paid to the doctor.',
  hybrid_percent: 'Percentage for hybrid payout (used with fixed salary).',
  effective_from: 'Date from which this payout config is effective.',
};

const DoctorPayoutForm = ({ doctorId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    model: '',
    fixed_salary: '',
    daily_rate: '',
    per_visit_percent: '',
    hybrid_percent: '',
    effective_from: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.model) errs.model = 'Payout model is required.';
    if (form.model === 'SALARIED' && !form.fixed_salary) errs.fixed_salary = 'Fixed salary is required.';
    if (form.model === 'DAILY' && !form.daily_rate) errs.daily_rate = 'Daily rate is required.';
    if (form.model === 'PER_VISIT' && !form.per_visit_percent) errs.per_visit_percent = 'Percent is required.';
    if (form.model === 'HYBRID') {
      if (!form.fixed_salary) errs.fixed_salary = 'Fixed salary is required.';
      if (!form.hybrid_percent) errs.hybrid_percent = 'Hybrid percent is required.';
    }
    if (!form.effective_from) errs.effective_from = 'Effective from date is required.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authtoken');
      console.log('📝 Submitting payout config for doctor:', doctorId);
      console.log('📊 Form data:', form);
      
      const response = await axios.post(
        `${BACKEND_URL}/doctor/billing/${doctorId}/payout-config`,
        {
          ...form,
          fixed_salary: form.fixed_salary || undefined,
          daily_rate: form.daily_rate || undefined,
          per_visit_percent: form.per_visit_percent || undefined,
          hybrid_percent: form.hybrid_percent || undefined,
          effective_from: form.effective_from || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('✅ Payout config created successfully:', response.data);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payout config');
    } finally {
      setLoading(false);
    }
  };

  // Determine which fields to show based on model
  const visibleFields = form.model && payoutModelFieldMap[form.model] ? payoutModelFieldMap[form.model] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 flex ">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-6">
              <IndianRupee className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Doctor Payout Configuration</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payout Model *</label>
                <select
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  required
                >
                  <option value="">Select Model</option>
                  {payoutModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {fieldErrors.model && <p className="text-red-500 text-sm mt-1">{fieldErrors.model}</p>}
              </div>
              {visibleFields.includes('fixed_salary') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Salary *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="fixed_salary"
                      value={form.fixed_salary}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      step="0.01"
                      min="0"
                      placeholder="Enter fixed salary"
                      required
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{fieldHelpers.fixed_salary}</p>
                  {fieldErrors.fixed_salary && <p className="text-red-500 text-sm mt-1">{fieldErrors.fixed_salary}</p>}
                </div>
              )}
              {visibleFields.includes('daily_rate') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="daily_rate"
                      value={form.daily_rate}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      step="0.01"
                      min="0"
                      placeholder="Enter daily rate"
                      required
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{fieldHelpers.daily_rate}</p>
                  {fieldErrors.daily_rate && <p className="text-red-500 text-sm mt-1">{fieldErrors.daily_rate}</p>}
                </div>
              )}
              {visibleFields.includes('per_visit_percent') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Per Visit Percent *</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="per_visit_percent"
                      value={form.per_visit_percent}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Enter percent (0-100)"
                      required
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{fieldHelpers.per_visit_percent}</p>
                  {fieldErrors.per_visit_percent && <p className="text-red-500 text-sm mt-1">{fieldErrors.per_visit_percent}</p>}
                </div>
              )}
              {visibleFields.includes('hybrid_percent') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hybrid Percent *</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="hybrid_percent"
                      value={form.hybrid_percent}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Enter percent (0-100)"
                      required
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{fieldHelpers.hybrid_percent}</p>
                  {fieldErrors.hybrid_percent && <p className="text-red-500 text-sm mt-1">{fieldErrors.hybrid_percent}</p>}
                </div>
              )}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Effective From *</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    name="effective_from"
                    value={form.effective_from}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">{fieldHelpers.effective_from}</p>
                {fieldErrors.effective_from && <p className="text-red-500 text-sm mt-1">{fieldErrors.effective_from}</p>}
              </div>
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <FormLoader size="sm" text="Saving..." /> : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorPayoutForm; 