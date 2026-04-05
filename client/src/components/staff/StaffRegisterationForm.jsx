import React, { useState } from 'react';
import { Plus, X, User, ChevronRight, ChevronLeft, Mail, Phone, UserCheck } from 'lucide-react';
import axios from "axios";
import { FormLoader } from '../ui/FormLoader';

const StaffRegisterationForm = ({ staff, isEditMode, onClose }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1: Basic data
    const [basicData, setBasicData] = useState({
        name: staff?.user_id?.name || '',
        email: staff?.user_id?.email || '',
        phone: staff?.user_id?.phone || '',
    });

    // Step 2: Professional data
    const [formData, setFormData] = useState({
        eSign: staff?.eSign || '',
        degrees: staff?.degrees?.length > 0 ? staff.degrees : [{ name: '', image_url: '' }],
    });

    const [files, setFiles] = useState({
        eSign: null,
        degrees: staff?.degrees?.map(() => null) || [],
        profileImageUrl: null,
    });
    const [existingFiles, setExistingFiles] = useState({
        eSign: staff?.eSign || null,
        degrees: staff?.degrees?.map(d => d.image_url) || [],
        profileImageUrl: staff?.profile_image_url || null,
    });

    // Profile image preview
    const [profilePreview, setProfilePreview] = useState(null);

    // Handlers for basic data
    const handleBasicDataChange = (field, value) => {
        setBasicData(prev => ({ ...prev, [field]: value }));
    };

    // Profile image upload
    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        setFiles(prev => ({ ...prev, profileImageUrl: file }));
        if (file) {
            setProfilePreview(URL.createObjectURL(file));
        } else {
            setProfilePreview(null);
        }
    };
    const handleRemoveProfileImage = () => {
        setFiles(prev => ({ ...prev, profileImageUrl: null }));
        setExistingFiles(prev => ({ ...prev, profileImageUrl: null }));
        setProfilePreview(null);
    };

    // eSign preview
    const [eSignPreview, setESignPreview] = useState(null);
    const handleESignChange = (e) => {
        const file = e.target.files[0];
        setFiles(prev => ({ ...prev, eSign: file }));
        if (file) {
            setESignPreview(URL.createObjectURL(file));
        } else {
            setESignPreview(null);
        }
    };

    // Degrees
    const addDegree = () => {
        setFormData(prev => ({
            ...prev,
            degrees: [...prev.degrees, { name: '', image_url: '' }]
        }));
        setFiles(prev => ({
            ...prev,
            degrees: [...(prev.degrees || []), null]
        }));
        setDegreePreviews(prev => {
            const newPreviews = [...prev];
            newPreviews.push(null);
            return newPreviews;
        });
    };
    const removeDegree = (index) => {
        setFormData(prev => ({
            ...prev,
            degrees: prev.degrees.filter((_, i) => i !== index)
        }));
        setFiles(prev => ({
            ...prev,
            degrees: (prev.degrees || []).filter((_, i) => i !== index)
        }));
        setExistingFiles(prev => ({
            ...prev,
            degrees: (prev.degrees || []).filter((_, i) => i !== index)
        }));
        setDegreePreviews(prev => {
            const newPreviews = [...prev];
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };
    const updateDegree = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            degrees: prev.degrees.map((degree, i) =>
                i === index ? { ...degree, [field]: value } : degree
            )
        }));
    };
    // Degree image preview
    const [degreePreviews, setDegreePreviews] = useState(files.degrees ? files.degrees.map(() => null) : []);
    const updateDegreeFile = (index, file) => {
        setFiles(prev => {
            const newDegreeFiles = [...(prev.degrees || [])];
            newDegreeFiles[index] = file;
            return { ...prev, degrees: newDegreeFiles };
        });
        setDegreePreviews(prev => {
            const newPreviews = [...prev];
            newPreviews[index] = file ? URL.createObjectURL(file) : null;
            return newPreviews;
        });
    };

    // Navigation
    const handleNext = () => setCurrentStep((prev) => prev + 1);
    const handlePrevious = () => setCurrentStep((prev) => prev - 1);

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem("authtoken");
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', basicData.name);
            formDataToSend.append('email', basicData.email);
            formDataToSend.append('phone', basicData.phone);
            // Profile Image
            if (files.profileImageUrl) {
                formDataToSend.append('profileImageUrl', files.profileImageUrl);
            } else if (
                existingFiles.profileImageUrl &&
                typeof existingFiles.profileImageUrl === 'string' &&
                !existingFiles.profileImageUrl.startsWith('blob:')
            ) {
                formDataToSend.append('existingProfileImage', existingFiles.profileImageUrl);
            }
            // eSign
            if (files.eSign) {
                formDataToSend.append('eSign', files.eSign);
            } else if (existingFiles.eSign) {
                formDataToSend.append('existingESign', existingFiles.eSign);
            }
            // Degrees
            formData.degrees.forEach((degree, index) => {
                formDataToSend.append(`degreeNames[]`, degree.name);
                if (files.degrees[index]) {
                    formDataToSend.append('degrees', files.degrees[index]);
                } else if (existingFiles.degrees[index]) {
                    formDataToSend.append('existingDegrees', existingFiles.degrees[index]);
                }
            });
            const headers = { 'Authorization': `Bearer ${token}` };
            if (isEditMode) {
                // Implement update logic if needed
            } else {
                await axios.post(`${import.meta.env.VITE_BASE_URL}/staff`, formDataToSend, { headers });
                alert("Staff profile submitted successfully!");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // UI Steps
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-4 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
                <div className='flex flex-col items-center'>
                    <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= 1 ? 'bg-[#0096f2] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        1
                    </div>
                    <div className={`text-xs sm:text-sm mt-1 ${currentStep >= 1 ? 'text-[#0096f2]' : 'text-gray-500'}`}>Personal</div>
                </div>
                <div className={`h-1 transition-all duration-300 w-8 sm:w-20 ${currentStep > 1 ? 'bg-[#0096f2]' : 'bg-gray-200'}`}></div>
                <div className='flex flex-col items-center'>
                    <div className={`flex transition-all duration-300 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= 2 ? 'bg-[#0096f2] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        2
                    </div>
                    <div className={`text-xs sm:text-sm mt-1 ${currentStep >= 2 ? 'text-[#0096f2]' : 'text-gray-500'}`}>Professional</div>
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6 sm:space-y-8">
            <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-4 border-b border-gray-200">
                    <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={basicData.name}
                                onChange={(e) => handleBasicDataChange('name', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="John Smith"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={basicData.email}
                                    onChange={(e) => handleBasicDataChange('email', e.target.value)}
                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="john.smith@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Phone Number *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    value={basicData.phone}
                                    onChange={(e) => handleBasicDataChange('phone', e.target.value)}
                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="7023277712"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Profile Photo
                            </label>
                            {(profilePreview || existingFiles.profileImageUrl) ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <img
                                        src={profilePreview || existingFiles.profileImageUrl}
                                        alt="Profile preview"
                                        className="w-25 h-25 rounded-full object-cover border border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveProfileImage}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileImageChange}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>
            <div className="pt-4 sm:pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-semibold text-sm sm:text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    Next: Professional Details
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 sm:space-y-8">
            <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-4 border-b border-gray-200">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Professional Information</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            eSign
                        </label>
                        {(eSignPreview || existingFiles.eSign) ? (
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                <img
                                    src={eSignPreview || existingFiles.eSign}
                                    alt="eSign preview"
                                    className="w-16 h-16 object-contain border border-gray-300 rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setExistingFiles(prev => ({ ...prev, eSign: null })); setESignPreview(null); }}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        ) : null}
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleESignChange}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </section>
            {/* Degrees */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pb-2 sm:pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Degrees</h2>
                    </div>
                    <button
                        type="button"
                        onClick={addDegree}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        Add Degree
                    </button>
                </div>
                <div className="space-y-3 sm:space-y-4">
                    {formData.degrees.map((degree, index) => (
                        <div key={index} className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <h4 className="font-medium text-gray-800 text-sm sm:text-base">Degree {index + 1}</h4>
                                {formData.degrees.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDegree(index)}
                                        className="text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        Degree Name
                                    </label>
                                    <input
                                        type="text"
                                        value={degree.name}
                                        onChange={(e) => updateDegree(index, 'name', e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="e.g., Bachelor of Science"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        Degree Image
                                    </label>
                                    {(degreePreviews[index] || existingFiles.degrees[index]) && (
                                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                            <img
                                                src={degreePreviews[index] || existingFiles.degrees[index]}
                                                alt="Degree preview"
                                                className="w-16 h-16 object-contain border border-gray-300 rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newExisting = [...existingFiles.degrees];
                                                    newExisting[index] = null;
                                                    setExistingFiles(prev => ({ ...prev, degrees: newExisting }));
                                                    setDegreePreviews(prev => {
                                                        const newPreviews = [...prev];
                                                        newPreviews[index] = null;
                                                        return newPreviews;
                                                    });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => updateDegreeFile(index, e.target.files[0])}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 sm:py-4 px-4 sm:px-8 rounded-lg font-semibold text-sm sm:text-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Previous
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 sm:py-4 px-4 sm:px-8 rounded-lg font-semibold text-sm sm:text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <FormLoader size="sm" text={isEditMode ? 'Updating...' : 'Submitting...'} />
                    ) : (
                        <>
                            {isEditMode ? 'Update Profile' : 'Complete Registration'}
                            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-4 sm:py-8">
            <div className="max-w-4xl mx-auto px-3 sm:px-4">
                <div className="relative">
                    {isEditMode && (
                        <button
                            onClick={onClose}
                            className="absolute top-0 right-0 p-1 sm:p-2 text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}
                    <div className="text-center mb-4 sm:mb-8">
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                            {isEditMode ? 'Update Staff Profile' : 'Staff Registration'}
                        </h1>
                        <p className="text-sm sm:text-lg text-gray-600">
                            {isEditMode ? 'Update your staff profile' : 'Complete your staff profile to join the clinic'}
                        </p>
                    </div>
                    {renderStepIndicator()}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8">
                        <form onSubmit={handleSubmit}>
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffRegisterationForm; 