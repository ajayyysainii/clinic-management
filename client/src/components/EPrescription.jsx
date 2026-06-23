import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {BACKEND_URL} from '../utils/urlConstants'
import { useParams, useSearchParams, useNavigate } from 'react-router';
import {
    User,
    Stethoscope,
    Calendar,
    FileText,
    Activity,
    TestTube,
    Pill,
    MessageCircle,
    Plus,
    Minus,
    CheckCircle,
    Heart,
    ClipboardCheck,
    Loader2,
    X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios'; // Added axios import

const EPrescriptionForm = () => {

    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const appointmentId = searchParams.get('appointmentId');
    const userId = id;
    const { user } = useAuth();
    const doctorId = user?.data?._id;
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        setValue // Added setValue
    } = useForm({
        defaultValues: {
            patient: userId,
            doctor: doctorId,
            date: '',
            prescriptionID: '',
            sx: '',
            vitals: {
                BP: '',
                PR: '',
                SpO2: ''
            },
            dx: [{ diagnosisName: '', dateOfDiagnosis: '' }],
            labTest: [{ name: '' }], // Changed to object structure
            rx: [{ drugName: '', freequency: '', duration: '', quantity: '' }],
            advice: '',
            followUpSchedule: '',
            link: '',
            consultationMode: '',
            originatedFromEmr: true
        }
    });

    const { fields: dxFields, append: appendDx, remove: removeDx } = useFieldArray({
        control,
        name: 'dx'
    });

    const { fields: labTestFields, append: appendLabTest, remove: removeLabTest } = useFieldArray({
        control,
        name: 'labTest'
    });

    const { fields: rxFields, append: appendRx, remove: removeRx } = useFieldArray({
        control,
        name: 'rx'
    });

    const [imagePreviews, setImagePreviews] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageRemarks, setImageRemarks] = useState([]); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Prefill patient info from API
    useEffect(() => {
        const prefillPatientInfo = async () => {
            try {
                const token = localStorage.getItem('authtoken');
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/patients/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data && response.data.data && response.data.data.length > 0) {
                    const patient = response.data.data[0];
                    const user = patient.userId || {};
                    // Prefill patient information
                    setValue('patient.name', user.name || '');
                    setValue('patient.age', patient.age || '');
                    setValue('patient.gender', user.gender || '');
                }
            } catch (error) {
                console.error('Error fetching patient info:', error);
            }
        };
        prefillPatientInfo();
    }, [userId, setValue]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedImages(files);
        // Generate previews
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
        setImageRemarks(Array(files.length).fill(''));
    };

    // Add handler for remark change
    const handleRemarkChange = (idx, value) => {
        setImageRemarks(prev => {
            const updated = [...prev];
            updated[idx] = value;
            return updated;
        });
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Transform data to match backend expectations
            const transformedData = {
                ...data,
                patient: userId, // Send patient ID instead of object
                doctor: doctorId, // Send doctor ID instead of object
                labTest: data.labTest.map(test => test.name).filter(name => name.trim() !== ''),
                // Remove patient object fields that should be sent separately
                patientName: data.patient?.name,
                patientAge: data.patient?.age,
                patientGender: data.patient?.gender,
            };

            // Prepare FormData for multipart/form-data
            const formData = new FormData();
            // Append all fields except images
            Object.entries(transformedData).forEach(([key, value]) => {
                if (key === 'labTest' || key === 'dx' || key === 'rx' || key === 'vitals') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            });
            // Append images
            selectedImages.forEach((file) => {
                formData.append('images', file);
            });
            // Append image remarks as JSON array
            formData.append('imageRemarks', JSON.stringify(imageRemarks));

            const response = await fetch(BACKEND_URL + '/prescription/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authtoken')}`
                    // Do not set Content-Type, browser will set it
                },
                body: formData
            });

            if (response.ok) {
                console.log('Prescription created successfully');

                // If opened from an appointment, mark it as Completed
                if (appointmentId) {
                    try {
                        const token = localStorage.getItem('authtoken');
                        await axios.put(`${BACKEND_URL}/appointments/update/${appointmentId}`, {
                            status: 'Completed',
                        }, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        console.log('Appointment marked as Completed');
                    } catch (appointmentErr) {
                        console.error('Failed to update appointment status:', appointmentErr);
                    }
                }

                setShowSuccessPopup(true);
                // Reset form after successful submission
                // You can add form reset logic here if needed
            } else {
                throw new Error(`Request failed with status ${response.status}`);
            }
        } catch (error) {
            console.error('Error submitting prescription:', error);
            // You can add error handling here (show error message)
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeSuccessPopup = () => {
        setShowSuccessPopup(false);
        // If opened from an appointment, navigate back to appointments
        if (appointmentId) {
            navigate('/appointments');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Prescription Submitted Successfully!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Your prescription has been created and saved successfully.
                            </p>
                            <button
                                onClick={closeSuccessPopup}
                                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                Continue
                            </button>
                        </div>
                        <button
                            onClick={closeSuccessPopup}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-600 rounded-xl">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-800">E-Prescription Form</h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Complete digital prescription form with comprehensive patient information, diagnosis, and treatment details.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
                    {/* Patient Information */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <User className="w-5 h-5" />
                            </div>
                            Patient Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Patient Name<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    {...register('patient.name', { required: 'Patient name is required' })}
                                    placeholder="Enter patient's full name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.patient?.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.patient.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Age<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="number"
                                    {...register('patient.age', {
                                        required: 'Age is required',
                                        min: { value: 0, message: 'Age must be positive' }
                                    })}
                                    placeholder="Enter age"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.patient?.age && (
                                    <p className="text-red-500 text-sm mt-1">{errors.patient.age.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Gender<span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    {...register('patient.gender', { required: 'Gender is required' })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.patient?.gender && (
                                    <p className="text-red-500 text-sm mt-1">{errors.patient.gender.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Doctor Information
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            Doctor Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    First Name<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    {...register('doctor.firstName', { required: 'First name is required' })}
                                    placeholder="Doctor's first name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.doctor?.firstName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.doctor.firstName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Last Name<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    {...register('doctor.lastName', { required: 'Last name is required' })}
                                    placeholder="Doctor's last name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.doctor?.lastName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.doctor.lastName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Degree<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    {...register('doctor.degree', { required: 'Degree is required' })}
                                    placeholder="e.g., MBBS, MD"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.doctor?.degree && (
                                    <p className="text-red-500 text-sm mt-1">{errors.doctor.degree.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Specialization<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    {...register('doctor.specialization', { required: 'Specialization is required' })}
                                    placeholder="e.g., Cardiology, Pediatrics"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.doctor?.specialization && (
                                    <p className="text-red-500 text-sm mt-1">{errors.doctor.specialization.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Medical Registration Number<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    {...register('doctor.medicalRegistrationNumber', { required: 'Registration number is required' })}
                                    placeholder="Registration number"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.doctor?.medicalRegistrationNumber && (
                                    <p className="text-red-500 text-sm mt-1">{errors.doctor.medicalRegistrationNumber.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    E-Signature<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    {...register('doctor.eSign', { required: 'E-Signature is required' })}
                                    placeholder="Digital signature"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                                {errors.doctor?.eSign && (
                                    <p className="text-red-500 text-sm mt-1">{errors.doctor.eSign.message}</p>
                                )}
                            </div>
                        </div>
                    </div> */}

                    {/* Prescription Details */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            Prescription Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Date<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('date', { required: 'Date is required' })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                />
                                {errors.date && (
                                    <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Prescription ID<span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        {...register('prescriptionID', { required: 'Prescription ID is required' })}
                                        placeholder="Unique prescription identifier"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const randomNum = Math.floor(1000 + Math.random() * 9000);
                                            setValue('prescriptionID', `P-${randomNum}`);
                                        }}
                                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Generate
                                    </button>
                                </div>
                                {errors.prescriptionID && (
                                    <p className="text-red-500 text-sm mt-1">{errors.prescriptionID.message}</p>
                                )}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Symptoms (Sx)</label>
                                <textarea
                                    rows={3}
                                    {...register('sx')}
                                    placeholder="Patient's symptoms and complaints"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Consultation Mode<span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    {...register('consultationMode', { required: 'Consultation mode is required' })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                >
                                    <option value="">Select Mode</option>
                                    <option value="on site">On Site</option>
                                    <option value="online">Online</option>
                                </select>
                                {errors.consultationMode && (
                                    <p className="text-red-500 text-sm mt-1">{errors.consultationMode.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vital Signs */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            Vital Signs
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Blood Pressure (BP)</label>
                                <input
                                    {...register('vitals.BP')}
                                    placeholder="e.g., 120/80 mmHg"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Pulse Rate (PR)</label>
                                <input
                                    {...register('vitals.PR')}
                                    placeholder="e.g., 72 bpm"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">SpO2</label>
                                <input
                                    {...register('vitals.SpO2')}
                                    placeholder="e.g., 98%"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Diagnoses */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <ClipboardCheck className="w-5 h-5" />
                            </div>
                            Diagnoses (Dx)
                        </h2>
                        <div className="space-y-4">
                            {dxFields.map((item, index) => (
                                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Diagnosis Name</label>
                                            <input
                                                {...register(`dx.${index}.diagnosisName`)}
                                                placeholder="Enter diagnosis"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Date of Diagnosis</label>
                                            <input
                                                type="date"
                                                {...register(`dx.${index}.dateOfDiagnosis`)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                    {dxFields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeDx(index)}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                            Remove Diagnosis
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => appendDx({ diagnosisName: '', dateOfDiagnosis: '' })}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Diagnosis
                            </button>
                        </div>
                    </div>

                    {/* Lab Tests - Fixed */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <TestTube className="w-5 h-5" />
                            </div>
                            Lab Tests
                        </h2>
                        <div className="space-y-4">
                            {labTestFields.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <input
                                        {...register(`labTest.${index}.name`)}
                                        placeholder="Enter lab test name"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    />
                                    {labTestFields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeLabTest(index)}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => appendLabTest({ name: '' })}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Lab Test
                            </button>
                        </div>
                    </div>

                    {/* Medications */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Pill className="w-5 h-5" />
                            </div>
                            Prescribed Medications (Rx)
                        </h2>
                        <div className="space-y-4">
                            {rxFields.map((item, index) => (
                                <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Drug Name</label>
                                            <input
                                                {...register(`rx.${index}.drugName`)}
                                                placeholder="Enter medication name"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Frequency</label>
                                            <input
                                                {...register(`rx.${index}.freequency`)}
                                                placeholder="e.g., 1-0-1"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Duration</label>
                                            <input
                                                {...register(`rx.${index}.duration`)}
                                                placeholder="e.g., 7 days"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                            <input
                                                {...register(`rx.${index}.quantity`)}
                                                placeholder="e.g., 21 tablets"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                            />
                                        </div>
                                    </div>
                                    {rxFields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRx(index)}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                            Remove Medication
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => appendRx({ drugName: '', freequency: '', duration: '', quantity: '' })}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Medication
                            </button>
                        </div>
                    </div>

                    {/* Advice */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            Medical Advice
                        </h2>
                        <div className="space-y-4">
                            <textarea
                                rows={4}
                                {...register('advice')}
                                placeholder="Enter medical advice or instructions"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                            />
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Heart className="w-5 h-5" />
                            </div>
                            Additional Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Follow-up Schedule</label>
                                <input
                                    {...register('followUpSchedule')}
                                    placeholder="e.g., After 1 week"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Prescription PDF Link</label>
                                <input
                                    {...register('link')}
                                    placeholder="Enter PDF link if available"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            Upload Images
                        </h2>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {/* Preview selected images and remarks */}
                        {imagePreviews.length > 0 && (
                            <div className="flex flex-wrap gap-4 mt-2">
                                {imagePreviews.map((src, idx) => (
                                    <div key={idx} className="flex flex-col items-center w-32">
                                        <div className="w-24 h-24 border rounded overflow-hidden flex items-center justify-center bg-gray-50 mb-2">
                                            <img src={src} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Remark for this image"
                                            value={imageRemarks[idx] || ''}
                                            onChange={e => handleRemarkChange(idx, e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transform transition-all duration-200 shadow-lg ${
                                isSubmitting 
                                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:scale-105 hover:shadow-xl'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Submit Prescription
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EPrescriptionForm;