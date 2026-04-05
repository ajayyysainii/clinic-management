import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Calendar, Clock, User, Award, Stethoscope, ChevronRight, ChevronLeft, Mail, Phone, UserCheck, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { useAuth } from '../../hooks/useAuth';
import { FormLoader } from '../ui/FormLoader';


const DoctorRegisterationForm = ({ doctor, isEditMode, isHybridMode = false, onClose, onSuccess, formData: externalFormData, files: externalFiles, basicData: externalBasicData, onFormDataChange, onFilesChange, onBasicDataChange }) => {
    const [currentStep, setCurrentStep] = useState(isHybridMode ? 1 : 1);
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Add loading state for user data
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Separate state for basic data (Step 1)
    const [internalBasicData, setInternalBasicData] = useState({
        name: doctor?.user_id?.name || '',
        email: doctor?.user_id?.email || '',
        phone: doctor?.user_id?.phone || '',
    });

    // State for professional data (Steps 2 & 3)
    const defaultAvailability = [
        { day: 'Monday', slots: [
            { startTime: '09:00', endTime: '13:00' },
            { startTime: '17:00', endTime: '20:00' },
        ] },
        { day: 'Tuesday', slots: [
            { startTime: '09:00', endTime: '13:00' },
            { startTime: '17:00', endTime: '20:00' },
        ] },
        { day: 'Wednesday', slots: [
            { startTime: '09:00', endTime: '13:00' },
            { startTime: '17:00', endTime: '20:00' },
        ] },
        { day: 'Thursday', slots: [
            { startTime: '09:00', endTime: '13:00' },
            { startTime: '17:00', endTime: '20:00' },
        ] },
        { day: 'Friday', slots: [
            { startTime: '09:00', endTime: '13:00' },
            { startTime: '17:00', endTime: '20:00' },
        ] },
        { day: 'Saturday', slots: [
            { startTime: '09:00', endTime: '13:00' },
            { startTime: '17:00', endTime: '20:00' },
        ] },
        { day: 'Sunday', slots: [] },
    ];
    const [internalFormData, setInternalFormData] = useState({
        user_id: doctor?._id || "",
        bio: doctor?.bio || '',
        yearsOfExperience: doctor?.yearsOfExperience || "",
        eSign: doctor?.eSign || '',
        degrees: doctor?.degrees?.length > 0
            ? doctor.degrees
            : [{ title: '', degrees_image_url: '' }],
        certificates: doctor?.certificates?.length > 0
            ? doctor.certificates
            : [{ title: '', certificates_image_url: '' }],
        specializations: doctor?.specializations || [],
        availability: doctor?.availability || defaultAvailability,
    });

    const [newSpecialization, setNewSpecialization] = useState('');
    const [internalFiles, setInternalFiles] = useState({
        profileImage: null,
        eSign: null,
        degrees: doctor?.degrees?.map(() => null) || [],
        certificates: doctor?.certificates?.map(() => null) || []
    });

    const [existingFiles, setExistingFiles] = useState({
        profileImage: doctor?.user_id?.profileImageUrl || null,
        eSign: doctor?.eSign || null,
        degrees: doctor?.degrees?.map(d => d.degrees_image_url) || [],
        certificates: doctor?.certificates?.map(c => c.certificates_image_url) || []
    });

    const [profilePreview, setProfilePreview] = useState(null);
    const [categories, setCategories] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const isControlledMode = externalFormData && externalFiles && externalBasicData && onFormDataChange && onFilesChange && onBasicDataChange;
    

    
    const basicData = isControlledMode ? externalBasicData : internalBasicData;
    const formData = isControlledMode ? externalFormData : internalFormData;
    const files = isControlledMode ? externalFiles : internalFiles;

    // Ensure formData has all required properties with default values
    const safeFormData = {
        user_id: formData?.user_id || "",
        bio: formData?.bio || '',
        yearsOfExperience: formData?.yearsOfExperience || "",
        eSign: formData?.eSign || '',
        degrees: formData?.degrees?.length > 0
            ? formData.degrees
            : [{ title: '', degrees_image_url: '' }],
        certificates: formData?.certificates?.length > 0
            ? formData.certificates
            : [{ title: '', certificates_image_url: '' }],
        specializations: formData?.specializations || [],
        availability: formData?.availability || defaultAvailability,
    };

    const handleBasicDataChange = (field, value) => {
        if (isControlledMode) {
            onBasicDataChange(field, value);
        } else {
            setInternalBasicData(prev => ({ ...prev, [field]: value }));
        }
    };

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch('https://preva.care/v1/common/doctor/categories');
                const data = await response.json();
                // console.log(data)
                if (data.status === 'success' && Array.isArray(data.data.categories)) {
                    setCategories(data.data.categories);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        }
        fetchCategories();
    }, []);

    // Handle user loading state
    useEffect(() => {
        if (user !== null) {
            setIsUserLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (doctor && isEditMode) {
            if (isControlledMode) {
                onBasicDataChange('name', doctor?.user_id?.name || '');
                onBasicDataChange('email', doctor?.user_id?.email || '');
                onBasicDataChange('phone', doctor?.user_id?.phone || '');
                
                onFormDataChange('user_id', doctor?._id || "");
                onFormDataChange('bio', doctor?.bio || '');
                onFormDataChange('yearsOfExperience', doctor?.yearsOfExperience || "");
                onFormDataChange('eSign', doctor?.eSign || '');
                onFormDataChange('degrees', doctor?.degrees?.length > 0
                    ? doctor.degrees
                    : [{ title: '', degrees_image_url: '' }]);
                onFormDataChange('certificates', doctor?.certificates?.length > 0
                    ? doctor.certificates
                    : [{ title: '', certificates_image_url: '' }]);
                onFormDataChange('specializations', doctor?.specializations || []);
                onFormDataChange('availability', doctor?.availability || defaultAvailability);
                
                onFilesChange('profileImage', null);
                onFilesChange('eSign', null);
                onFilesChange('degrees', doctor?.degrees?.map(() => null) || []);
                onFilesChange('certificates', doctor?.certificates?.map(() => null) || []);
            } else {
                setInternalBasicData({
                    name: doctor?.user_id?.name || '',
                    email: doctor?.user_id?.email || '',
                    phone: doctor?.user_id?.phone || '',
                });
                setInternalFormData({
                    user_id: doctor?._id || "",
                    bio: doctor?.bio || '',
                    yearsOfExperience: doctor?.yearsOfExperience || "",
                    eSign: doctor?.eSign || '',
                    degrees: doctor?.degrees?.length > 0
                        ? doctor.degrees
                        : [{ title: '', degrees_image_url: '' }],
                    certificates: doctor?.certificates?.length > 0
                        ? doctor.certificates
                        : [{ title: '', certificates_image_url: '' }],
                    specializations: doctor?.specializations || [],
                    availability: doctor?.availability || defaultAvailability,
                });
                setInternalFiles({
                    profileImage: null,
                    eSign: null,
                    degrees: doctor?.degrees?.map(() => null) || [],
                    certificates: doctor?.certificates?.map(() => null) || []
                });
            }
            setExistingFiles({
                profileImage: doctor?.user_id?.profileImageUrl || null,
                eSign: doctor?.eSign || null,
                degrees: doctor?.degrees?.map(d => d.degrees_image_url) || [],
                certificates: doctor?.certificates?.map(c => c.certificates_image_url) || []
            });
            setProfilePreview(null);
        }
    }, [doctor, isEditMode]);

    // Handler for form data changes
    const handleInputChange = (field, value) => {
        if (isControlledMode) {
            onFormDataChange(field, value);
        } else {
            setInternalFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (isControlledMode) {
            onFilesChange('profileImage', file);
        } else {
            setInternalFiles(prev => ({ ...prev, profileImage: file }));
        }
        if (file) {
            setProfilePreview(URL.createObjectURL(file));
        } else {
            setProfilePreview(null);
        }
    };

    const handleRemoveProfileImage = () => {
        if (isControlledMode) {
            onFilesChange('profileImage', null);
        } else {
            setInternalFiles(prev => ({ ...prev, profileImage: null }));
        }
        setExistingFiles(prev => ({ ...prev, profileImage: null }));
        setProfilePreview(null);
    };

    const addDegree = () => {
        if (isControlledMode) {
            onFormDataChange('degrees', [...safeFormData.degrees, { title: '', degrees_image_url: '' }]);
            onFilesChange('degrees', [...(files.degrees || []), null]);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                degrees: [...prev.degrees, { title: '', degrees_image_url: '' }]
            }));
            setInternalFiles(prev => ({
                ...prev,
                degrees: [...(prev.degrees || []), null]
            }));
        }
    };

    const removeDegree = (index) => {
        if (isControlledMode) {
            onFormDataChange('degrees', safeFormData.degrees.filter((_, i) => i !== index));
            onFilesChange('degrees', (files.degrees || []).filter((_, i) => i !== index));
        } else {
            setInternalFormData(prev => ({
                ...prev,
                degrees: prev.degrees.filter((_, i) => i !== index)
            }));
            setInternalFiles(prev => ({
                ...prev,
                degrees: (prev.degrees || []).filter((_, i) => i !== index)
            }));
        }
    };

    const updateDegree = (index, field, value) => {
        if (isControlledMode) {
            const updatedDegrees = safeFormData.degrees.map((degree, i) =>
                i === index ? { ...degree, [field]: value } : degree
            );
            onFormDataChange('degrees', updatedDegrees);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                degrees: prev.degrees.map((degree, i) =>
                    i === index ? { ...degree, [field]: value } : degree
                )
            }));
        }
    };

    const handleESignChange = (e) => {
        const file = e.target.files[0];
        if (isControlledMode) {
            onFilesChange('eSign', file);
        } else {
            setInternalFiles(prev => ({ ...prev, eSign: file }));
        }
    };

    const updateDegreeFile = (index, file) => {
        if (isControlledMode) {
            const newDegreeFiles = [...(files.degrees || [])];
            newDegreeFiles[index] = file;
            onFilesChange('degrees', newDegreeFiles);
        } else {
            setInternalFiles(prev => {
                const newDegreeFiles = [...(prev.degrees || [])];
                newDegreeFiles[index] = file;
                return { ...prev, degrees: newDegreeFiles };
            });
        }
    };

    const updateCertificateFile = (index, file) => {
        if (isControlledMode) {
            const newCertificateFiles = [...(files.certificates || [])];
            newCertificateFiles[index] = file;
            onFilesChange('certificates', newCertificateFiles);
        } else {
            setInternalFiles(prev => {
                const newCertificateFiles = [...(prev.certificates || [])];
                newCertificateFiles[index] = file;
                return { ...prev, certificates: newCertificateFiles };
            });
        }
    };

    const addCertificate = () => {
        if (isControlledMode) {
            onFormDataChange('certificates', [...safeFormData.certificates, { title: '', certificates_image_url: '' }]);
            onFilesChange('certificates', [...(files.certificates || []), null]);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                certificates: [...prev.certificates, { title: '', certificates_image_url: '' }]
            }));
            setInternalFiles(prev => ({
                ...prev,
                certificates: [...(prev.certificates || []), null]
            }));
        }
    };

    const removeCertificate = (index) => {
        if (isControlledMode) {
            onFormDataChange('certificates', safeFormData.certificates.filter((_, i) => i !== index));
            onFilesChange('certificates', (files.certificates || []).filter((_, i) => i !== index));
        } else {
            setInternalFormData(prev => ({
                ...prev,
                certificates: prev.certificates.filter((_, i) => i !== index)
            }));
            setInternalFiles(prev => ({
                ...prev,
                certificates: (prev.certificates || []).filter((_, i) => i !== index)
            }));
        }
    };

    const updateCertificate = (index, field, value) => {
        if (isControlledMode) {
            const updatedCertificates = safeFormData.certificates.map((cert, i) =>
                i === index ? { ...cert, [field]: value } : cert
            );
            onFormDataChange('certificates', updatedCertificates);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                certificates: prev.certificates.map((cert, i) =>
                    i === index ? { ...cert, [field]: value } : cert
                )
            }));
        }
    };

    const addSpecialization = () => {
        if (newSpecialization.trim() && !safeFormData.specializations.includes(newSpecialization.trim())) {
            if (isControlledMode) {
                onFormDataChange('specializations', [...safeFormData.specializations, newSpecialization.trim()]);
            } else {
                setInternalFormData(prev => ({
                    ...prev,
                    specializations: [...prev.specializations, newSpecialization.trim()]
                }));
            }
            setNewSpecialization('');
        }
    };

    const removeSpecialization = (index) => {
        if (isControlledMode) {
            onFormDataChange('specializations', safeFormData.specializations.filter((_, i) => i !== index));
        } else {
            setInternalFormData(prev => ({
                ...prev,
                specializations: prev.specializations.filter((_, i) => i !== index)
            }));
        }
    };

    const toggleDayAvailability = (dayIndex) => {
        if (isControlledMode) {
            const updatedAvailability = safeFormData.availability.map((day, i) =>
                i === dayIndex
                    ? { ...day, slots: day.slots.length > 0 ? [] : [{ startTime: '09:00', endTime: '10:00' }] }
                    : day
            );
            onFormDataChange('availability', updatedAvailability);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                availability: prev.availability.map((day, i) =>
                    i === dayIndex
                        ? { ...day, slots: day.slots.length > 0 ? [] : [{ startTime: '09:00', endTime: '10:00' }] }
                        : day
                )
            }));
        }
    };

    const addTimeSlot = (dayIndex) => {
        if (isControlledMode) {
            const updatedAvailability = safeFormData.availability.map((day, i) =>
                i === dayIndex
                    ? { ...day, slots: [...day.slots, { startTime: '09:00', endTime: '10:00' }] }
                    : day
            );
            onFormDataChange('availability', updatedAvailability);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                availability: prev.availability.map((day, i) =>
                    i === dayIndex
                        ? { ...day, slots: [...day.slots, { startTime: '09:00', endTime: '10:00' }] }
                        : day
                )
            }));
        }
    };

    const removeTimeSlot = (dayIndex, slotIndex) => {
        if (isControlledMode) {
            const updatedAvailability = safeFormData.availability.map((day, i) =>
                i === dayIndex
                    ? { ...day, slots: day.slots.filter((_, si) => si !== slotIndex) }
                    : day
            );
            onFormDataChange('availability', updatedAvailability);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                availability: prev.availability.map((day, i) =>
                    i === dayIndex
                        ? { ...day, slots: day.slots.filter((_, si) => si !== slotIndex) }
                        : day
                )
            }));
        }
    };

    const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
        if (isControlledMode) {
            const updatedAvailability = safeFormData.availability.map((day, i) =>
                i === dayIndex
                    ? {
                        ...day,
                        slots: day.slots.map((slot, si) =>
                            si === slotIndex ? { ...slot, [field]: value } : slot
                        )
                    }
                    : day
            );
            onFormDataChange('availability', updatedAvailability);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                availability: prev.availability.map((day, i) =>
                    i === dayIndex
                        ? {
                            ...day,
                            slots: day.slots.map((slot, si) =>
                                si === slotIndex ? { ...slot, [field]: value } : slot
                            )
                        }
                        : day
                )
            }));
        }
    };

    const handleNext = () => {
        if (isHybridMode) {
            if (currentStep === 1) {
                setCurrentStep(2);
            }
        } else {
            if (currentStep === 1) {
                setCurrentStep(2);
            } else if (currentStep === 2) {
                setCurrentStep(3);
            }
        }
    };

    const handlePrevious = () => {
        if (isHybridMode) {
            if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
            }
        } else {
            if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isControlledMode) {
            // Do nothing, parent will handle submission
            return;
        }
        const token = localStorage.getItem("authtoken");
        
        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }
        
        setIsSubmitting(true);

        try {
            if (isHybridMode) {
                // Check if user is still loading
                if (isUserLoading) {
                    alert("Please wait while user data is loading...");
                    return;
                }
                
                // Get user ID from useAuth - handle the case where user might be null initially
                const userId = user?.data?._id || user?._id;
                
                if (!userId) {
                    alert("User ID not found. Please login again.");
                    return;
                }

                const formDataToSend = new FormData();

                // Add user_id and basic data (for creating new records)
                if (!isEditMode) {
                    formDataToSend.append('user_id', userId);
                }
                formDataToSend.append('bio', safeFormData.bio);
                formDataToSend.append('yearsOfExperience', safeFormData.yearsOfExperience);

                // Handle existing files for updates
                if (isEditMode) {
                    formDataToSend.append('existingESign', existingFiles.eSign || '');

                    // Send existing files as arrays matching the order of titles
                    const existingDegreesArray = [];
                    const existingCertificatesArray = [];

                    // Build existing files arrays in correct order
                    safeFormData.degrees.forEach((degree, index) => {
                        existingDegreesArray.push(existingFiles.degrees[index] || '');
                    });

                    safeFormData.certificates.forEach((cert, index) => {
                        existingCertificatesArray.push(existingFiles.certificates[index] || '');
                    });

                    formDataToSend.append('existingDegrees', JSON.stringify(existingDegreesArray));
                    formDataToSend.append('existingCertificates', JSON.stringify(existingCertificatesArray));
                }

                // Add new files - only add files that are actually selected
                if (files.eSign) {
                    formDataToSend.append('eSign', files.eSign);
                }

                // Add new degree files - only add non-null files
                if (files.degrees && files.degrees.length > 0) {
                    files.degrees.forEach(file => {
                        if (file) {
                            formDataToSend.append('degrees', file);
                        }
                    });
                }

                // Add new certificate files - only add non-null files
                if (files.certificates && files.certificates.length > 0) {
                    files.certificates.forEach(file => {
                        if (file) {
                            formDataToSend.append('certificates', file);
                        }
                    });
                }

                // Add other data
                formDataToSend.append('degreeTitles', JSON.stringify(safeFormData.degrees.map(d => d.title)));
                formDataToSend.append('certificateTitles', JSON.stringify(safeFormData.certificates.map(c => c.title)));
                formDataToSend.append('specializations', JSON.stringify(safeFormData.specializations));
                formDataToSend.append('availability', JSON.stringify(safeFormData.availability));

                const headers = {
                    'Authorization': `Bearer ${token}`,
                };

                if (isEditMode && doctor) {
                    // Update existing doctor data
                    await axios.put(`${import.meta.env.VITE_BASE_URL}/doctors/update/${doctor._id}`, formDataToSend, { headers });
                    alert("Professional data updated successfully!");
                } else {
                    // Create new doctor data
                    await axios.post(`${import.meta.env.VITE_BASE_URL}/doctors/register-hybrid`, formDataToSend, { headers });
                    alert("Professional data submitted successfully!");
                }
                
                if (onSuccess) {
                    onSuccess();
                } else {
                    navigate("/doctor-list");
                }
            } else {
                // Original logic for regular doctor registration
                const formDataToSend = new FormData();

                // Add basic data
                formDataToSend.append('name', basicData.name);
                formDataToSend.append('email', basicData.email);
                formDataToSend.append('phone', basicData.phone);

                if (files.profileImage) {
                    formDataToSend.append('profileImageUrl', files.profileImage);
                } else if (
                    existingFiles.profileImage &&
                    typeof existingFiles.profileImage === 'string' &&
                    !existingFiles.profileImage.startsWith('blob:')
                ) {
                    formDataToSend.append('existingProfileImage', existingFiles.profileImage);
                }

                // Add professional data
                formDataToSend.append('bio', safeFormData.bio);
                formDataToSend.append('yearsOfExperience', safeFormData.yearsOfExperience);

                // Handle existing files
                formDataToSend.append('existingESign', existingFiles.eSign || '');

                // Send existing files as arrays matching the order of titles
                const existingDegreesArray = [];
                const existingCertificatesArray = [];

                // Build existing files arrays in correct order
                safeFormData.degrees.forEach((degree, index) => {
                    existingDegreesArray.push(existingFiles.degrees[index] || '');
                });

                safeFormData.certificates.forEach((cert, index) => {
                    existingCertificatesArray.push(existingFiles.certificates[index] || '');
                });

                formDataToSend.append('existingDegrees', JSON.stringify(existingDegreesArray));
                formDataToSend.append('existingCertificates', JSON.stringify(existingCertificatesArray));

                // Add new files - only add files that are actually selected
                if (files.eSign) {
                    formDataToSend.append('eSign', files.eSign);
                }

                // Add new degree files - only add non-null files
                if (files.degrees && files.degrees.length > 0) {
                    files.degrees.forEach(file => {
                        if (file) {
                            formDataToSend.append('degrees', file);
                        }
                    });
                }

                // Add new certificate files - only add non-null files
                if (files.certificates && files.certificates.length > 0) {
                    files.certificates.forEach(file => {
                        if (file) {
                            formDataToSend.append('certificates', file);
                        }
                    });
                }

                // Add other data
                formDataToSend.append('degreeTitles', JSON.stringify(safeFormData.degrees.map(d => d.title)));
                formDataToSend.append('certificateTitles', JSON.stringify(safeFormData.certificates.map(c => c.title)));
                formDataToSend.append('specializations', JSON.stringify(safeFormData.specializations));
                formDataToSend.append('availability', JSON.stringify(safeFormData.availability));

                const headers = {
                    'Authorization': `Bearer ${token}`,
                };

                if (isEditMode) {
                    await axios.put(`${import.meta.env.VITE_BASE_URL}/doctors/update/${doctor._id}`, formDataToSend, { headers });
                    alert("Doctor profile updated successfully!");
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    await axios.post(`${import.meta.env.VITE_BASE_URL}/doctors/register`, formDataToSend, { headers });
                    alert("Doctor profile submitted successfully!");
                    navigate("/doctor-list");
                }
            }

        } catch (error) {
            console.error('Error:', error);
            alert(isEditMode ? "Update failed. Please try again." : "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-4 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
                {!isHybridMode && (
                    <>
                        <div className='flex flex-col items-center'>
                            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= 1 ? 'bg-[#0096f2] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                1
                            </div>
                            <div className={`text-xs sm:text-sm mt-1 ${currentStep >= 1 ? 'text-[#0096f2]' : 'text-gray-500'}`}>Personal</div>
                        </div>

                        <div className={`h-1 transition-all duration-300 w-8 sm:w-20 ${currentStep > 1 ? 'bg-[#0096f2]' : 'bg-gray-200'}`}></div>
                    </>
                )}

                <div className='flex flex-col items-center'>
                    <div className={`flex transition-all duration-300 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= (isHybridMode ? 1 : 2) ? 'bg-[#0096f2] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {isHybridMode ? 1 : 2}
                    </div>
                    <div className={`text-xs sm:text-sm mt-1 ${currentStep >= (isHybridMode ? 1 : 2) ? 'text-[#0096f2]' : 'text-gray-500'}`}>
                        {isHybridMode ? 'Professional' : 'Professional'}
                    </div>
                </div>

                <div className={`h-1 transition-all duration-300 w-8 sm:w-20 ${currentStep > (isHybridMode ? 1 : 2) ? 'bg-[#0096f2]' : 'bg-gray-200'}`}></div>

                <div className='flex flex-col items-center'>
                    <div className={`flex transition-all duration-300 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${currentStep >= (isHybridMode ? 2 : 3) ? 'bg-[#0096f2] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {isHybridMode ? 2 : 3}
                    </div>
                    <div className={`text-xs sm:text-sm mt-1 ${currentStep >= (isHybridMode ? 2 : 3) ? 'text-[#0096f2]' : 'text-gray-500'}`}>Availability</div>
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6 sm:space-y-8">
            {/* Personal Information */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-4 border-b border-gray-200">
                    <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        {/* Add Profile Image Field Here */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Profile Photo
                            </label>
                            {(profilePreview || existingFiles.profileImage) ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <img
                                        src={profilePreview || existingFiles.profileImage}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={basicData.name}
                                onChange={(e) => handleBasicDataChange('name', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Dr. John Smith"
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
                    </div>
                </div>
            </section>

            {/* Step 1 Navigation */}
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
               {/* Specializations */}
               <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-4 border-b border-gray-200">
                    <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Specializations</h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                    <div className="relative">
                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                            onClick={() => setDropdownOpen((open) => !open)}
                        >
                            <span className="flex items-center gap-2">
                                {newSpecialization && categories.find(cat => cat.name === newSpecialization) ? (
                                    <>
                                        <img src={categories.find(cat => cat.name === newSpecialization).image} alt="" className="w-6 h-6 rounded-full object-cover" />
                                        {newSpecialization}
                                    </>
                                ) : (
                                    <span className="text-gray-400">Select specialization</span>
                                )}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                        {dropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {categories.map(cat => (
                                    <button
                                        type="button"
                                        key={cat._id}
                                        className={`flex items-center gap-2 w-full px-4 py-2 hover:bg-purple-100 ${safeFormData.specializations.includes(cat.name) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => {
                                            if (!safeFormData.specializations.includes(cat.name)) {
                                                setNewSpecialization(cat.name);
                                                setDropdownOpen(false);
                                            }
                                        }}
                                        disabled={safeFormData.specializations.includes(cat.name)}
                                    >
                                        <img src={cat.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                                        <span>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={addSpecialization}
                        className="mt-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        disabled={!newSpecialization || safeFormData.specializations.includes(newSpecialization)}
                    >
                        Add
                    </button>
                    {safeFormData.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {safeFormData.specializations.map((spec, index) => {
                                const cat = categories.find(c => c.name === spec);
                                return (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-purple-100 text-purple-800 rounded-lg text-xs sm:text-sm"
                                    >
                                        {cat && <img src={cat.image} alt="" className="w-5 h-5 rounded-full object-cover" />} {spec}
                                        <button
                                            type="button"
                                            onClick={() => removeSpecialization(index)}
                                            className="text-purple-600 hover:text-purple-800 transition-colors"
                                        >
                                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
            {/* Basic Information */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-4 border-b border-gray-200">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Professional Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Professional Bio *
                        </label>
                        <textarea
                            value={safeFormData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                            rows={4}
                            placeholder="Tell patients about your background, experience, and approach to healthcare..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Years of Experience
                        </label>
                        <input
                            type="number"
                            value={safeFormData.yearsOfExperience}
                            onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            min="0"
                            max="50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            eSign
                        </label>
                        {existingFiles.eSign ? (
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                <span className="text-xs sm:text-sm text-gray-600">Current file: <a className='text-blue-600 font-semibold' href={existingFiles.eSign}>Image Link</a>  </span>
                                <button
                                    type="button"
                                    onClick={() => setExistingFiles(prev => ({ ...prev, eSign: null }))}
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
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
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
                    {safeFormData.degrees.map((degree, index) => (
                        <div key={index} className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <h4 className="font-medium text-gray-800 text-sm sm:text-base">Degree {index + 1}</h4>
                                {safeFormData.degrees.length > 1 && (
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
                                        Degree Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={degree.title}
                                        onChange={(e) => updateDegree(index, 'title', e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="e.g., Doctor of Medicine (MD)"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        Certificate URL
                                    </label>
                                    {existingFiles.degrees[index] && (
                                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                            <span className="text-xs sm:text-sm text-gray-600">Current file: <a className='text-blue-600 font-semibold' href={existingFiles.degrees[index]}>Image Link</a></span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newExisting = [...existingFiles.degrees];
                                                    newExisting[index] = null;
                                                    setExistingFiles(prev => ({ ...prev, degrees: newExisting }));
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

            {/* Certificates */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pb-2 sm:pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Certificates</h2>
                    </div>
                    <button
                        type="button"
                        onClick={addCertificate}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        Add Certificate
                    </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {safeFormData.certificates.map((certificate, index) => (
                        <div key={index} className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <h4 className="font-medium text-gray-800 text-sm sm:text-base">Certificate {index + 1}</h4>
                                {safeFormData.certificates.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeCertificate(index)}
                                        className="text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        Certificate Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={certificate.title}
                                        onChange={(e) => updateCertificate(index, 'title', e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="e.g., Board Certification in Cardiology"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        Certificate URL
                                    </label>
                                    {existingFiles.certificates[index] && (
                                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                            <span className="text-xs sm:text-sm text-gray-600">Current file: <a className='text-blue-600 font-semibold' href={existingFiles.certificates[index]}>Image Link</a> </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newExisting = [...existingFiles.certificates];
                                                    newExisting[index] = null;
                                                    setExistingFiles(prev => ({ ...prev, certificates: newExisting }));
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
                                        onChange={(e) => updateCertificateFile(index, e.target.files[0])}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

         

            {/* Step 2 Navigation */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                {!isHybridMode && (
                    <button
                        type="button"
                        onClick={handlePrevious}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 sm:py-4 px-4 sm:px-8 rounded-lg font-semibold text-sm sm:text-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        Previous
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleNext}
                    className={`${isHybridMode ? 'w-full' : 'flex-1'} bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 sm:py-4 px-4 sm:px-8 rounded-lg font-semibold text-sm sm:text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2`}
                >
                    Next: Availability
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 sm:space-y-8">
            {/* Availability */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-4 border-b border-gray-200">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-800">Weekly Availability</h2>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {safeFormData.availability.map((dayData, dayIndex) => (
                        <div key={dayIndex} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">{dayData.day}</h3>
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${dayData.slots.length > 0
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {dayData.slots.length > 0 ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleDayAvailability(dayIndex)}
                                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${dayData.slots.length > 0
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {dayData.slots.length > 0 ? 'Mark Unavailable' : 'Mark Available'}
                                </button>
                            </div>

                            {dayData.slots.length > 0 && (
                                <div className="space-y-2 sm:space-y-3">
                                    {dayData.slots.map((slot, slotIndex) => (
                                        <div key={slotIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0 mt-1 sm:mt-0" />
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'startTime', e.target.value)}
                                                    className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                                />
                                                <span className="text-gray-500 text-sm sm:text-base">to</span>
                                                <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'endTime', e.target.value)}
                                                    className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                                                />
                                            </div>
                                            <div className="flex gap-1 sm:gap-2 ml-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => addTimeSlot(dayIndex)}
                                                    className="p-1 sm:p-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                                                    title="Add time slot"
                                                >
                                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </button>
                                                {dayData.slots.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                                        className="p-1 sm:p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                                        title="Remove time slot"
                                                    >
                                                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Step 3 Navigation */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 sm:py-4 px-4 sm:px-8 rounded-lg font-semibold text-sm sm:text-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Previous
                </button>
                {!isControlledMode && (
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting || (isHybridMode && isUserLoading)}
                        className={`flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 sm:py-4 px-4 sm:px-8 rounded-lg font-semibold text-sm sm:text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                            isSubmitting || (isHybridMode && isUserLoading) 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:from-green-700 hover:to-emerald-700'
                        }`}
                    >
                        {isHybridMode ? 'Submit Professional Data' : (isEditMode ? 'Update Profile' : 'Complete Registration')}
                        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-4 sm:py-8 relative">
            {/* Full Page Loader */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="text-lg font-medium text-gray-700">
                            {isHybridMode ? 'Submitting Professional Data...' : (isEditMode ? 'Updating Profile...' : 'Completing Registration...')}
                        </p>
                    </div>
                </div>
            )}
            
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
                            {isHybridMode ? 'Add Professional Data' : (isEditMode ? 'Update Doctor Profile' : 'Doctor Registration')}
                        </h1>
                        <p className="text-sm sm:text-lg text-gray-600">
                            {isHybridMode ? 'Add your professional information and availability' : (isEditMode ? 'Update your professional profile' : 'Complete your professional profile to start helping patients')}
                        </p>
                    </div>
                    {renderStepIndicator()}

                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8">
                        <form onSubmit={handleSubmit}>
                            {!isHybridMode && currentStep === 1 && renderStep1()}
                            {(isHybridMode ? currentStep === 1 : currentStep === 2) && renderStep2()}
                            {(isHybridMode ? currentStep === 2 : currentStep === 3) && renderStep3()}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorRegisterationForm;