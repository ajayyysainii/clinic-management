import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, IndianRupee, Clock, Tag, FileText } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useNavigate, useParams } from 'react-router';
import { FormLoader } from '../ui/FormLoader';

const ServiceForm = ({ serviceId = null, onSave, onCancel }) => {
  const navigate = useNavigate();
  const params = useParams();
  const editServiceId = serviceId || params.id;
  
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    category: 'other',
    basePrice: '',
    sellingPrice: '',
    duration: '30',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'test', label: 'Test' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'other', label: 'Other' },
  ];

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/services/${editServiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const service = response.data.data;
      setFormData({
        serviceName: service.serviceName || '',
        description: service.description || '',
        category: service.category || 'other',
        basePrice: service.basePrice?.toString() || '',
        sellingPrice: service.sellingPrice?.toString() || '',
        duration: service.duration?.toString() || '30',
        isActive: service.isActive !== undefined ? service.isActive : true,
      });
    } catch {
      setError('Failed to fetch service details');
    } finally {
      setLoading(false);
    }
  }, [editServiceId]);

  useEffect(() => {
    if (editServiceId) {
      fetchService();
    }
  }, [editServiceId, fetchService]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authtoken');
      const data = {
        ...formData,
        basePrice: parseFloat(formData.basePrice) || 0,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        duration: parseInt(formData.duration) || 30,
      };

      if (editServiceId) {
        await axios.put(`${BACKEND_URL}/services/${editServiceId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BACKEND_URL}/services`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (onSave) {
        onSave();
      } else {
        navigate('/services-list');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {editServiceId ? 'Edit Service' : 'Add New Service'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {editServiceId ? 'Update service details' : 'Create a new service for your clinic'}
                </p>
              </div>
              <button
                onClick={onCancel || (() => navigate('/services-list'))}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => handleChange('serviceName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Diabetes Check, Stitching"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the service..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => handleChange('basePrice', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => handleChange('sellingPrice', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Service</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={onCancel || (() => navigate('/services-list'))}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <FormLoader size="md" text="Saving..." />
                  ) : (
                    <>
                      <Save size={20} />
                                             {editServiceId ? 'Update Service' : 'Create Service'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceForm;
