import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Building, Phone, Mail, Globe, User, CheckCircle, AlertCircle, Upload, Image, CreditCard, FileText, Receipt } from 'lucide-react';
import axios from 'axios'
import { BACKEND_URL } from './utils/urlConstants';
import DoctorRegisterationForm from './components/doctor/DoctorRegisterationForm';
import { FormLoader } from './components/ui/FormLoader';
const StatusType = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

const ClinicOnboarding = () => {
    const [formData, setFormData] = useState({
        logo: null,
        name: '',
        email: '',
        phone: '',
        website: '',
        ownerName: '',
        status: StatusType.ACTIVE,
        type: '',
        eSign: null,
        membership: '',
        haveCustomMembership: false,
        panNumber: '',
        gstNumber: '',
        availableLocations: [
            {
                place: '',
                street: '',
                city: '',
                state: '',
                zipCode: '',
                googleMapUrl: '',
                status: StatusType.ACTIVE,
                membership: '',
            }
        ]
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Get membership price
    const getMembershipPrice = (membershipType) => {
        switch (membershipType) {
            case 'Standard':
                return 999; // ₹999
            case 'Premium':
                return 1999; // ₹1999
            default:
                return 0;
        }
    };

    // Handle payment
    const handlePayment = async () => {
        if (!validateForm()) return;
        
        setPaymentLoading(true);
        try {
            const amount = getMembershipPrice(formData.membership);
            if (amount === 0) {
                alert('Please select a valid membership type');
                return;
            }

            // Create order on backend
            const token = localStorage.getItem('authtoken');
            const orderResponse = await axios.post(`${BACKEND_URL}/payment/create-order`, {
                amount: amount * 100, // Convert to paise
                currency: 'INR',
                receipt: `clinic_${Date.now()}`,
                notes: {
                    clinic_name: formData.name,
                    membership_type: formData.membership
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const { order_id } = orderResponse.data;

            // Initialize Razorpay
            const options = {
                key: import.meta.env.VITE_APP_RAZORPAY_KEY_ID || "rzp_test_u5bPjgtTwwvMlQ", // Replace with your actual Razorpay key
                amount: amount * 100,
                currency: 'INR',
                name: 'PrevaCare',
                description: `${formData.membership} Membership`,
                order_id: order_id,
                handler: async function (response) {
                    try {
                        // Verify payment on backend
                        const verifyResponse = await axios.post(`${BACKEND_URL}/payment/verify`, {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        }, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (verifyResponse.data.success) {
                            alert('Payment successful! Proceeding with clinic registration...');
                            // Proceed with clinic registration
                            await handleClinicRegistration();
                        } else {
                            alert('Payment verification failed. Please try again.');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        alert('Payment verification failed. Please try again.');
                    }
                },
                prefill: {
                    name: formData.ownerName,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: {
                    color: '#3B82F6'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment initialization failed. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    // Handle clinic registration after payment
    const handleClinicRegistration = async () => {
        setLoading(true);
        try {
            const submitFormData = new FormData();

            // Append basic form data
            submitFormData.append('name', formData.name);
            submitFormData.append('email', formData.email);
            submitFormData.append('phone', formData.phone);
            submitFormData.append('website', formData.website);
            submitFormData.append('ownerName', formData.ownerName);
            submitFormData.append('status', formData.status);
            submitFormData.append('type', formData.type);
            submitFormData.append('membership', formData.membership);
            submitFormData.append('haveCustomMembership', formData.haveCustomMembership);
            submitFormData.append('panNumber', formData.panNumber);
            submitFormData.append('gstNumber', formData.gstNumber);

            // Append files
            if (formData.logoFile) {
                submitFormData.append('logo', formData.logoFile);
            }
            if (formData.eSignFile) {
                submitFormData.append('eSign', formData.eSignFile);
            }

            // Append locations
            formData.availableLocations.forEach((location, index) => {
                submitFormData.append(`locations[${index}][place]`, location.place);
                submitFormData.append(`locations[${index}][street]`, location.street);
                submitFormData.append(`locations[${index}][city]`, location.city);
                submitFormData.append(`locations[${index}][state]`, location.state);
                submitFormData.append(`locations[${index}][zipCode]`, location.zipCode);
                submitFormData.append(`locations[${index}][googleMapUrl]`, location.googleMapUrl);
                submitFormData.append(`locations[${index}][status]`, location.status);
                submitFormData.append(`locations[${index}][membership]`, location.membership);
            });

            // Append doctor data if type is individual
            if (formData.type === 'individual') {
                // Basic doctor info
                submitFormData.append('doctor[name]', doctorBasicData.name);
                submitFormData.append('doctor[email]', doctorBasicData.email);
                submitFormData.append('doctor[phone]', doctorBasicData.phone);
                // Professional info
                submitFormData.append('doctor[bio]', doctorFormData.bio);
                submitFormData.append('doctor[yearsOfExperience]', doctorFormData.yearsOfExperience);
                submitFormData.append('doctor[specializations]', JSON.stringify(doctorFormData.specializations));
                submitFormData.append('doctor[availability]', JSON.stringify(doctorFormData.availability));
                // Degrees
                submitFormData.append('doctor[degreeTitles]', JSON.stringify(doctorFormData.degrees.map(d => d.title)));
                if (doctorFiles.degrees && doctorFiles.degrees.length > 0) {
                    doctorFiles.degrees.forEach((file) => {
                        if (file) submitFormData.append('doctor[degrees]', file);
                    });
                }
                // Certificates
                submitFormData.append('doctor[certificateTitles]', JSON.stringify(doctorFormData.certificates.map(c => c.title)));
                if (doctorFiles.certificates && doctorFiles.certificates.length > 0) {
                    doctorFiles.certificates.forEach((file) => {
                        if (file) submitFormData.append('doctor[certificates]', file);
                    });
                }
                // eSign
                if (doctorFiles.eSign) {
                    submitFormData.append('doctor[eSign]', doctorFiles.eSign);
                }
                // Profile image
                if (doctorFiles.profileImage) {
                    submitFormData.append('doctor[profileImageUrl]', doctorFiles.profileImage);
                }
            }

            const token = localStorage.getItem('authtoken');

            const response = await axios.post(BACKEND_URL+'/clinic/register', submitFormData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log(response.data);

            if (response.status === 200 || response.status === 201) {
                alert('Clinic registered successfully!');
                // Reset form
                setFormData({
                    logo: null,
                    logoFile: null,
                    name: '',
                    email: '',
                    phone: '',
                    website: '',
                    ownerName: '',
                    status: StatusType.ACTIVE,
                    type: '',
                    eSign: null,
                    eSignFile: null,
                    membership: '',
                    haveCustomMembership: false,
                    panNumber: '',
                    gstNumber: '',
                    availableLocations: [{
                        place: '',
                        street: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        googleMapUrl: '',
                        status: StatusType.ACTIVE,
                        membership: '',
                    }]
                });
                // Reset doctor forms
                setDoctorFormData({
                    user_id: '',
                    bio: '',
                    yearsOfExperience: '',
                    eSign: '',
                    degrees: [{ title: '', degrees_image_url: '' }],
                    certificates: [{ title: '', certificates_image_url: '' }],
                    specializations: [],
                    availability: [
                        { day: 'Monday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
                        { day: 'Tuesday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
                        { day: 'Wednesday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
                        { day: 'Thursday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
                        { day: 'Friday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
                        { day: 'Saturday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
                        { day: 'Sunday', slots: [] },
                    ],
                });
                setDoctorFiles({
                    profileImage: null,
                    eSign: null,
                    degrees: [null],
                    certificates: [null],
                });
                setDoctorBasicData({
                    name: '',
                    email: '',
                    phone: '',
                });
            } else {
                throw new Error(response.data.message || 'Failed to register clinic');
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            alert(error.response?.data?.message || error.message || 'Error registering clinic. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Add doctor form state
    const [doctorFormData, setDoctorFormData] = useState({
        user_id: '',
        bio: '',
        yearsOfExperience: '',
        eSign: '',
        degrees: [{ title: '', degrees_image_url: '' }],
        certificates: [{ title: '', certificates_image_url: '' }],
        specializations: [],
        availability: [
            { day: 'Monday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
            { day: 'Tuesday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
            { day: 'Wednesday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
            { day: 'Thursday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
            { day: 'Friday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
            { day: 'Saturday', slots: [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }] },
            { day: 'Sunday', slots: [] },
        ],
    });
    const [doctorFiles, setDoctorFiles] = useState({
        profileImage: null,
        eSign: null,
        degrees: [null],
        certificates: [null],
    });
    const [doctorBasicData, setDoctorBasicData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleFileUpload = (field, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    [field]: reader.result,
                    [`${field}File`]: file // Store the File object for FormData
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLocationChange = (index, field, value) => {
        const updatedLocations = [...formData.availableLocations];
        updatedLocations[index] = {
            ...updatedLocations[index],
            [field]: value
        };

        setFormData(prev => ({
            ...prev,
            availableLocations: updatedLocations
        }));

        if (errors[`location_${index}_${field}`]) {
            setErrors(prev => ({
                ...prev,
                [`location_${index}_${field}`]: ''
            }));
        }
    };

    const addLocation = () => {
        setFormData(prev => ({
            ...prev,
            availableLocations: [
                ...prev.availableLocations,
                {
                    place: '',
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    googleMapUrl: '',
                    status: StatusType.ACTIVE,
                    membership: '',
                }
            ]
        }));
    };

    const removeLocation = (index) => {
        if (formData.availableLocations.length > 1) {
            const updatedLocations = formData.availableLocations.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                availableLocations: updatedLocations
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Basic info validation
        if (!formData.name.trim()) newErrors.name = 'Clinic name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
        if (!formData.type.trim()) newErrors.type = 'Clinic type is required';
        if (!formData.membership.trim()) newErrors.membership = 'Membership type is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // PAN validation (optional but must be valid if provided)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (formData.panNumber && !panRegex.test(formData.panNumber.toUpperCase())) {
            newErrors.panNumber = 'PAN must be in format: AAAAA9999A (e.g., ABCDE1234F)';
        }

        // GST validation (optional but must be valid if provided)
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (formData.gstNumber && !gstRegex.test(formData.gstNumber.toUpperCase())) {
            newErrors.gstNumber = 'GST must be in format: 99AAAAA9999A9Z9 (e.g., 22ABCDE1234F1Z5)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}

                {/* Basic Information Section */}
                <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-xl p-8 mb-8">
                    <div className="flex items-center mb-8">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                            <Building className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Logo Upload */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Clinic Logo
                            </label>
                            <div className="relative group">
                                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer ${formData.logo ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400'}`}>
                                    {formData.logo ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img
                                                src={formData.logo}
                                                alt="Clinic logo"
                                                className="max-h-full max-w-full object-contain rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-3 text-gray-400 group-hover:text-blue-500" />
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, GIF (MAX. 5MB)
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        name="logo"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={e => handleFileUpload('logo', e)}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Clinic Name *
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-medium ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                        }`}
                                    placeholder="Enter your clinic name"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.name && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Owner Name *
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                                <input
                                    type="text"
                                    value={formData.ownerName}
                                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.ownerName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                        }`}
                                    placeholder="Enter owner name"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.ownerName && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.ownerName}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Email Address *
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                        }`}
                                    placeholder="clinic@example.com"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.email && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Phone Number *
                            </label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className={`w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.phone ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                        }`}
                                    placeholder="+1 (555) 123-4567"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.phone && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.phone}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Website
                            </label>
                            <div className="relative group">
                                <Globe className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 hover:border-blue-300 transition-all duration-300"
                                    placeholder="https://yourwebsite.com"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                PAN Number
                                <span className="text-xs text-gray-500 ml-2">(For invoice generation)</span>
                            </label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                                <input
                                    type="text"
                                    value={formData.panNumber}
                                    onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                                    className={`w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.panNumber ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'}`}
                                    placeholder="ABCDE1234F"
                                    maxLength="10"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.panNumber && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.panNumber}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                GST Number
                                <span className="text-xs text-gray-500 ml-2">(For invoice generation)</span>
                            </label>
                            <div className="relative group">
                                <Receipt className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                                <input
                                    type="text"
                                    value={formData.gstNumber}
                                    onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                                    className={`w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.gstNumber ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'}`}
                                    placeholder="22ABCDE1234F1Z5"
                                    maxLength="15"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.gstNumber && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.gstNumber}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Clinic Type
                            </label>
                            <div className="relative group">
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.type ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'}`}
                                >
                                    <option value="">Select clinic type</option>
                                    <option value="individual">Individual</option>
                                    <option value="organization">Organization</option>
                                </select>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.type && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.type}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Membership Type *
                            </label>
                            <div className="relative group">
                                <select
                                    value={formData.membership}
                                    onChange={(e) => handleInputChange('membership', e.target.value)}
                                    className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.membership ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'}`}
                                >
                                    <option value="">Select membership type</option>
                                    <option value="Standard">Standard</option>
                                    <option value="Premium">Premium</option>
                                </select>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                            {errors.membership && (
                                <div className="flex items-center mt-2 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.membership}
                                </div>
                            )}
                        </div>

                        {/* eSign Upload */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Electronic Signature
                            </label>
                            <div className="relative group">
                                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer ${formData.eSign ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400'}`}>
                                    {formData.eSign ? (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img
                                                src={formData.eSign}
                                                alt="Electronic signature"
                                                className="max-h-full max-w-full object-contain rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <Image className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Image className="w-8 h-8 mb-3 text-gray-400 group-hover:text-blue-500" />
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span className="font-semibold">Click to upload</span> your signature
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG (MAX. 2MB)
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        name="eSign"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={e => handleFileUpload('eSign', e)}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center p-4 bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-200 mt-6">
                        <input
                            type="checkbox"
                            id="customMembership"
                            checked={formData.haveCustomMembership}
                            onChange={(e) => handleInputChange('haveCustomMembership', e.target.checked)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-300"
                        />
                        <label htmlFor="customMembership" className="ml-3 block text-sm font-medium text-gray-700">
                            This clinic has a custom membership plan
                        </label>
                    </div>
                </div>

                {/* Locations Section */}
                <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Clinic Locations</h2>
                        </div>
                        <button
                            type="button"
                            onClick={addLocation}
                            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center">
                                <Plus className="w-5 h-5 mr-2" />
                                Add Location
                            </div>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {formData.availableLocations.map((location, index) => (
                            <div key={index} className="relative p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-3xl"></div>

                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                                            {index + 1}
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">
                                            Location {index + 1}
                                        </h4>
                                    </div>

                                    {formData.availableLocations.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeLocation(index)}
                                            className="group p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-300"
                                        >
                                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Place Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={location.place}
                                            onChange={(e) => handleLocationChange(index, 'place', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors[`location_${index}_place`] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                                }`}
                                            placeholder="Main Clinic, Branch Office, etc."
                                        />
                                        {errors[`location_${index}_place`] && (
                                            <div className="flex items-center mt-2 text-red-500 text-sm">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors[`location_${index}_place`]}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Street Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={location.street}
                                            onChange={(e) => handleLocationChange(index, 'street', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors[`location_${index}_street`] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                                }`}
                                            placeholder="123 Main Street"
                                        />
                                        {errors[`location_${index}_street`] && (
                                            <div className="flex items-center mt-2 text-red-500 text-sm">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors[`location_${index}_street`]}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            value={location.city}
                                            onChange={(e) => handleLocationChange(index, 'city', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors[`location_${index}_city`] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                                }`}
                                            placeholder="New York"
                                        />
                                        {errors[`location_${index}_city`] && (
                                            <div className="flex items-center mt-2 text-red-500 text-sm">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors[`location_${index}_city`]}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            value={location.state}
                                            onChange={(e) => handleLocationChange(index, 'state', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors[`location_${index}_state`] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                                }`}
                                            placeholder="NY"
                                        />
                                        {errors[`location_${index}_state`] && (
                                            <div className="flex items-center mt-2 text-red-500 text-sm">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors[`location_${index}_state`]}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Zip Code *
                                        </label>
                                        <input
                                            type="text"
                                            value={location.zipCode}
                                            onChange={(e) => handleLocationChange(index, 'zipCode', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors[`location_${index}_zipCode`] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-400 hover:border-blue-300'
                                                }`}
                                            placeholder="10001"
                                        />
                                        {errors[`location_${index}_zipCode`] && (
                                            <div className="flex items-center mt-2 text-red-500 text-sm">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors[`location_${index}_zipCode`]}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Google Maps URL
                                        </label>
                                        <input
                                            type="url"
                                            value={location.googleMapUrl}
                                            onChange={(e) => handleLocationChange(index, 'googleMapUrl', e.target.value)}
                                            className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 hover:border-blue-300 transition-all duration-300"
                                            placeholder="https://maps.google.com/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Doctor Registration Form (if type is individual) */}
                {formData.type === 'individual' && (
                    <div className="mt-8">
                        <DoctorRegisterationForm
                            formData={doctorFormData}
                            files={doctorFiles}
                            basicData={doctorBasicData}
                            onFormDataChange={(field, value) => {
                                setDoctorFormData(prev => ({
                                    ...prev,
                                    [field]: value
                                }));
                            }}
                            onFilesChange={(field, value) => {
                                setDoctorFiles(prev => ({
                                    ...prev,
                                    [field]: value
                                }));
                            }}
                            onBasicDataChange={(field, value) => {
                                setDoctorBasicData(prev => ({
                                    ...prev,
                                    [field]: value
                                }));
                            }}
                            isEditMode={false}
                            isHybridMode={true}
                            disabled={loading || false}
                        />
                    </div>
                )}

                {/* Membership Pricing Display */}
                {formData.membership && (
                    <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-xl p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Membership Details</h2>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-800">{formData.membership} Membership</h3>
                                <div className="text-2xl font-bold text-purple-600">
                                    ₹{getMembershipPrice(formData.membership)}
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                                {formData.membership === 'Standard' && (
                                    <>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            Basic clinic management features
                                        </div>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            Patient appointment scheduling
                                        </div>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            Basic reporting and analytics
                                        </div>
                                    </>
                                )}
                                {formData.membership === 'Premium' && (
                                    <>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            All Standard features
                                        </div>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            Advanced analytics and reporting
                                        </div>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            Priority customer support
                                        </div>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            Custom integrations
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handlePayment}
                        disabled={loading || paymentLoading || !formData.membership}
                        className={`group relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center ${(loading || paymentLoading || !formData.membership) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center">
                            {loading || paymentLoading ? (
                                <FormLoader size="md" text={paymentLoading ? 'Processing Payment...' : 'Registering Clinic...'} />
                            ) : (
                                <>
                                    <CreditCard className="w-6 h-6 mr-3" />
                                    {formData.membership ? `Pay ₹${getMembershipPrice(formData.membership)} & Register Clinic` : 'Select Membership to Continue'}
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClinicOnboarding;