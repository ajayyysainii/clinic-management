import React from 'react';
import { Mail, Phone, User, ClipboardPlus, Hospital, CirclePlus, BadgePlus, Heart, Thermometer, Activity, Droplets } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import {
    Weight,
    Sp02,
    Height,
    Temperature,
    RiskSummary,
    HeartRate,
    Glucose,
    Hba1c,
    HealthReport,
    HealthSummaryImg,
    GenerateMedicalReport,
    BloodGroup,
    GeneralReports,
    ElectronicMedicalRecords,
    BloodPressure,
    Eprescription,
} from '../../assets/profile_images';
import { Loading } from '../ui/Loading';
import { Link } from 'react-router-dom'
import HealthSummary from './HealthSummary';
import MedicalRecords from './MedicalRecords';
import RiskAssesment from './RiskAssesment';
import DoctorAvatar from '../ui/DoctorAvatar';
import HealthVitalsEditModal from './HealthVitalsEditModal';
import AddAppointment from '../appointment/AddAppointment';

// Section names for clarity
const SECTION = {
    NONE: null,
    HEALTH: 'health',
    RISK: 'risk',
    MEDICAL: 'medical',
};

// Health vitals configuration with ranges and units
const healthVitalsConfig = {
    heartRate: {
        unit: 'bpm',
        range: '60-100 BPM',
        color: '#924370',
        icon: HeartRate
    },
    spO2: {
        unit: '%',
        range: '95-100%',
        color: '#00AC9A',
        icon: Sp02
    },
    bloodPressure: {
        unit: 'mmHg',
        range: '120/80 mmHg',
        color: '#F85B57',
        icon: BloodPressure
    },
    bloodGlucose: {
        unit: 'mg/dl',
        range: '70-110mg/dl',
        color: '#004FB6',
        icon: Glucose
    },
    temperature: {
        unit: '°F',
        range: '97 - 99°F',
        color: '#F0AD4E',
        icon: Temperature
    },
    hba1c: {
        unit: '%',
        range: '<5.7%',
        color: '#8E5FA9',
        icon: Hba1c
    }
};

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const userRole = user?.data?.roles?.[0];

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openSection, setOpenSection] = useState(SECTION.NONE);
    const [, setAppointments] = useState([]);
    const [isHealthVitalsModalOpen, setIsHealthVitalsModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);
    const [isAppointmentLoading, setIsAppointmentLoading] = useState(false);
    const [showAccessDeniedPopup, setShowAccessDeniedPopup] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("authtoken");
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/patients/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log("patient data", response.data.data)
                setProfileData(response.data.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    useEffect(() => {
        if (!profileData) return;
        const fetchAppointments = async () => {
            try {
                const token = localStorage.getItem('authtoken');
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/appointments/visits/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("hello", response.data.data)
                setAppointments(response.data.data || []);
            } catch {
                setAppointments([]);
            }
        };
        fetchAppointments();
    }, [profileData, id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDetailsDropdown && !event.target.closest('.details-dropdown')) {
                setShowDetailsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDetailsDropdown]);

    if (loading) {
        return <Loading />;
    }

    if (!profileData) {
        return <div>Profile not found</div>;
    }

    const patient = Array.isArray(profileData) ? profileData[0] : profileData;

    // Helper function to check if user has doctor access
    const hasDocumentAccess = () => {
        return userRole === 'doctor' || userRole === 'hybrid';
    };

    // Handle medical report access
    const handleMedicalReportAccess = (path) => {
        if (hasDocumentAccess()) {
            navigate(path);
        } else {
            setShowAccessDeniedPopup(true);
        }
    };

    // Helper function to get health vital value or "unknown"
    const getHealthVitalValue = (vitalKey) => {
        const value = patient[vitalKey];
        return value !== undefined && value !== null ? value : 'unknown';
    };

    // Helper function to calculate progress bar width based on value
    const getProgressWidth = (vitalKey, value) => {
        if (value === 'unknown' || value === undefined || value === null) return 0;

        const config = healthVitalsConfig[vitalKey];
        if (!config) return 0;

        // Simple percentage calculation - can be enhanced with actual ranges
        switch (vitalKey) {
            case 'heartRate':
                return Math.min(Math.max((value - 60) / (100 - 60) * 100, 0), 100);
            case 'spO2':
                return Math.min(Math.max((value - 95) / (100 - 95) * 100, 0), 100);
            case 'bloodGlucose':
                return Math.min(Math.max((value - 70) / (110 - 70) * 100, 0), 100);
            case 'temperature':
                return Math.min(Math.max((value - 97) / (99 - 97) * 100, 0), 100);
            case 'hba1c':
                return Math.min(Math.max((value / 5.7) * 100, 0), 100);
            default:
                return 50; // Default for blood pressure and others
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch min-h-[500px]">
                    {/* Left Panel - Patient Details */}
                    <div className="w-full lg:w-1/3 h-full">
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Details</h2>
                                <div className="relative details-dropdown">
                                    <button
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                        onClick={() => setShowDetailsDropdown(!showDetailsDropdown)}
                                        title="More options"
                                        aria-label="More options"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDetailsDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                            <div className="py-1">
                                                {(userRole === 'doctor' || userRole === 'hybrid' || userRole === 'staff' || userRole === 'admin') ? (
                                                    <button
                                                        onClick={() => {
                                                            setIsAppointmentLoading(true);
                                                            setIsAppointmentModalOpen(true);
                                                            setShowDetailsDropdown(false);
                                                            // Reset loading after a short delay to allow modal to render
                                                            setTimeout(() => setIsAppointmentLoading(false), 100);
                                                        }}
                                                        disabled={isAppointmentLoading}
                                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isAppointmentLoading ? (
                                                            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                        )}
                                                        {isAppointmentLoading ? 'Opening...' : 'Create Appointment'}
                                                    </button>
                                                ) : (
                                                    <div className="px-4 py-2 text-sm text-gray-500">
                                                        No actions available
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profile Image */}
                            <div className="flex justify-center mb-6">
                                <img
                                    className="w-48 h-48 sm:w-80 sm:h-80 rounded-lg object-cover"
                                    src={patient?.userId?.profileImageUrl || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                                    alt="Profile"
                                />
                            </div>

                            {/* Patient Details */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <span className="text-sm text-gray-500">Name</span>
                                    <p className="font-medium text-gray-900 text-left">
                                        {(patient.relationship === "self") ?
                                            patient.userId?.name :
                                            patient.familyMemberName || 'Unknown'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <span className="text-sm text-gray-500">Date of birth</span>
                                    <p className="font-medium text-gray-900 text-left">
                                        {patient.DOB ? patient.DOB.split('T')[0] : '12-7-1993'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <span className="text-sm text-gray-500">Gender</span>
                                    <p className="font-medium text-gray-900 text-left">
                                        {patient.userId?.gender || 'Male'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-2 items-center">
                                    <span className="text-sm text-gray-500">Email</span>
                                    <p className="min-w-0 font-medium text-gray-900 text-left break-all">
                                        {patient.userId?.email || 'william@example.com'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <span className="text-sm text-gray-500">Phone</span>
                                    <p className="font-medium text-gray-900 text-left">
                                        {patient.userId?.phone || '+1234567890'}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right Panel - Health Vitals and Reports */}
                    <div className="w-full lg:w-2/3 h-full">
                        <div className="flex flex-col h-full space-y-4 sm:space-y-6">
                            {/* Health Vitals Header */}
                            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex-1">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">Health Vitals</h2>
                                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                            <p className="text-sm text-gray-500">Updated: 12:00am, 15 July</p>
                                            <button style={{ width: '80px' }}
                                                onClick={() => setIsHealthVitalsModalOpen(true)}
                                                className="inline-flex items-center justify-center space-x-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span>Edit</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Top Right Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center text-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded flex items-center justify-center">
                                                <img src={Height} alt="height" />
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Height</span>
                                                <p className="font-semibold">{patient.height ? `${patient.height} m` : 'unknown'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded flex items-center justify-center">
                                                <img src={Weight} alt="weight" />
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Weight</span>
                                                <p className="font-semibold">{patient.weight ? `${patient.weight} kg` : 'unknown'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded flex items-center justify-center">
                                                <img src={BloodGroup} alt="blood group" />
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Blood Group</span>
                                                <p className="font-semibold">{patient.userId?.bloodGroup || 'unknown'}</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Health Vitals Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Heart Rate */}
                                    <div className="p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <img src={healthVitalsConfig.heartRate.icon} alt="Heart Rate" className="w-5 h-5" />
                                                <span className="text-sm font-semibold">Heart Rate</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-[#0096fb]">
                                                    {getHealthVitalValue('heartRate')}
                                                </span>
                                                <span className="text-xs font-semibold"> {healthVitalsConfig.heartRate.unit}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${getProgressWidth('heartRate', patient.heartRate)}%`,
                                                    backgroundColor: healthVitalsConfig.heartRate.color
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Normal Range: {healthVitalsConfig.heartRate.range}</p>
                                    </div>

                                    {/* SpO2 */}
                                    <div className="rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <img src={healthVitalsConfig.spO2.icon} alt="SpO2" className="h-5" />
                                                <span className="text-sm font-semibold">SpO₂</span>
                                            </div>
                                            <div className='flex gap-1 items-center'>
                                                <span className="text-sm font-semibold text-[#0096fb]">
                                                    {getHealthVitalValue('spO2')}
                                                </span>
                                                <span className='text-xs font-semibold'>
                                                    {healthVitalsConfig.spO2.unit}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${getProgressWidth('spO2', patient.spO2)}%`,
                                                    backgroundColor: healthVitalsConfig.spO2.color
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Normal Range: {healthVitalsConfig.spO2.range}</p>
                                    </div>

                                    {/* Blood Pressure */}
                                    <div className="rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <img src={healthVitalsConfig.bloodPressure.icon} alt="Blood Pressure" className=" h-5" />
                                                <span className="text-sm font-semibold">Blood Pressure</span>
                                            </div>
                                            <div className='flex gap-1 justify-center items-center'>
                                                <span className="text-sm font-semibold text-[#0096fb]">
                                                    {getHealthVitalValue('bloodPressure')}
                                                </span>
                                                <span className="text-xs font-semibold">{healthVitalsConfig.bloodPressure.unit}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${getProgressWidth('bloodPressure', patient.bloodPressure)}%`,
                                                    backgroundColor: healthVitalsConfig.bloodPressure.color
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Normal Range: {healthVitalsConfig.bloodPressure.range}</p>
                                    </div>

                                    {/* Blood Glucose */}
                                    <div className=" rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <img src={healthVitalsConfig.bloodGlucose.icon} alt="Blood Glucose" className="h-5" />
                                                <span className="text-sm font-semibold">Blood Glucose</span>
                                            </div>
                                            <div className='flex gap-1 justify-center items-center'>
                                                <span className="text-sm font-bold text-[#0096fb]">
                                                    {getHealthVitalValue('bloodGlucose')}
                                                </span>
                                                <span className='text-xs font-semibold'>
                                                    {healthVitalsConfig.bloodGlucose.unit}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${getProgressWidth('bloodGlucose', patient.bloodGlucose)}%`,
                                                    backgroundColor: healthVitalsConfig.bloodGlucose.color
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Normal Range: {healthVitalsConfig.bloodGlucose.range}</p>
                                    </div>

                                    {/* Temperature */}
                                    <div className="rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <img src={healthVitalsConfig.temperature.icon} alt="Temperature" className="h-5" />
                                                <span className="text-sm font-semibold">Temperature</span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                <span className="text-sm font-semibold text-[#0096fb]">
                                                    {getHealthVitalValue('temperature')}
                                                </span>
                                                <span className='font-semibold text-xs'> {healthVitalsConfig.temperature.unit}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${getProgressWidth('temperature', patient.temperature)}%`,
                                                    backgroundColor: healthVitalsConfig.temperature.color
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Normal Range: {healthVitalsConfig.temperature.range}</p>
                                    </div>

                                    {/* HbA1c */}
                                    <div className="rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <img src={healthVitalsConfig.hba1c.icon} alt="HbA1c" className=" h-5" />
                                                <span className="text-sm font-semibold">HbA1c</span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                <span className="text-sm font-bold text-[#0096fb]">
                                                    {getHealthVitalValue('hba1c')}
                                                </span>
                                                <span className='font-semibold text-xs'>{healthVitalsConfig.hba1c.unit}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${getProgressWidth('hba1c', patient.hba1c)}%`,
                                                    backgroundColor: healthVitalsConfig.hba1c.color
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Normal Range: {healthVitalsConfig.hba1c.range}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Reports Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                <div
                                    className="bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleMedicalReportAccess(`/emr/${patient.userId?._id}`)}
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                                            <img src={GenerateMedicalReport} alt="generate medical report" />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1">Medical Reports</p>
                                        <p className="font-medium text-xs ">Generate Medical Reports</p>
                                    </div>
                                </div>

                                <div
                                    className="bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleMedicalReportAccess(`/emr/${patient.userId?._id}`)}
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                                            <img src={ElectronicMedicalRecords} alt="electronic medical records" />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1">EMR</p>
                                        <p className="font-medium text-xs ">Electronic Medical Records</p>
                                    </div>
                                </div>

                                <div
                                    className="bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleMedicalReportAccess('/general-reports')}
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                                            <img src={GeneralReports} alt="general reports" />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1">Medical Reports</p>
                                        <p className="font-medium text-xs">General Reports</p>
                                    </div>
                                </div>

                                <div
                                    className="bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleMedicalReportAccess(`/prescription/${patient.userId?._id}`)}
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                                            <img src={Eprescription} alt="e-prescription" />
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1">Medical Reports</p>
                                        <p className="font-medium text-xs">E- Prescription</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Additional Medical Report Sections - Only for Doctors */}

                {(userRole === 'doctor' || userRole === 'hybrid') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
                        <button
                            className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-left ${openSection === SECTION.HEALTH ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setOpenSection(openSection === SECTION.HEALTH ? SECTION.NONE : SECTION.HEALTH)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Medical Reports</p>
                                    <p className="font-medium text-blue-600 text-sm sm:text-base">Health Summary</p>
                                </div>
                            </div>
                        </button>

                        <button
                            className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-left ${openSection === SECTION.RISK ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setOpenSection(openSection === SECTION.RISK ? SECTION.NONE : SECTION.RISK)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Medical Reports</p>
                                    <p className="font-medium text-orange-600 text-sm sm:text-base">Risk Analysis</p>
                                </div>
                            </div>
                        </button>

                        <button
                            className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow text-left ${openSection === SECTION.MEDICAL ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setOpenSection(openSection === SECTION.MEDICAL ? SECTION.NONE : SECTION.MEDICAL)}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <ClipboardPlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Medical Reports</p>
                                    <p className="font-medium text-green-600 text-sm sm:text-base">Health Reports</p>
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Appointments Table */}
                {/* {appointments.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mt-6 sm:mt-10">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Appointments</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {appointments.slice(0, 3).map((appt, idx) => {
                                        const doctor = appt.doctorId;
                                        const doctorName = doctor?.name || 'Unknown Doctor';
                                        const dateObj = appt.appointmentTime ? new Date(appt.appointmentTime) : null;
                                        return (
                                            <tr key={appt._id || idx} className="hover:bg-gray-50">
                                                <td className="px-2 sm:px-4 py-3">
                                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                                        {doctor?.profileImageUrl ? (
                                                            <img src={doctor.profileImageUrl} alt={doctorName} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <DoctorAvatar name={doctorName} id={idx} />
                                                        )}
                                                        <span className="text-xs sm:text-sm font-medium text-nowrap text-gray-900">{sentenceCase(doctorName)}</span>
                                                    </div>

                                                </td>
                                                <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">{dateObj ? dateObj.toLocaleDateString() : 'N/A'}</td>
                                                <td className="px-2 text-nowrap sm:px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${appt.status === 'Completed' ? 'bg-green-100 text-green-800' : appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {appt.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 text-nowrap">{appt.consultationMode || 'N/A'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )} */}

                {/* Expanded Section */}
                {openSection && (
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        {openSection === SECTION.HEALTH && <HealthSummary userId={id} />}
                        {openSection === SECTION.RISK && <RiskAssesment userId={patient.userId?._id} />}
                        {openSection === SECTION.MEDICAL && <MedicalRecords userId={patient.userId?._id} />}
                    </div>
                )}

                {/* Health Vitals Edit Modal */}
                <HealthVitalsEditModal
                    isOpen={isHealthVitalsModalOpen}
                    onClose={() => setIsHealthVitalsModalOpen(false)}
                    patient={patient}
                    onSuccess={(updatedPatient) => {
                        setProfileData(updatedPatient);
                        setIsHealthVitalsModalOpen(false);
                    }}
                />

                {/* Add Appointment Modal */}
                {isAppointmentModalOpen && (
                    <div className="fixed inset-0 z-50">
                        <AddAppointment
                            patient={{
                                _id: patient._id, // This should be the clinicPatientId from the ClinicPatient model
                                userId: patient.userId,
                                relationship: patient.relationship,
                                familyMemberName: patient.familyMemberName,
                                DOB: patient.DOB,
                                height: patient.height,
                                weight: patient.weight,
                                heartRate: patient.heartRate,
                                spO2: patient.spO2,
                                bloodPressure: patient.bloodPressure,
                                bloodGlucose: patient.bloodGlucose,
                                temperature: patient.temperature,
                                hba1c: patient.hba1c
                            }}
                            onClose={() => {
                                console.log('Closing appointment modal');
                                setIsAppointmentModalOpen(false);
                            }}
                            onSuccess={() => {
                                console.log('Appointment created successfully');
                                setIsAppointmentModalOpen(false);
                                // Refresh appointments list
                                if (profileData) {
                                    const fetchAppointments = async () => {
                                        try {
                                            const token = localStorage.getItem('authtoken');
                                            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/appointments/visits/${id}`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            setAppointments(response.data.data || []);
                                        } catch {
                                            setAppointments([]);
                                        }
                                    };
                                    fetchAppointments();
                                }
                            }}
                        />
                    </div>
                )}

                {/* Access Denied Popup */}
                {showAccessDeniedPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                                Access Restricted
                            </h3>
                            <p className="text-gray-600 text-center mb-6">
                                Only Doctors have access to medical reports and prescriptions.
                            </p>
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setShowAccessDeniedPopup(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Profile;

