import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import PasswordChangeModal from './PasswordChangeModal';
import DoctorRegisterationForm from './doctor/DoctorRegisterationForm';
import { Copy, Check, Camera, User } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../utils/urlConstants';

const Account = () => {
    const { user, refetch } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showDoctorFormModal, setShowDoctorFormModal] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [isEditingClinic, setIsEditingClinic] = useState(false);
    const [isUploadingClinicLogo, setIsUploadingClinicLogo] = useState(false);
    const [showClinicLogoUpload, setShowClinicLogoUpload] = useState(false);
    const [existingDoctorData, setExistingDoctorData] = useState(null);
    const [isCheckingDoctorData, setIsCheckingDoctorData] = useState(false);
    
    // Extract user data from the nested structure
    const userData = user?.data || user;
    const clinicData = userData?.clinic;
    
    const [formData, setFormData] = useState({
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        roles: userData?.roles || []
    });

    const [clinicFormData, setClinicFormData] = useState({
        name: clinicData?.name || '',
        phone: clinicData?.phone || '',
        logo: clinicData?.logo || '',
        panNumber: clinicData?.panNumber || '',
        gstNumber: clinicData?.gstNumber || ''
    });

    // Update clinic form data when clinic data changes
    useEffect(() => {
        if (clinicData) {
            setClinicFormData({
                name: clinicData.name || '',
                phone: clinicData.phone || '',
                logo: clinicData.logo || '',
                panNumber: clinicData.panNumber || '',
                gstNumber: clinicData.gstNumber || ''
            });
        }
    }, [clinicData]);

    const checkExistingDoctorData = useCallback(async () => {
        try {
            setIsCheckingDoctorData(true);
            const token = localStorage.getItem('authtoken');
            if (!token) {
                console.error('Authentication token not found');
                return;
            }

            const response = await axios.get(`${BACKEND_URL}/doctors/list/${userData._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setExistingDoctorData(response.data.data);
            }
        } catch (error) {
            // If doctor data doesn't exist, the API will return 404, which is expected
            if (error.response?.status !== 404) {
                console.error('Error checking doctor data:', error);
            }
            setExistingDoctorData(null);
        } finally {
            setIsCheckingDoctorData(false);
        }
    }, [userData?._id]);

    // Check for existing professional data when user data is available
    useEffect(() => {
        if (userData?.roles?.includes('hybrid') && userData._id) {
            checkExistingDoctorData();
        }
    }, [userData, checkExistingDoctorData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClinicInputChange = (e) => {
        const { name, value } = e.target;
        setClinicFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            // Validate form data
            if (!formData.name?.trim()) {
                setErrorMessage('Name is required');
                return;
            }
            if (!formData.email?.trim()) {
                setErrorMessage('Email is required');
                return;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                setErrorMessage('Please enter a valid email address');
                return;
            }

            // Make API call to update user profile
            const token = localStorage.getItem('authtoken');
            if (!token) {
                setErrorMessage('Authentication token not found. Please login again.');
                return;
            }

            const response = await axios.put(`${BACKEND_URL}/users/profile`, {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone?.trim() || ''
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setSuccessMessage('Profile updated successfully!');
                setIsEditing(false);
                // Refetch user data to get updated information
                await refetch();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating user data:', error);
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('Failed to update profile. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: userData?.name || '',
            email: userData?.email || '',
            phone: userData?.phone || '',
            roles: userData?.roles || []
        });
        setIsEditing(false);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleClinicSave = async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            // Validate clinic form data
            if (!clinicFormData.name?.trim()) {
                setErrorMessage('Clinic name is required');
                return;
            }



            // Get clinic ID
            const clinicId = getClinicId();
            if (!clinicId) {
                setErrorMessage('Clinic ID not found');
                return;
            }

            // Make API call to update clinic information
            const token = localStorage.getItem('authtoken');
            if (!token) {
                setErrorMessage('Authentication token not found. Please login again.');
                return;
            }

            const response = await axios.put(`${BACKEND_URL}/clinic/`, {
                name: clinicFormData.name.trim(),
                phone: clinicFormData.phone?.trim() || '',
                panNumber: clinicFormData.panNumber?.trim() || '',
                gstNumber: clinicFormData.gstNumber?.trim() || ''
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setSuccessMessage('Clinic information updated successfully!');
                setIsEditingClinic(false);
                // Refetch user data to get updated clinic information
                await refetch();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating clinic data:', error);
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('Failed to update clinic information. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClinicCancel = () => {
        setClinicFormData({
            name: clinicData?.name || '',
            phone: clinicData?.phone || '',
            logo: clinicData?.logo || '',
            panNumber: clinicData?.panNumber || '',
            gstNumber: clinicData?.gstNumber || ''
        });
        setIsEditingClinic(false);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handlePasswordChangeSuccess = () => {
        // Optionally show a success message or perform other actions
        console.log('Password changed successfully');
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrorMessage('Please select a valid image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage('Image size should not exceed 5MB');
            return;
        }

        try {
            setIsUploadingImage(true);
            setErrorMessage('');
            setSuccessMessage('');

            const token = localStorage.getItem('authtoken');
            if (!token) {
                setErrorMessage('Authentication token not found. Please login again.');
                return;
            }

            const formData = new FormData();
            formData.append('profileImage', file);

            const response = await axios.put(`${BACKEND_URL}/users/profile/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
            });

            if (response.data.success) {
                setSuccessMessage('Profile image updated successfully!');
                setShowImageUpload(false);
                // Refetch user data to get updated image
                await refetch();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('Failed to upload image. Please try again.');
            }
        } finally {
            setIsUploadingImage(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleClinicLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setErrorMessage('Please select a valid image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage('Image size should not exceed 5MB');
            return;
        }

        try {
            setIsUploadingClinicLogo(true);
            setErrorMessage('');
            setSuccessMessage('');

            // Get clinic ID
            const clinicId = getClinicId();
            if (!clinicId) {
                setErrorMessage('Clinic ID not found');
                return;
            }

            const token = localStorage.getItem('authtoken');
            if (!token) {
                setErrorMessage('Authentication token not found. Please login again.');
                return;
            }

            const formData = new FormData();
            formData.append('logo', file);

            const response = await axios.put(`${BACKEND_URL}/clinic`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
            });

            if (response.data.success) {
                setSuccessMessage('Clinic logo updated successfully!');
                setShowClinicLogoUpload(false);
                // Refetch user data to get updated clinic logo
                await refetch();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error uploading clinic logo:', error);
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage('Failed to upload clinic logo. Please try again.');
            }
        } finally {
            setIsUploadingClinicLogo(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleCopyGoogleFormLink = async () => {
        if (clinicData?.googleFormLink) {
            try {
                await navigator.clipboard.writeText(clinicData.googleFormLink);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        }
    };

    // Check if user is admin or has clinic management permissions
    const isClinicAdmin = userData?.roles?.includes('admin') || 
                         userData?.roles?.includes('clinic-admin') || 
                         userData?.roles?.includes('clinic-head') ||
                         userData?.roles?.includes('superadmin') ||
                         userData?.roles?.includes('hybrid');

    // Get clinic ID - handle both ObjectId string and populated clinic object
    const getClinicId = () => {
        if (!clinicData) return null;
        // If clinicData is a string (ObjectId), return it directly
        if (typeof clinicData === 'string') return clinicData;
        // If clinicData is an object, return its _id
        return clinicData._id || clinicData.id;
    };

    if (!user || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Please Login</h2>
                        <p className="mt-2 text-gray-600">You need to be logged in to view your account.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-6 sm:py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                                    {userData.profileImageUrl ? (
                                        <img 
                                            src={userData.profileImageUrl} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div 
                                        className={`w-full h-full flex items-center justify-center ${userData.profileImageUrl ? 'hidden' : ''}`}
                                        style={{ display: userData.profileImageUrl ? 'none' : 'flex' }}
                                    >
                                        <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                                            {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowImageUpload(true)}
                                    className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1.5 sm:p-2 hover:bg-blue-700 transition-colors shadow-lg"
                                    title="Change profile picture"
                                >
                                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                            <div className="text-center sm:text-left mx-5">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                    {userData.name || 'User Account'}
                                </h1>
                                <p className="text-blue-100 mt-1">
                                    {userData.roles?.[0] ? `${userData.roles[0].charAt(0).toUpperCase() + userData.roles[0].slice(1)}` : 'User'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="px-4 sm:px-6 py-6 sm:py-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Account Details</h2>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        {/* Success/Error Messages */}
                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                                {successMessage}
                            </div>
                        )}
                        {errorMessage && (
                            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                                {errorMessage}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                    Personal Information
                                </h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                            {userData.name || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md break-all">
                                            {userData.email || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                            {userData.phone || 'Not provided'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        User Roles
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {userData.roles?.map((role, index) => (
                                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </span>
                                        )) || 'No roles assigned'}
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                                    Account Information
                                </h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Status
                                    </label>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Member Since
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Updated
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {userData.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Clinic Information */}
                        {clinicData && (
                            <div className="mt-8 pt-6 border-t">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-4 sm:space-y-0">
                                    <h3 className="text-lg font-medium text-gray-900">Clinic Information</h3>
                                    {isClinicAdmin && (
                                        <button
                                            onClick={() => setIsEditingClinic(!isEditingClinic)}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors w-full sm:w-auto"
                                        >
                                            {isEditingClinic ? 'Cancel' : 'Edit Clinic'}
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Clinic Name
                                            </label>
                                            {isEditingClinic && isClinicAdmin ? (
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={clinicFormData.name}
                                                    onChange={handleClinicInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            ) : (
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {clinicData.name || 'Not provided'}
                                            </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Clinic Email
                                            </label>
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md break-all">
                                                {clinicData.email || 'Not provided'}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Clinic Phone
                                            </label>
                                            {isEditingClinic && isClinicAdmin ? (
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={clinicFormData.phone}
                                                    onChange={handleClinicInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            ) : (
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {clinicData.phone || 'Not provided'}
                                            </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                PAN Number
                                            </label>
                                            {isEditingClinic && isClinicAdmin ? (
                                                <input
                                                    type="text"
                                                    name="panNumber"
                                                    value={clinicFormData.panNumber}
                                                    onChange={handleClinicInputChange}
                                                    placeholder="Enter PAN Number"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            ) : (
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {clinicData.panNumber || 'Not provided'}
                                            </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                GSTIN Number
                                            </label>
                                            {isEditingClinic && isClinicAdmin ? (
                                                <input
                                                    type="text"
                                                    name="gstNumber"
                                                    value={clinicFormData.gstNumber}
                                                    onChange={handleClinicInputChange}
                                                    placeholder="Enter GST Number"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            ) : (
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {clinicData.gstNumber || 'Not provided'}
                                            </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Clinic Type
                                            </label>
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {clinicData.type ? clinicData.type.charAt(0).toUpperCase() + clinicData.type.slice(1) : 'Not specified'}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Membership
                                            </label>
                                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                                {clinicData.membership ? clinicData.membership.toUpperCase() : 'Not specified'}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Clinic Status
                                            </label>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                clinicData.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {clinicData.status ? clinicData.status.charAt(0).toUpperCase() + clinicData.status.slice(1) : 'Unknown'}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Google Form Link
                                            </label>
                                            {clinicData.googleFormLink ? (
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                                    <input
                                                        type="text"
                                                        value={clinicData.googleFormLink}
                                                        readOnly
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm break-all"
                                                    />
                                                    <button
                                                        onClick={handleCopyGoogleFormLink}
                                                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors border border-gray-300 rounded-md sm:border-0"
                                                        title="Copy link"
                                                    >
                                                        {copiedLink ? (
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No Google Form link available</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Clinic Logo */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Clinic Logo
                                        </label>
                                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                                        {clinicData.logo ? (
                                            <div className="relative">
                                            <img 
                                                src={clinicData.logo} 
                                                alt="Clinic Logo" 
                                                className="w-16 h-16 object-cover rounded-lg border"
                                            />
                                                {isClinicAdmin && (
                                                    <button
                                                        onClick={() => setShowClinicLogoUpload(true)}
                                                        className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-1.5 hover:bg-purple-700 transition-colors shadow-lg"
                                                        title="Change clinic logo"
                                                    >
                                                        <Camera className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                <span className="text-xs text-gray-500">No Logo</span>
                                            </div>
                                        )}
                                        <div className="text-center sm:text-left flex-1">
                                            {clinicData.logo ? (
                                                <>
                                                    <p className="text-sm text-gray-600">Logo uploaded</p>
                                                    <p className="text-xs text-gray-500">Click camera icon to change</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm text-gray-600">No logo uploaded</p>
                                                    {isClinicAdmin && (
                                                        <button
                                                            onClick={() => setShowClinicLogoUpload(true)}
                                                            className="text-xs text-purple-600 hover:text-purple-700 underline"
                                                        >
                                                            Upload clinic logo
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Clinic Action Buttons */}
                                {isEditingClinic && isClinicAdmin && (
                                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 pt-4 border-t">
                                        <button
                                            onClick={handleClinicCancel}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleClinicSave}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Saving...' : 'Save Clinic Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Google Form Link Section for Clinic Admins */}
                        {clinicData?.googleFormLink && (userData.roles?.includes('admin') || userData.roles?.includes('clinic-admin') || userData.roles?.includes('clinic-head') || userData.roles?.includes('hybrid')) && (
                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Google Form Integration</h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                                                Patient Appointment Form
                                            </h4>
                                            <p className="text-sm text-blue-700 mb-3">
                                                Share this link with patients to allow them to book appointments directly through Google Forms.
                                            </p>
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                                <input
                                                    type="text"
                                                    value={clinicData.googleFormLink}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-blue-300 rounded-md bg-white text-sm break-all"
                                                />
                                                <button
                                                    onClick={handleCopyGoogleFormLink}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                                >
                                                    {copiedLink ? (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            <span>Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4" />
                                                            <span>Copy Link</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}

                        {/* Additional Actions */}
                        <div className="mt-8 pt-6 border-t">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <button 
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-gray-700">Change Password</span>
                                </button>
                                
                                {/* Add/Update Professional Data button for hybrid users */}
                                {userData.roles?.includes('hybrid') && (
                                    <button 
                                        onClick={() => setShowDoctorFormModal(true)}
                                        disabled={isCheckingDoctorData}
                                        className="flex items-center justify-center px-4 py-3 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="text-blue-700 font-medium">
                                            {isCheckingDoctorData 
                                                ? 'Checking...' 
                                                : existingDoctorData 
                                                    ? 'Update Professional Data' 
                                                    : 'Add Professional Data'
                                            }
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clinic Logo Upload Modal */}
            {showClinicLogoUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Update Clinic Logo
                        </h3>
                        
                        <div className="mb-4">
                            <div className="flex items-center justify-center w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                {clinicData.logo ? (
                                    <img 
                                        src={clinicData.logo} 
                                        alt="Current clinic logo" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                        <span className="text-4xl font-bold text-gray-400">
                                            {clinicData.name ? clinicData.name.charAt(0).toUpperCase() : 'C'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Choose new clinic logo
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleClinicLogoUpload}
                                    disabled={isUploadingClinicLogo}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-500">
                                    Supported formats: JPG, PNG, GIF (Max 5MB)
                                </p>
                            </div>
                        </div>

                        {isUploadingClinicLogo && (
                            <div className="mb-4 text-center">
                                <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-md">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm text-purple-700">Uploading...</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowClinicLogoUpload(false)}
                                disabled={isUploadingClinicLogo}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Upload Modal */}
            {showImageUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Update Profile Picture
                        </h3>
                        
                        <div className="mb-4">
                            <div className="flex items-center justify-center w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-full overflow-hidden">
                                {userData.profileImageUrl ? (
                                    <img 
                                        src={userData.profileImageUrl} 
                                        alt="Current profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                        <User className="w-16 h-16 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Choose new profile picture
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploadingImage}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-500">
                                    Supported formats: JPG, PNG, GIF (Max 5MB)
                                </p>
                            </div>
                        </div>

                        {isUploadingImage && (
                            <div className="mb-4 text-center">
                                <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-md">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm text-blue-700">Uploading...</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowImageUpload(false)}
                                disabled={isUploadingImage}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            <PasswordChangeModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={handlePasswordChangeSuccess}
            />

            {/* Doctor Registration Form Modal */}
            {showDoctorFormModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <DoctorRegisterationForm
                            doctor={existingDoctorData}
                            isEditMode={!!existingDoctorData}
                            isHybridMode={true}
                            onClose={() => setShowDoctorFormModal(false)}
                            onSuccess={() => {
                                setShowDoctorFormModal(false);
                                // Refresh doctor data and user data
                                checkExistingDoctorData();
                                refetch();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Account;
