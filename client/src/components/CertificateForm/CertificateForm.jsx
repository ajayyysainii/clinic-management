import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import {
  User,
  Calendar,
  FileText,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Download,
  Save,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { FormLoader, FullPageLoader } from '../ui/FormLoader';

const CertificateForm = ({ patientId, onClose, onSuccess }) => {
  const [certificateType, setCertificateType] = useState('sickness');
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    certificateType: 'sickness',
    diagnosis: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    numberOfDays: '',
    isUnfit: true,
    fitnessTypes: [],
    customFitnessType: '',
    examinationDate: new Date().toISOString().split('T')[0],
    isOnMedication: false,
    isStable: true,
    remarks: '',
    issuedDate: new Date().toISOString().split('T')[0],
    place: ''
  });

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fitnessTypeOptions = [
    { value: 'work', label: 'Work' },
    { value: 'school', label: 'School' },
    { value: 'physical_activity', label: 'Physical Activity' },
    { value: 'travel', label: 'Travel' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFitnessTypeChange = (type, checked) => {
    setFormData(prev => ({
      ...prev,
      fitnessTypes: checked
        ? [...prev.fitnessTypes, type]
        : prev.fitnessTypes.filter(t => t !== type)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authtoken');
      const dataToSend = {
        ...formData,
        certificateType,
        isUnfit: certificateType === 'sickness' ? formData.isUnfit : false,
        fitnessTypes: certificateType === 'fitness' ? formData.fitnessTypes : undefined,
        customFitnessType: certificateType === 'fitness' && formData.fitnessTypes.includes('custom') 
          ? formData.customFitnessType 
          : undefined,
        examinationDate: certificateType === 'fitness' ? formData.examinationDate : undefined,
        isOnMedication: certificateType === 'fitness' ? formData.isOnMedication : undefined,
        isStable: certificateType === 'fitness' ? formData.isStable : undefined,
        endDate: formData.endDate || undefined,
        numberOfDays: formData.numberOfDays || undefined,
        remarks: formData.remarks || undefined
      };

      const response = await axios.post(
        `${BACKEND_URL}/forms/certificate/create`,
        dataToSend,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Certificate created successfully!');
      if (onSuccess) {
        onSuccess(response.data.data);
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          patientId: patientId || '',
          certificateType: 'sickness',
          diagnosis: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          numberOfDays: '',
          isUnfit: true,
          fitnessTypes: [],
          customFitnessType: '',
          examinationDate: new Date().toISOString().split('T')[0],
          isOnMedication: false,
          isStable: true,
          remarks: '',
          issuedDate: new Date().toISOString().split('T')[0],
          place: ''
        });
        setCertificateType('sickness');
      }, 2000);

    } catch (error) {
      console.error('Error creating certificate:', error);
      setError(error.response?.data?.error || 'Failed to create certificate');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p._id === formData.patientId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {loading && <FullPageLoader text="Creating certificate..." />}
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {certificateType === 'sickness' ? 'Sickness Certificate' : 'Fitness Certificate'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Certificate Type Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="sickness"
                    checked={certificateType === 'sickness'}
                    onChange={(e) => setCertificateType(e.target.value)}
                    className="mr-2"
                  />
                  Sickness Certificate
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="fitness"
                    checked={certificateType === 'fitness'}
                    onChange={(e) => setCertificateType(e.target.value)}
                    className="mr-2"
                  />
                  Fitness Certificate
                </label>
              </div>
            </div>

            {/* Patient Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {selectedPatient.name}
                  </p>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis / Condition *
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Enter diagnosis or medical condition"
                required
              />
            </div>

            {/* Certificate Type Specific Fields */}
            {certificateType === 'sickness' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Days (if no end date)
                    </label>
                    <input
                      type="number"
                      value={formData.numberOfDays}
                      onChange={(e) => handleInputChange('numberOfDays', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter number of days"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isUnfit}
                        onChange={(e) => handleInputChange('isUnfit', e.target.checked)}
                        className="mr-2"
                      />
                      Patient is unfit for work/school
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Examination Date *
                  </label>
                  <input
                    type="date"
                    value={formData.examinationDate}
                    onChange={(e) => handleInputChange('examinationDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fit for (Select all applicable)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {fitnessTypeOptions.map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.fitnessTypes.includes(option.value)}
                          onChange={(e) => handleFitnessTypeChange(option.value, e.target.checked)}
                          className="mr-2"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                {formData.fitnessTypes.includes('custom') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Fitness Type
                    </label>
                    <input
                      type="text"
                      value={formData.customFitnessType}
                      onChange={(e) => handleInputChange('customFitnessType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Specify custom fitness type"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isOnMedication}
                        onChange={(e) => handleInputChange('isOnMedication', e.target.checked)}
                        className="mr-2"
                      />
                      Patient is on medication
                    </label>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isStable}
                        onChange={(e) => handleInputChange('isStable', e.target.checked)}
                        className="mr-2"
                      />
                      Patient is stable
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Additional remarks or instructions"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => handleInputChange('issuedDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place
                </label>
                <input
                  type="text"
                  value={formData.place}
                  onChange={(e) => handleInputChange('place', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City or clinic address"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <FormLoader size="sm" text="Creating..." />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Certificate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CertificateForm;
