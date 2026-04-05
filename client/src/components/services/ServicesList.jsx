import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, IndianRupee, Clock, Tag } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useNavigate } from 'react-router';

const ServicesList = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'test', label: 'Test' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch services');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      consultation: 'bg-blue-100 text-blue-800',
      procedure: 'bg-purple-100 text-purple-800',
      test: 'bg-green-100 text-green-800',
      treatment: 'bg-orange-100 text-orange-800',
      surgery: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const token = localStorage.getItem('authtoken');
        await axios.delete(`${BACKEND_URL}/services/${serviceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh the services list
        fetchServices();
      } catch (err) {
        setError('Failed to delete service');
        console.error('Error deleting service:', err);
      }
    }
  };

  return (
    <>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-baseline-last sm:items-center space-y-2 justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
                <p className="text-gray-600 mt-2">Manage your clinic's services and pricing</p>
              </div>
              <button 
                onClick={() => navigate('/add-service')}
                className="bg-blue-500 text-nowrap hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Service
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service._id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.serviceName}</h3>
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      )}
                    </div>
                                         <div className="flex gap-2">
                       <button 
                         onClick={() => navigate(`/edit-service/${service._id}`)}
                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                       >
                         <Edit size={16} />
                       </button>
                       <button 
                         onClick={() => handleDeleteService(service._id)}
                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-gray-400" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                        {service.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <IndianRupee size={16} className="text-gray-400" />
                      <span className="text-gray-900 font-medium">
                        ₹{service.sellingPrice || service.basePrice}
                      </span>
                      {service.sellingPrice !== service.basePrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{service.basePrice}
                        </span>
                      )}
                    </div>

                    {service.duration && (
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-600 text-sm">
                          {service.duration} minutes
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-600">
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredServices.length === 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-600">No services found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ServicesList; 