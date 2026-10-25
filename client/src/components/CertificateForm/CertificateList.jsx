import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';
import {
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CertificateList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/forms/certificate/by-role`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId) => {
    try {
      const token = localStorage.getItem('authtoken');
      
      // First, get the certificate details to get the PDF URL
      const response = await axios.get(`${BACKEND_URL}/forms/certificate/${certificateId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { pdfUrl } = response.data.data;
      
      if (pdfUrl) {
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `certificate-${certificateId}.pdf`;
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback: try to download directly if no URL provided
        try {
          const downloadResponse = await axios.get(`${BACKEND_URL}/forms/certificate/${certificateId}/download`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          });
          
          const blob = new Blob([downloadResponse.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = `certificate-${certificateId}.pdf`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(url);
        } catch (downloadError) {
          console.error('Direct download failed:', downloadError);
          // If direct download fails, try to open the URL in a new tab as last resort
          if (pdfUrl) {
            window.open(pdfUrl, '_blank');
          }
        }
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  const handleDelete = async (certificateId) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authtoken');
      await axios.delete(`${BACKEND_URL}/forms/certificate/${certificateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCertificates(prev => prev.filter(cert => cert._id !== certificateId));
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Failed to delete certificate');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCertificateTypeLabel = (type) => {
    return type === 'sickness' ? 'Sickness Certificate' : 'Fitness Certificate';
  };

  const getCertificateTypeColor = (type) => {
    return type === 'sickness' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-green-100 text-green-800 border-green-200';
  };

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = certificate.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || certificate.certificateType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const canCreateCertificate = user?.data?.roles?.includes('doctor') || user?.data?.roles?.includes('hybrid');
  const canDeleteCertificate = user?.data?.roles?.includes('doctor') || 
                              user?.data?.roles?.includes('hybrid') || 
                              user?.data?.roles?.includes('admin') || 
                              user?.data?.roles?.includes('clinic-admin') || 
                              user?.data?.roles?.includes('clinic-head');
  
  // Check if user is a patient
  const isPatient = user?.data?.roles?.includes('patient');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Certificates</h1>
          <p className="text-gray-600">Manage sickness and fitness certificates</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchCertificates}
            className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          
          {canCreateCertificate && (
            <button
              onClick={() => navigate('/form/create-certificate')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Certificate
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient, diagnosis, or doctor..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="sickness">Sickness Certificates</option>
              <option value="fitness">Fitness Certificates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}

      {/* Certificates List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredCertificates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first certificate'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  {!isPatient && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCertificateTypeColor(certificate.certificateType)}`}>
                          {getCertificateTypeLabel(certificate.certificateType)}
                        </span>
                      </div>
                    </td>
                    {!isPatient && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {certificate.patientName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Age: {certificate.patientAge} | {certificate.patientGender}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Stethoscope className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          Dr. {certificate.doctorName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {certificate.diagnosis}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {formatDate(certificate.issuedDate)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(certificate._id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => window.open(certificate.pdfUrl, '_blank')}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="View PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {canDeleteCertificate && (
                          <button
                            onClick={() => handleDelete(certificate._id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete Certificate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateList;
