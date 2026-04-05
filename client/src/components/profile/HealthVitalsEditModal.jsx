import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import axios from 'axios';

const HealthVitalsEditModal = ({ isOpen, onClose, patient, onSuccess }) => {
    const [formData, setFormData] = useState({
        heartRate: '',
        temperature: '',
        hba1c: '',
        bloodGlucose: '',
        spO2: '',
        bloodPressure: '',
        weight: '',
        height: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (patient && isOpen) {
            setFormData({
                heartRate: patient.heartRate || '',
                temperature: patient.temperature || '',
                hba1c: patient.hba1c || '',
                bloodGlucose: patient.bloodGlucose || '',
                spO2: patient.spO2 || '',
                bloodPressure: patient.bloodPressure || '',
                weight: patient.weight || '',
                height: patient.height || ''
            });
        }
    }, [patient, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (formData.heartRate && (isNaN(formData.heartRate) || formData.heartRate < 0)) {
            newErrors.heartRate = 'Heart rate must be a positive number';
        }
        
        if (formData.temperature && (isNaN(formData.temperature) || formData.temperature < 0)) {
            newErrors.temperature = 'Temperature must be a positive number';
        }
        
        if (formData.hba1c && (isNaN(formData.hba1c) || formData.hba1c < 0)) {
            newErrors.hba1c = 'HbA1c must be a positive number';
        }
        
        if (formData.bloodGlucose && (isNaN(formData.bloodGlucose) || formData.bloodGlucose < 0)) {
            newErrors.bloodGlucose = 'Blood glucose must be a positive number';
        }
        
        if (formData.spO2 && (isNaN(formData.spO2) || formData.spO2 < 0 || formData.spO2 > 100)) {
            newErrors.spO2 = 'SpO2 must be between 0 and 100';
        }
        
        if (formData.weight && (isNaN(formData.weight) || formData.weight < 0)) {
            newErrors.weight = 'Weight must be a positive number';
        }
        
        if (formData.height && (isNaN(formData.height) || formData.height < 0)) {
            newErrors.height = 'Height must be a positive number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authtoken');
            
            // Filter out empty values
            const updateData = {};
            Object.keys(formData).forEach(key => {
                if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
                    updateData[key] = key === 'weight' || key === 'height' || key === 'heartRate' || 
                                    key === 'temperature' || key === 'hba1c' || key === 'bloodGlucose' || 
                                    key === 'spO2' ? Number(formData[key]) : formData[key];
                }
            });

            const response = await axios.put(
                `${import.meta.env.VITE_BASE_URL}/patients/health-vitals/${patient._id}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                onSuccess(response.data.data);
                onClose();
            }
        } catch (error) {
            console.error('Error updating health vitals:', error);
            if (error.response?.data?.error) {
                setErrors({ general: error.response.data.error });
            } else {
                setErrors({ general: 'Failed to update health vitals. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Edit3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">Edit Health Vitals</h2>
                            <p className="text-sm text-gray-500">Update patient health measurements</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {errors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Heart Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Heart Rate (bpm)
                            </label>
                            <input
                                type="number"
                                name="heartRate"
                                value={formData.heartRate}
                                onChange={handleInputChange}
                                placeholder="e.g., 75"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.heartRate ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.heartRate && (
                                <p className="text-red-500 text-xs mt-1">{errors.heartRate}</p>
                            )}
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Temperature (°F)
                            </label>
                            <input
                                type="number"
                                name="temperature"
                                value={formData.temperature}
                                onChange={handleInputChange}
                                placeholder="e.g., 98.6"
                                step="0.1"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.temperature ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.temperature && (
                                <p className="text-red-500 text-xs mt-1">{errors.temperature}</p>
                            )}
                        </div>

                        {/* HbA1c */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                HbA1c (%)
                            </label>
                            <input
                                type="number"
                                name="hba1c"
                                value={formData.hba1c}
                                onChange={handleInputChange}
                                placeholder="e.g., 5.7"
                                step="0.1"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.hba1c ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.hba1c && (
                                <p className="text-red-500 text-xs mt-1">{errors.hba1c}</p>
                            )}
                        </div>

                        {/* Blood Glucose */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Blood Glucose (mg/dl)
                            </label>
                            <input
                                type="number"
                                name="bloodGlucose"
                                value={formData.bloodGlucose}
                                onChange={handleInputChange}
                                placeholder="e.g., 100"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.bloodGlucose ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.bloodGlucose && (
                                <p className="text-red-500 text-xs mt-1">{errors.bloodGlucose}</p>
                            )}
                        </div>

                        {/* SpO2 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SpO2 (%)
                            </label>
                            <input
                                type="number"
                                name="spO2"
                                value={formData.spO2}
                                onChange={handleInputChange}
                                placeholder="e.g., 98"
                                min="0"
                                max="100"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.spO2 ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.spO2 && (
                                <p className="text-red-500 text-xs mt-1">{errors.spO2}</p>
                            )}
                        </div>

                        {/* Blood Pressure */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Blood Pressure (mmHg)
                            </label>
                            <input
                                type="text"
                                name="bloodPressure"
                                value={formData.bloodPressure}
                                onChange={handleInputChange}
                                placeholder="e.g., 120/80"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                                placeholder="e.g., 70"
                                step="0.1"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.weight ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.weight && (
                                <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
                            )}
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Height (m)
                            </label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleInputChange}
                                placeholder="e.g., 1.75"
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.height ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.height && (
                                <p className="text-red-500 text-xs mt-1">{errors.height}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HealthVitalsEditModal;
