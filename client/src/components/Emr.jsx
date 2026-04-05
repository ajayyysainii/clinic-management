import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { User, Heart, Stethoscope, FileText, Calendar, Phone, MapPin, Activity, Thermometer, Scale, Ruler, Eye, Settings as Lungs, Brain, Pill, Syringe, AlertTriangle, Save, Plus, Trash2, Clock, Shield, Users, Cigarette, Wine, Bed, Utensils, CheckCircle, XCircle, Scissors } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth'
import { differenceInYears, parseISO } from 'date-fns';

const EMRForm = () => {
    const { id } = useParams();
    const userId = id;
    const { user } = useAuth();
    const doctorId = user?.data?._id;

    // State to store fetched EMR data
    const [allEMRs, setAllEMRs] = useState([]); // Store all EMRs
    const [isLoading, setIsLoading] = useState(true);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageRemarks, setImageRemarks] = useState([]);

    // Fetch EMR data on component mount
    useEffect(() => {
        const fetchEMRData = async () => {
            try {
                const token = localStorage.getItem('authtoken');
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/emr/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log(response)
                if (response.data && response.data.data && response.data.data.length > 0) {
                    setAllEMRs(response.data.data); // Store all EMRs
                }
            } catch (error) {
                console.error('Error fetching EMR data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEMRData();
    }, [userId]);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting, isSubmitSuccessful }
    } = useForm({
        defaultValues: {
            user: userId,
            doctor: doctorId,
            link: '',
            basicInfo: {
                name: '',
                age: '',
                children: '',
                gender: '',
                phoneNumber: '',
                maritalStatus: false,
                bloodGroup: '',
                address: {
                    name: '',
                    street: '',
                    city: '',
                    state: '',
                    zipCode: ''
                }
            },
            history: {
                chiefComplaint: '',
                historyOfPresentingIllness: '',
                complaints: [],
                pastHistory: [],
                surgicalHistory: [],
                familyHistory: {
                    father: {
                        isAlive: true,
                        condition: '',
                        diagnosisTimeframe: '',
                        onMedication: 'No',
                        medications: [],
                        surgicalHistory: [],
                        reasonOfDeath: '',
                        yearOfDeath: ''
                    },
                    mother: {
                        isAlive: true,
                        condition: '',
                        diagnosisTimeframe: '',
                        onMedication: 'No',
                        medications: [],
                        surgicalHistory: [],
                        reasonOfDeath: '',
                        yearOfDeath: ''
                    },
                    familyConditions: {
                        suddenCardiacDeath: false,
                        diabetes: false,
                        hypertension: false,
                        alzheimers: false,
                        parkinsonsDisease: false,
                        liverCirrhosis: false,
                        cancer: false,
                        notes: ''
                    }
                },
                allergies: {
                    pastAllergyPrescription: [],
                    newAllergyPrescription: []
                },
                habits: {
                    smoking: false,
                    packYears: '',
                    alcohol: false,
                    alcoholDetails: '',
                    qntPerWeek: '',
                    substanceAbuse: ''
                },
                bowelAndBladder: '',
                appetite: '',
                sleep: '',
                stressScreening: {
                    desc: '',
                    recomendation: '',
                    score: ''
                },
                depressionScreening: {
                    desc: '',
                    recomendation: '',
                    score: ''
                },
                mentalHealthAssessment: ''
            },
            generalPhysicalExamination: {
                PR: '',
                BP: { sys: '', dia: '' },
                volume: '',
                regularity: '',
                character: '',
                temperature: '',
                temperatureVal: '',
                RR: '',
                SPO2: '',
                radioFemoralDelay: '',
                height: '',
                weight: '',
                BMI: '',
                pallor: '',
                icterus: '',
                cyanosis: '',
                clubbing: '',
                lymphadenopathy: '',
                edema: '',
                JVP: '',
                doctorNotes: '',
                showInEPrescription: true
            },
            systemicExamination: {
                respiratorySystem: '',
                CVS: '',
                CNS: '',
                PA: '',
                otherSystemicFindings: ''
            },
            immunization: [],
            diagnosis: [],
            advice: '',
            referrals: '',
            followUpSchedule: '',
            doctorNotes: '',
            consultationMode: '',
            emrPdfFileUrl: ''
        }
    });


    // Field arrays for dynamic sections
    const { fields: surgicalFields, append: appendSurgery, remove: removeSurgery } = useFieldArray({
        control,
        name: "history.surgicalHistory"
    });

    const { fields: diagnosisFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({
        control,
        name: "diagnosis"
    });

    const { fields: prescriptionFields, append: appendPrescription, remove: removePrescription } = useFieldArray({
        control,
        name: `diagnosis.prescription`
    });

    const { fields: immunizationFields, append: appendImmunization, remove: removeImmunization } = useFieldArray({
        control,
        name: "immunization"
    });

    // Watch height and weight for BMI calculation
    const height = watch("generalPhysicalExamination.height");
    const weight = watch("generalPhysicalExamination.weight");

    // Auto-calculate BMI when height and weight change
    useEffect(() => {
        if (height && weight) {
            const heightInMeters = height / 100;
            const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
            setValue("generalPhysicalExamination.BMI", bmi);
        }
    }, [height, weight, setValue]);

    // Helper function to get nested value from object
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : null), obj);
    };

    // Helper component to show previous values
    const PreviousValues = ({ path, onClick, isArray = false, label = "Previous values" }) => {
        if (!allEMRs || allEMRs.length === 0) return null;

        // Collect all values for this path from all EMRs
        let values = allEMRs.map(emr => getNestedValue(emr, path)).filter(v => v !== null && v !== undefined);
        if (isArray) {
            // Flatten arrays and remove empty
            values = values.flat().filter(v => v !== null && v !== undefined && v !== '');
        }
        // Remove duplicates (for primitives)
        if (!isArray) {
            values = [...new Set(values)];
        } else {
            // For arrays of objects, deduplicate by JSON stringification
            values = values.filter((v, i, arr) =>
                typeof v === 'object' ?
                    arr.findIndex(x => JSON.stringify(x) === JSON.stringify(v)) === i :
                    arr.indexOf(v) === i
            );
        }
        if (!values || values.length === 0) return null;

        // Debug log
        // console.log('PreviousValues for', path, values);

        return (
            <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">{label}:</p>
                <div className="flex flex-wrap gap-3">
                    {values.map((value, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onClick(value)}
                            className="text-xs px-3 py-2 bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg shadow hover:shadow-md border border-gray-200 hover:bg-blue-100 transition-all mb-2 flex items-center min-w-[80px]"
                        >
                            {isArray && typeof value === 'object' ? (
                                <>
                                    {Object.entries(value).map(([key, val]) => (
                                        <span key={key} className="mr-1">
                                            <span className="font-medium">{key}:</span> {val || 'N/A'}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                value
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Add PreviousSectionCard for object-type sections
    const PreviousSectionCard = ({ path, onFill, label }) => {
        if (!allEMRs || allEMRs.length === 0) return null;
        // Helper to get nested value from object
        const getNestedValue = (obj, path) => {
            return path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : null), obj);
        };
        // Gather all objects from all EMRs
        let allItems = allEMRs.map(emr => getNestedValue(emr, path)).filter(Boolean);
        // Remove cards where all fields are empty/null/undefined (excluding _id, __v)
        allItems = allItems.filter(item => {
            const entries = Object.entries(item).filter(([k]) => k !== '_id' && k !== '__v');
            return entries.some(([, v]) => {
                if (Array.isArray(v)) return v.length > 0;
                if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
                return v !== null && v !== undefined && v !== '';
            });
        });
        if (!allItems.length) return null;
        // Helper to render values nicely
        const renderValue = (v) => {
            if (Array.isArray(v)) {
                return v.length === 0 ? 'None' : v.map((item, idx) => <span key={idx} className="inline-block bg-gray-200 rounded px-2 py-0.5 mr-1 mb-1 text-xs">{typeof item === 'object' ? renderValue(item) : String(item)}</span>);
            } else if (typeof v === 'object' && v !== null) {
                return (
                    <div className="ml-2 border-l-2 border-gray-200 pl-2 mt-1">
                        {Object.entries(v).filter(([k]) => k !== '_id' && k !== '__v').map(([k, val]) => (
                            <div key={k} className="text-xs mb-1"><span className="font-medium">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span> {renderValue(val)}</div>
                        ))}
                    </div>
                );
            } else if (typeof v === 'boolean') {
                return v ? 'Yes' : 'No';
            } else if (v === null || v === undefined || v === '') {
                return 'N/A';
            } else {
                return String(v);
            }
        };
        return (
            <div className="mt-4">
                <p className="text-base font-semibold mb-2 text-blue-700">{label} (from previous EMRs):</p>
                <div className="w-full border-b border-gray-200 mb-4"></div>
                <div className="flex flex-wrap gap-6">
                    {allItems.map((item, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 via-white to-green-50 shadow-md hover:shadow-lg cursor-pointer transition-all hover:bg-blue-100 max-w-[500px] min-w-[320px] mb-4 relative group" onClick={() => onFill(item)}>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-blue-500">Click to fill</div>
                            {Object.entries(item)
                                .filter(([k, v]) => k !== '_id' && k !== '__v' && (
                                    (Array.isArray(v) && v.length > 0) ||
                                    (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0) ||
                                    (typeof v !== 'object' && v !== null && v !== undefined && v !== '')
                                ))
                                .map(([k, v]) => (
                                    <div key={k} className="text-sm mb-1"><span className="font-semibold text-gray-700">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span> {renderValue(v)}</div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 1. Add PreviousCards component
    const PreviousCards = ({ path, onAdd, label }) => {
        if (!allEMRs || allEMRs.length === 0) return null;
        // Helper to get nested value from object
        const getNestedValue = (obj, path) => {
            return path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : null), obj);
        };
        // Gather all array entries from all EMRs
        let allItems = allEMRs.map(emr => getNestedValue(emr, path)).filter(Boolean).flat();
        // Remove duplicates by JSON stringification
        allItems = allItems.filter((v, i, arr) =>
            typeof v === 'object' ?
                arr.findIndex(x => JSON.stringify(x) === JSON.stringify(v)) === i :
                arr.indexOf(v) === i
        );
        // Remove cards where all fields are empty/null/undefined (excluding _id, __v)
        allItems = allItems.filter(item => {
            const entries = Object.entries(item).filter(([k]) => k !== '_id' && k !== '__v');
            return entries.some(([, v]) => {
                if (Array.isArray(v)) return v.length > 0;
                if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
                return v !== null && v !== undefined && v !== '';
            });
        });
        if (!allItems.length) return null;

        // Helper to render values nicely
        const renderValue = (v) => {
            if (Array.isArray(v)) {
                return v.length === 0 ? 'None' : v.map((item, idx) => <span key={idx} className="inline-block bg-gray-200 rounded px-2 py-0.5 mr-1 mb-1 text-xs">{typeof item === 'object' ? renderValue(item) : String(item)}</span>);
            } else if (typeof v === 'object' && v !== null) {
                return (
                    <div className="ml-2 border-l-2 border-gray-200 pl-2 mt-1">
                        {Object.entries(v).filter(([k, v]) => k !== '_id' && k !== '__v' && (
                            (Array.isArray(v) && v.length > 0) ||
                            (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0) ||
                            (typeof v !== 'object' && v !== null && v !== undefined && v !== '')
                        ))
                        .map(([k, v]) => (
                            <div key={k} className="text-sm mb-1"><span className="font-semibold text-gray-700">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span> {renderValue(v)}</div>
                        ))}
                    </div>
                );
            } else if (typeof v === 'boolean') {
                return v ? 'Yes' : 'No';
            } else if (v === null || v === undefined || v === '') {
                return 'N/A';
            } else {
                return String(v);
            }
        };

        return (
            <div className="mt-4">
                <p className="text-base font-semibold mb-2 text-blue-700">{label} (from previous EMRs):</p>
                <div className="w-full border-b border-gray-200 mb-4"></div>
                <div className="flex flex-wrap gap-6">
                    {allItems.map((item, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 via-white to-green-50 shadow-md hover:shadow-lg cursor-pointer transition-all hover:bg-blue-100 max-w-[500px] min-w-[320px] mb-4 relative group" onClick={() => onAdd(item)}>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-blue-500">Click to add</div>
                            {Object.entries(item)
                                .filter(([k, v]) => k !== '_id' && k !== '__v' && (
                                    (Array.isArray(v) && v.length > 0) ||
                                    (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0) ||
                                    (typeof v !== 'object' && v !== null && v !== undefined && v !== '')
                                ))
                                .map(([k, v]) => (
                                    <div key={k} className="text-sm mb-1"><span className="font-semibold text-gray-700">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</span> {renderValue(v)}</div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const onSubmit = async (data) => {
        try {
            const token = localStorage.getItem('authtoken');
            // Prepare FormData for multipart/form-data
            const formData = new FormData();
            
            // Debug: Log the current user and doctorId
            console.log('Current user:', user);
            console.log('DoctorId being sent:', doctorId);
            
            // Prepare EMR payload
            const emrPayload = {
              ...data,
              user: userId,
              doctor: doctorId,
              consultationMode: data.consultationMode || 'on site'
            };
            
            // Debug: Log the full payload
            console.log('EMR Payload:', emrPayload);
            
            Object.entries(emrPayload).forEach(([key, value]) => {
              // Stringify objects/arrays
              if (typeof value === 'object') {
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

            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/emr/create`, formData, {
              headers: {
                'Authorization': `Bearer ${token}`
                // Do not set Content-Type, browser will set it
              }
            });
            if (response.status >= 200 && response.status < 300) {
                // console.log('EMR created successfully:', response.data);
            } else {
                throw new Error(`Request failed with status ${response.status}`);
            }
        } catch (error) {
            console.error('Error submitting EMR:', error);
        }
    };

    const bloodGroups = ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known"];
    const medicationOptions = ["Yes", "No", "Diet controlled"];
    const immunizationTypes = ["up to date", "adding", "recommended"];
    const consultationModes = ["on site", "online", "home"];

    // Image upload handlers
    const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      setSelectedImages(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
      setImageRemarks(Array(files.length).fill(''));
    };

    const handleRemarkChange = (idx, value) => {
      setImageRemarks(prev => {
        const updated = [...prev];
        updated[idx] = value;
        return updated;
      });
    };

    // Prefill basic info from patient/user data
    useEffect(() => {
        const prefillBasicInfo = async () => {
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
                    // Only prefill if fields are empty
                    if (!watch('basicInfo.name')) setValue('basicInfo.name', user.name || '');
                    if (!watch('basicInfo.gender')) {
                        // Map gender to M/F if needed
                        let gender = user.gender;
                        if (gender === 'Male') gender = 'M';
                        else if (gender === 'Female') gender = 'F';
                        setValue('basicInfo.gender', gender || '');
                    }
                    if (!watch('basicInfo.phoneNumber')) setValue('basicInfo.phoneNumber', user.phone || '');
                    if (!watch('basicInfo.bloodGroup')) setValue('basicInfo.bloodGroup', user.bloodGroup || '');
                    // Calculate age from DOB if present
                    if (!watch('basicInfo.age') && patient.DOB) {
                        let dob = patient.DOB;
                        if (typeof dob === 'string') {
                            try { dob = parseISO(dob); } catch { dob = new Date(dob); }
                        }
                        const age = differenceInYears(new Date(), dob);
                        setValue('basicInfo.age', age);
                    }
                }
            } catch (error) {
                console.error('Error fetching patient/user info:', error);
            }
        };
        prefillBasicInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-6">
                        <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-white" />
                            <h1 className="text-3xl font-bold text-white">Electronic Medical Record</h1>
                        </div>
                        <p className="text-blue-100 mt-2">Comprehensive patient information management system</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
                        {/* Basic Information */}
                        <section className="bg-blue-50 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <User className="h-6 w-6 text-blue-600" />
                                <h2 className="text-2xl font-semibold text-gray-800">Basic Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name *</label>
                                    <input
                                        {...register("basicInfo.name", { required: "Patient name is required" })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter patient name"
                                    />
                                    <PreviousValues
                                        path="basicInfo.name"
                                        onClick={(value) => setValue("basicInfo.name", value)}
                                    />
                                    {errors.basicInfo?.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.basicInfo.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                                    <input
                                        type="number"
                                        {...register("basicInfo.age")}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Age"
                                    />
                                    <PreviousValues
                                        path="basicInfo.age"
                                        onClick={(value) => setValue("basicInfo.age", value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                                    <select
                                        {...register("basicInfo.gender", { required: "Gender is required" })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                    <PreviousValues
                                        path="basicInfo.gender"
                                        onClick={(value) => setValue("basicInfo.gender", value)}
                                    />
                                    {errors.basicInfo?.gender && (
                                        <p className="mt-1 text-sm text-red-600">{errors.basicInfo.gender.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            {...register("basicInfo.phoneNumber", { required: "Phone number is required" })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Phone number"
                                        />
                                    </div>
                                    <PreviousValues
                                        path="basicInfo.phoneNumber"
                                        onClick={(value) => setValue("basicInfo.phoneNumber", value)}
                                    />
                                    {errors.basicInfo?.phoneNumber && (
                                        <p className="mt-1 text-sm text-red-600">{errors.basicInfo.phoneNumber.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                                    <select
                                        {...register("basicInfo.bloodGroup")}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Blood Group</option>
                                        {bloodGroups.map(group => (
                                            <option key={group} value={group}>{group}</option>
                                        ))}
                                    </select>
                                    <PreviousValues
                                        path="basicInfo.bloodGroup"
                                        onClick={(value) => setValue("basicInfo.bloodGroup", value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Children</label>
                                    <input
                                        type="number"
                                        {...register("basicInfo.children")}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Number of children"
                                    />
                                    <PreviousValues
                                        path="basicInfo.children"
                                        onClick={(value) => setValue("basicInfo.children", value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="maritalStatus"
                                        {...register("basicInfo.maritalStatus")}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="maritalStatus" className="text-sm font-medium text-gray-700">Married</label>
                                </div>
                            </div>

                            {/* Address */}
                            {/* <div className="mt-8">
                                <div className="flex items-center space-x-3 mb-4">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            {...register("basicInfo.address.name")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Address Name"
                                        />
                                        <PreviousValues
                                            path="basicInfo.address.name"
                                            onClick={(value) => setValue("basicInfo.address.name", value)}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            {...register("basicInfo.address.street")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Street Address"
                                        />
                                        <PreviousValues
                                            path="basicInfo.address.street"
                                            onClick={(value) => setValue("basicInfo.address.street", value)}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            {...register("basicInfo.address.city")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="City"
                                        />
                                        <PreviousValues
                                            path="basicInfo.address.city"
                                            onClick={(value) => setValue("basicInfo.address.city", value)}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            {...register("basicInfo.address.state")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="State"
                                        />
                                        <PreviousValues
                                            path="basicInfo.address.state"
                                            onClick={(value) => setValue("basicInfo.address.state", value)}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            {...register("basicInfo.address.zipCode")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="ZIP Code"
                                        />
                                        <PreviousValues
                                            path="basicInfo.address.zipCode"
                                            onClick={(value) => setValue("basicInfo.address.zipCode", value)}
                                        />
                                    </div>
                                </div>
                            </div> */}
                        </section>

                        {/* Medical History */}
                        <section className="bg-green-50 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <FileText className="h-6 w-6 text-green-600" />
                                <h2 className="text-2xl font-semibold text-gray-800">Medical History</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
                                    <textarea
                                        {...register("history.chiefComplaint")}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="Describe the main complaint"
                                    />
                                    <PreviousValues
                                        path="history.chiefComplaint"
                                        onClick={(value) => setValue("history.chiefComplaint", value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">History of Presenting Illness</label>
                                    <textarea
                                        {...register("history.historyOfPresentingIllness")}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="Detailed history of the current illness"
                                    />
                                    <PreviousValues
                                        path="history.historyOfPresentingIllness"
                                        onClick={(value) => setValue("history.historyOfPresentingIllness", value)}
                                    />
                                </div>

                                {/* Surgical History */}
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <Scissors className="h-5 w-5 text-green-600 mr-2" />
                                            Surgical History
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => appendSurgery({
                                                surgeryName: '',
                                                indication: '',
                                                year: '',
                                                procedureType: '',
                                                recoveryTime: '',
                                                complications: '',
                                                onMedication: 'No',
                                                medications: [],
                                                bloodTransfusion: {
                                                    required: false,
                                                    units: '',
                                                    details: '',
                                                    patientBloodGroup: '',
                                                    transfusedBloodGroup: ''
                                                },
                                                surgeon: {
                                                    name: '',
                                                    specialization: '',
                                                    contact: ''
                                                },
                                                hospital: {
                                                    name: '',
                                                    location: ''
                                                },
                                                insurance: {
                                                    covered: false,
                                                    providerName: '',
                                                    claimFiled: false,
                                                    claimAmount: '',
                                                    policyNumber: ''
                                                },
                                                notes: '',
                                                isActive: true
                                            })}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Add Surgery</span>
                                        </button>
                                    </div>

                                    {surgicalFields.map((field, index) => (
                                        <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium text-gray-700">Surgery {index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSurgery(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Basic Surgery Information */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Surgery Name</label>
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.surgeryName`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Name of surgery"
                                                    />
                                                    <PreviousValues
                                                        path={`history.surgicalHistory[${index}].surgeryName`}
                                                        onClick={(value) => setValue(`history.surgicalHistory.${index}.surgeryName`, value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Indication</label>
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.indication`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Reason for surgery"
                                                    />
                                                    <PreviousValues
                                                        path={`history.surgicalHistory[${index}].indication`}
                                                        onClick={(value) => setValue(`history.surgicalHistory.${index}.indication`, value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                                    <input
                                                        type="number"
                                                        {...register(`history.surgicalHistory.${index}.year`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Year of surgery"
                                                    />
                                                    <PreviousValues
                                                        path={`history.surgicalHistory[${index}].year`}
                                                        onClick={(value) => setValue(`history.surgicalHistory.${index}.year`, value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Type</label>
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.procedureType`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Type of procedure"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Time</label>
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.recoveryTime`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Recovery duration"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">On Medication</label>
                                                    <select
                                                        {...register(`history.surgicalHistory.${index}.onMedication`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    >
                                                        {medicationOptions.map(option => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Surgeon Information */}
                                            <div className="bg-white rounded-lg p-3 mb-4">
                                                <h5 className="font-medium text-gray-700 mb-3">Surgeon Information</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.surgeon.name`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        placeholder="Surgeon name"
                                                    />
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.surgeon.specialization`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        placeholder="Specialization"
                                                    />
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.surgeon.contact`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        placeholder="Contact information"
                                                    />
                                                </div>
                                            </div>

                                            {/* Hospital Information */}
                                            <div className="bg-white rounded-lg p-3 mb-4">
                                                <h5 className="font-medium text-gray-700 mb-3">Hospital Information</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.hospital.name`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        placeholder="Hospital name"
                                                    />
                                                    <input
                                                        {...register(`history.surgicalHistory.${index}.hospital.location`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        placeholder="Hospital location"
                                                    />
                                                </div>
                                            </div>

                                            {/* Blood Transfusion */}
                                            <div className="bg-white rounded-lg p-3 mb-4">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <Controller
                                                        name={`history.surgicalHistory.${index}.bloodTransfusion.required`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                type="checkbox"
                                                                id={`bloodTransfusion-${index}`}
                                                                checked={field.value}
                                                                onChange={(e) => field.onChange(e.target.checked)}
                                                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                            />
                                                        )}
                                                    />
                                                    <label htmlFor={`bloodTransfusion-${index}`} className="font-medium text-gray-700">Blood Transfusion Required</label>
                                                </div>
                                                {watch(`history.surgicalHistory.${index}.bloodTransfusion.required`) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                        <input
                                                            type="number"
                                                            {...register(`history.surgicalHistory.${index}.bloodTransfusion.units`)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                            placeholder="Units"
                                                        />
                                                        <select
                                                            {...register(`history.surgicalHistory.${index}.bloodTransfusion.patientBloodGroup`)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        >
                                                            <option value="">Patient Blood Group</option>
                                                            {bloodGroups.map(group => (
                                                                <option key={group} value={group}>{group}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            {...register(`history.surgicalHistory.${index}.bloodTransfusion.transfusedBloodGroup`)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        >
                                                            <option value="">Transfused Blood Group</option>
                                                            {bloodGroups.map(group => (
                                                                <option key={group} value={group}>{group}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            {...register(`history.surgicalHistory.${index}.bloodTransfusion.details`)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                            placeholder="Transfusion details"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Insurance Information */}
                                            <div className="bg-white rounded-lg p-3 mb-4">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <Controller
                                                        name={`history.surgicalHistory.${index}.insurance.covered`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                type="checkbox"
                                                                id={`insurance-${index}`}
                                                                checked={field.value}
                                                                onChange={(e) => field.onChange(e.target.checked)}
                                                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                            />
                                                        )}
                                                    />
                                                    <label htmlFor={`insurance-${index}`} className="font-medium text-gray-700">Insurance Covered</label>
                                                </div>
                                                {watch(`history.surgicalHistory.${index}.insurance.covered`) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        <input
                                                            type="text"
                                                            {...register(`history.surgicalHistory.${index}.insurance.providerName`)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                            placeholder="Provider name"
                                                        />
                                                        <input
                                                            type="text"
                                                            {...register(`history.surgicalHistory.${index}.insurance.policyNumber`)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                            placeholder="Policy number"
                                                        />
                                                        <input
                                                            type="text"
                                                            {...register(`history.surgicalHistory.${index}.insurance.claimAmount`)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                            placeholder="Claim amount"
                                                        />
                                                        <div className="flex items-center space-x-3">
                                                            <Controller
                                                                name={`history.surgicalHistory.${index}.insurance.claimFiled`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`claimFiled-${index}`}
                                                                        checked={field.value}
                                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                                    />
                                                                )}
                                                            />
                                                            <label htmlFor={`claimFiled-${index}`} className="text-sm text-gray-700">Claim Filed</label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Complications and Notes */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Complications</label>
                                                    <textarea
                                                        {...register(`history.surgicalHistory.${index}.complications`)}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        placeholder="Any complications"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                                    <textarea
                                                        {...register(`history.surgicalHistory.${index}.notes`)}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                        placeholder="Additional notes"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Habits */}
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <Cigarette className="h-5 w-5 text-green-600 mr-2" />
                                        Habits & Lifestyle
                                    </h3>
                                    <PreviousSectionCard path="history.habits" label="Previous Habits & Lifestyle" onFill={item => {
                                        Object.entries(item).forEach(([k, v]) => setValue(`history.habits.${k}`, v));
                                    }} />
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sleep (hours)</label>
                                            <input
                                                type="number"
                                                {...register("history.sleep")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Hours of sleep"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Appetite</label>
                                            <input
                                                type="text"
                                                {...register("history.appetite")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Appetite status"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bowel & Bladder</label>
                                            <input
                                                type="text"
                                                {...register("history.bowelAndBladder")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Bowel & bladder habits"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Family History */}
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <Users className="h-5 w-5 text-green-600 mr-2" />
                                        Family History
                                    </h3>
                                    <PreviousSectionCard path="history.familyHistory" label="Previous Family History" onFill={item => {
                                        Object.entries(item).forEach(([k, v]) => setValue(`history.familyHistory.${k}`, v));
                                    }} />

                                    {/* Father's History */}
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-700 mb-3">Father</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <Controller
                                                    name="history.familyHistory.father.isAlive"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            type="checkbox"
                                                            id="fatherAlive"
                                                            checked={field.value}
                                                            onChange={(e) => field.onChange(e.target.checked)}
                                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                        />
                                                    )}
                                                />
                                                <label htmlFor="fatherAlive" className="text-sm font-medium text-gray-700">Is Alive</label>
                                            </div>
                                            <input
                                                type="text"
                                                {...register("history.familyHistory.father.condition")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Medical condition"
                                            />
                                            {!watch("history.familyHistory.father.isAlive") && (
                                                <>
                                                    <input
                                                        type="text"
                                                        {...register("history.familyHistory.father.reasonOfDeath")}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Reason of death"
                                                    />
                                                    <input
                                                        type="number"
                                                        {...register("history.familyHistory.father.yearOfDeath")}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Year of death"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mother's History */}
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-700 mb-3">Mother</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <Controller
                                                    name="history.familyHistory.mother.isAlive"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            type="checkbox"
                                                            id="motherAlive"
                                                            checked={field.value}
                                                            onChange={(e) => field.onChange(e.target.checked)}
                                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                        />
                                                    )}
                                                />
                                                <label htmlFor="motherAlive" className="text-sm font-medium text-gray-700">Is Alive</label>
                                            </div>
                                            <input
                                                type="text"
                                                {...register("history.familyHistory.mother.condition")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                placeholder="Medical condition"
                                            />
                                            {!watch("history.familyHistory.mother.isAlive") && (
                                                <>
                                                    <input
                                                        type="text"
                                                        {...register("history.familyHistory.mother.reasonOfDeath")}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Reason of death"
                                                    />
                                                    <input
                                                        type="number"
                                                        {...register("history.familyHistory.mother.yearOfDeath")}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="Year of death"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Family Conditions */}
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-3">Family Medical Conditions</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {Object.keys(watch("history.familyHistory.familyConditions") || {}).map((condition) => {
                                                if (condition === 'notes') return null;
                                                return (
                                                    <div key={condition} className="flex items-center space-x-2">
                                                        <Controller
                                                            name={`history.familyHistory.familyConditions.${condition}`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input
                                                                    type="checkbox"
                                                                    id={condition}
                                                                    checked={field.value}
                                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                                />
                                                            )}
                                                        />
                                                        <label htmlFor={condition} className="text-sm text-gray-700 capitalize">
                                                            {condition.replace(/([A-Z])/g, ' $1').trim()}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <textarea
                                            {...register("history.familyHistory.familyConditions.notes")}
                                            rows={2}
                                            className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Additional family history notes"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Physical Examination */}
                        <section className="bg-red-50 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Stethoscope className="h-6 w-6 text-red-600" />
                                <h2 className="text-2xl font-semibold text-gray-800">Physical Examination</h2>
                            </div>
                            <PreviousSectionCard path="generalPhysicalExamination" label="Previous Physical Examinations" onFill={item => {
                                Object.entries(item).forEach(([k, v]) => setValue(`generalPhysicalExamination.${k}`, v));
                            }} />
                            {/* Vital Signs */}
                            <div className="bg-white rounded-lg p-4 border border-red-200 mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <Activity className="h-5 w-5 text-red-600 mr-2" />
                                    Vital Signs
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pulse Rate (PR)</label>
                                        <input
                                            type="number"
                                            {...register("generalPhysicalExamination.PR")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="bpm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="number"
                                                {...register("generalPhysicalExamination.BP.sys")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                placeholder="Systolic"
                                            />
                                            <span className="self-center text-gray-500">/</span>
                                            <input
                                                type="number"
                                                {...register("generalPhysicalExamination.BP.dia")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                placeholder="Diastolic"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate (RR)</label>
                                        <input
                                            type="number"
                                            {...register("generalPhysicalExamination.RR")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="breaths/min"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SPO2 (%)</label>
                                        <input
                                            type="number"
                                            {...register("generalPhysicalExamination.SPO2")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Oxygen saturation"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                {...register("generalPhysicalExamination.temperatureVal")}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                placeholder="°F/°C"
                                            />
                                            <select
                                                {...register("generalPhysicalExamination.temperature")}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            >
                                                <option value="">Unit</option>
                                                <option value="F">°F</option>
                                                <option value="C">°C</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            {...register("generalPhysicalExamination.height")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Height in cm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            {...register("generalPhysicalExamination.weight")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Weight in kg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                                        <input
                                            type="number"
                                            {...register("generalPhysicalExamination.BMI")}
                                            readOnly
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                            placeholder="Auto-calculated"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* General Examination */}
                            <div className="bg-white rounded-lg p-4 border border-red-200 mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">General Examination</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {['pallor', 'icterus', 'cyanosis', 'clubbing', 'lymphadenopathy', 'edema', 'JVP'].map(field => (
                                        <div key={field}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                                            <input
                                                type="text"
                                                {...register(`generalPhysicalExamination.${field}`)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                placeholder={`${field} findings`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Systemic Examination */}
                            <div className="bg-white rounded-lg p-4 border border-red-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <Lungs className="h-5 w-5 text-red-600 mr-2" />
                                    Systemic Examination
                                </h3>
                                {/* Add PreviousSectionCard for Systemic Examination */}
                                <PreviousSectionCard 
                                    path="systemicExamination" 
                                    label="Previous Systemic Examinations" 
                                    onFill={item => {
                                        Object.entries(item).forEach(([k, v]) => setValue(`systemicExamination.${k}`, v));
                                    }}
                                />
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory System</label>
                                        <textarea
                                            {...register("systemicExamination.respiratorySystem")}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Respiratory system findings"
                                        />
                                        <PreviousValues
                                            path="systemicExamination.respiratorySystem"
                                            onClick={value => setValue("systemicExamination.respiratorySystem", value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cardiovascular System (CVS)</label>
                                        <textarea
                                            {...register("systemicExamination.CVS")}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="CVS findings"
                                        />
                                        <PreviousValues
                                            path="systemicExamination.CVS"
                                            onClick={value => setValue("systemicExamination.CVS", value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Central Nervous System (CNS)</label>
                                        <textarea
                                            {...register("systemicExamination.CNS")}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="CNS findings"
                                        />
                                        <PreviousValues
                                            path="systemicExamination.CNS"
                                            onClick={value => setValue("systemicExamination.CNS", value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Per Abdomen (PA)</label>
                                        <textarea
                                            {...register("systemicExamination.PA")}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Abdominal examination findings"
                                        />
                                        <PreviousValues
                                            path="systemicExamination.PA"
                                            onClick={value => setValue("systemicExamination.PA", value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Systemic Findings</label>
                                        <textarea
                                            {...register("systemicExamination.otherSystemicFindings")}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Other findings"
                                        />
                                        <PreviousValues
                                            path="systemicExamination.otherSystemicFindings"
                                            onClick={value => setValue("systemicExamination.otherSystemicFindings", value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Diagnosis & Treatment */}
                        <section className="bg-purple-50 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Pill className="h-6 w-6 text-purple-600" />
                                <h2 className="text-2xl font-semibold text-gray-800">Diagnosis & Treatment</h2>
                            </div>

                            {/* Diagnosis */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Diagnosis</h3>
                                    <button
                                        type="button"
                                        onClick={() => appendDiagnosis({
                                            dateOfDiagnosis: '',
                                            diagnosisName: '',
                                            prescription: []
                                        })}
                                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Add Diagnosis</span>
                                    </button>
                                </div>

                                {/* Previous diagnosis cards */}
                                <PreviousCards path="diagnosis" onAdd={item => appendDiagnosis(item)} label="Previous Diagnoses" />

                                {diagnosisFields.map((field, index) => {
                                    // Nested field array for prescriptions

                                    return (
                                        <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-medium text-gray-700">Diagnosis {index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDiagnosis(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Diagnosis</label>
                                                    <input
                                                        type="date"
                                                        {...register(`diagnosis.${index}.dateOfDiagnosis`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Name</label>
                                                    <input
                                                        type="text"
                                                        {...register(`diagnosis.${index}.diagnosisName`)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        placeholder="Diagnosis name"
                                                    />
                                                </div>
                                            </div>

                                            {/* Prescriptions for this diagnosis */}
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h5 className="font-medium text-gray-700">Prescriptions</h5>
                                                    <button
                                                        type="button"
                                                        onClick={() => appendPrescription({
                                                            investigations: '',
                                                            drugName: '',
                                                            frequency: '',
                                                            duration: '',
                                                            quantity: '',
                                                            advice: '',
                                                            routeOfAdministration: '',
                                                            howToTake: ''
                                                        })}
                                                        className="text-purple-600 hover:text-purple-800 text-sm"
                                                    >
                                                        <Plus className="h-4 w-4 inline mr-1" />
                                                        Add Prescription
                                                    </button>
                                                </div>

                                                {prescriptionFields.map((prescription, prescIndex) => (
                                                    <div key={prescription.id} className="bg-white rounded p-3 mb-3 border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium text-gray-600">Prescription {prescIndex + 1}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removePrescription(prescIndex)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                {...register(`diagnosis.${index}.prescription.${prescIndex}.drugName`)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                                placeholder="Drug name"
                                                            />
                                                            <input
                                                                type="text"
                                                                {...register(`diagnosis.${index}.prescription.${prescIndex}.frequency`)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                                placeholder="Frequency"
                                                            />
                                                            <input
                                                                type="text"
                                                                {...register(`diagnosis.${index}.prescription.${prescIndex}.duration`)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                                placeholder="Duration"
                                                            />
                                                            <input
                                                                type="text"
                                                                {...register(`diagnosis.${index}.prescription.${prescIndex}.quantity`)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                                placeholder="Quantity"
                                                            />
                                                            <input
                                                                type="text"
                                                                {...register(`diagnosis.${index}.prescription.${prescIndex}.routeOfAdministration`)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                                placeholder="Route of administration"
                                                            />
                                                            <input
                                                                type="text"
                                                                {...register(`diagnosis.${index}.prescription.${prescIndex}.howToTake`)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                                placeholder="How to take"
                                                            />
                                                        </div>
                                                        <textarea
                                                            {...register(`diagnosis.${index}.prescription.${prescIndex}.advice`)}
                                                            rows={2}
                                                            className="w-full mt-3 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                                            placeholder="Advice"
                                                        />
                                                        <PreviousValues
                                                            path={`diagnosis.${index}.prescription[${prescIndex}].drugName`}
                                                            onClick={(value) => setValue(`diagnosis.${index}.prescription.${prescIndex}.drugName`, value)}
                                                            label="Previous drug names"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Immunization */}
                        <section className="bg-yellow-50 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <Syringe className="h-6 w-6 text-yellow-600" />
                                <h2 className="text-2xl font-semibold text-gray-800">Immunization</h2>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Vaccination Records</h3>
                                    <button
                                        type="button"
                                        onClick={() => appendImmunization({
                                            immunizationType: '',
                                            vaccinationName: '',
                                            totalDose: 1,
                                            doseDates: [],
                                            doctorName: '',
                                            sideEffects: '',
                                            immunizationNotes: ''
                                        })}
                                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Add Vaccination</span>
                                    </button>
                                </div>

                                {/* Previous immunization cards */}
                                <PreviousCards path="immunization" onAdd={item => appendImmunization(item)} label="Previous Immunizations" />

                                {immunizationFields.map((field, index) => (
                                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-medium text-gray-700">Vaccination {index + 1}</h4>
                                            <button
                                                type="button"
                                                onClick={() => removeImmunization(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Vaccination Name</label>
                                                <input
                                                    type="text"
                                                    {...register(`immunization.${index}.vaccinationName`)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                    placeholder="Vaccine name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                                <select
                                                    {...register(`immunization.${index}.immunizationType`)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                >
                                                    <option value="">Select Type</option>
                                                    {immunizationTypes.map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Doses</label>
                                                <input
                                                    type="number"
                                                    {...register(`immunization.${index}.totalDose`)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                    placeholder="Number of doses"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                                                <input
                                                    type="text"
                                                    {...register(`immunization.${index}.doctorName`)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                    placeholder="Administering doctor"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
                                                <input
                                                    type="text"
                                                    {...register(`immunization.${index}.sideEffects`)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                    placeholder="Any side effects observed"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                            <textarea
                                                {...register(`immunization.${index}.immunizationNotes`)}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                placeholder="Additional notes"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Final Notes & Consultation */}
                        <section className="bg-gray-50 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <FileText className="h-6 w-6 text-gray-600" />
                                <h2 className="text-2xl font-semibold text-gray-800">Final Notes & Consultation</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Mode</label>
                                        <select
                                            {...register("consultationMode", { required: false })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                        >
                                            <option value="">Select Mode</option>
                                            {consultationModes.map(mode => (
                                                <option key={mode} value={mode}>{mode}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Schedule</label>
                                        <input
                                            type="text"
                                            {...register("followUpSchedule")}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                            placeholder="Next appointment schedule"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">General Advice</label>
                                    <textarea
                                        {...register("advice")}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                        placeholder="General advice for the patient"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Referrals</label>
                                    <textarea
                                        {...register("referrals")}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                        placeholder="Specialist referrals or additional consultations"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor's Notes</label>
                                    <textarea
                                        {...register("doctorNotes")}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                        placeholder="Additional notes and observations"
                                    />
                                </div>
                            </div>
                        </section>

                         {/* Image Upload */}
                         <section className="bg-blue-50 rounded-xl p-6">
                          <div className="flex items-center space-x-3 mb-6">
                            <FileText className="h-6 w-6 text-blue-600" />
                            <h2 className="text-2xl font-semibold text-gray-800">Upload Images</h2>
                          </div>
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
                        </section>

                        {/* Submit Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Complete EMR Record</h3>
                                    <p className="text-blue-100">Review all information before submitting the electronic medical record.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center space-x-3 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            <span>Save EMR Record</span>
                                        </>
                                    )}
                                </button>
                            </div>
                                    
                            {isSubmitSuccessful && (
                                <div className="mt-4 p-4 rounded-lg flex items-center space-x-3 bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircle className="h-5 w-5" />
                                    <span>EMR record saved successfully!</span>
                                </div>
                            )}
                        </div>

                       
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EMRForm;