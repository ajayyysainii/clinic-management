import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Copy, 
  Users, 
  Calendar,
  FileText,
  Settings,
  Play,
  MoreVertical,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

const CustomRiskAssessmentForms = ({ onFormSelected, onClose }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/custom-risk-assessment/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setForms(response.data.data || []);
    } catch (error) {
      console.error('Error fetching custom forms:', error);
      setError('Failed to load custom forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId) => {
    try {
      const token = localStorage.getItem('authtoken');
      await axios.delete(`${BACKEND_URL}/custom-risk-assessment/${formId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setForms(prev => prev.filter(form => form._id !== formId));
      setShowDeleteModal(false);
      setFormToDelete(null);
    } catch (error) {
      console.error('Error deleting form:', error);
      setError('Failed to delete form');
    }
  };

  const handleDuplicateForm = async (form) => {
    try {
      const token = localStorage.getItem('authtoken');
      const duplicatedForm = {
        ...form,
        name: `${form.name} (Copy)`,
        description: form.description ? `${form.description} (Copy)` : ''
      };

      delete duplicatedForm._id;
      delete duplicatedForm.createdAt;
      delete duplicatedForm.updatedAt;

      const response = await axios.post(`${BACKEND_URL}/custom-risk-assessment/create`, duplicatedForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setForms(prev => [response.data.data, ...prev]);
    } catch (error) {
      console.error('Error duplicating form:', error);
      setError('Failed to duplicate form');
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Custom Risk Assessment Forms</h1>
              <p className="text-purple-100">Manage your custom risk assessment forms</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="text-sm text-gray-500">
                {filteredForms.length} of {forms.length} forms
              </div>
            </div>
          </div>

          {/* Forms Grid */}
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom forms found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'No forms match your search criteria.' : 'Create your first custom risk assessment form.'}
              </p>
              <button
                onClick={() => onFormSelected && onFormSelected('create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create New Form
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map((form) => (
                <div key={form._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{form.name}</h3>
                        {form.description && (
                          <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {form.fields.length} fields
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(form.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setSelectedForm(selectedForm === form._id ? null : form._id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {selectedForm === form._id && (
                          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onFormSelected && onFormSelected('view', form);
                                  setSelectedForm(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Form
                              </button>
                              <button
                                onClick={() => {
                                  onFormSelected && onFormSelected('edit', form);
                                  setSelectedForm(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit Form
                              </button>
                              <button
                                onClick={() => {
                                  handleDuplicateForm(form);
                                  setSelectedForm(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  setFormToDelete(form);
                                  setShowDeleteModal(true);
                                  setSelectedForm(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-500">
                          {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button
                        onClick={() => onFormSelected && onFormSelected('use', form)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Play className="h-3 w-3" />
                        Use Form
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Form Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => onFormSelected && onFormSelected('create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create New Custom Form
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && formToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Form</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{formToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFormToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteForm(formToDelete._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomRiskAssessmentForms; 