import React, { useState, useEffect } from 'react';
import {
    X, Mail, Phone, User, Calendar, Activity, FileText,
    HeartPulse, Ruler, Scale, Users, Home, Monitor,
    Stethoscope, ChevronDown, ClipboardList, Clock
} from 'lucide-react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';
import { Loading } from '../ui/Loading';
import { FormLoader } from '../ui/FormLoader';
import { useNavigate } from 'react-router-dom';


const PatientForm = ({ patient, isEditMode, onClose, onSuccess }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: patient?.name || '',
        phone: patient?.phone || '',
        email: patient?.email || '',
        DOB: patient?.DOB?.split('T')[0] || '',
        triage: patient?.triage || 'normal',
        notes: patient?.notes || '',
        bloodPressure: patient?.bloodPressure || '',
        weight: patient?.weight || '',
        height: patient?.height || '',
        relationship: patient?.relationship || 'self',
        familyMemberName: patient?.familyMemberName || '',
        consultationMode: patient?.consultationMode || 'onsite',
        status: patient?.status || 'Pending',
        diagnosis: patient?.diagnosis || '',
        gender: patient?.gender || '',
        bloodGroup: patient?.bloodGroup || '',
        // New health vitals fields
        heartRate: patient?.heartRate || '',
        temperature: patient?.temperature || '',
        hba1c: patient?.hba1c || '',
        bloodGlucose: patient?.bloodGlucose || '',
        spO2: patient?.spO2 || '',
    });

    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [popup, setPopup] = useState({ message: '', type: '' });
    const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [doctorAssignments, setDoctorAssignments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [existingProfileImage, setExistingProfileImage] = useState(patient?.profileImageUrl || patient?.userId?.profileImageUrl || '');

    const DOCTORS_PER_PAGE = 10;

    useEffect(() => {
        if (isEditMode && patient?.clinicId) {
            // Initialize doctor assignments from patient visits
            if (patient?.visits) {
                const assignments = patient.visits.map(visit => ({
                    doctorId: visit.doctorId._id,
                    doctorName: visit.doctorId.name,
                    specialization: visit.doctorId.specializations,
                    consultationMode: visit.consultationMode,
                    appointmentTime: visit.appointmentTime?.split('T')[0] || new Date().toISOString().slice(0, 16),
                    status: visit.status || 'Pending',
                    diagnosis: visit.diagnosis || ''
                }));
                setDoctorAssignments(assignments);
                setSelectedDoctors(patient.visits.map(visit => ({
                    user_id: visit.doctorId
                })));
            }
        }
        fetchDoctors(1, true);
    }, [isEditMode, patient, user]);

    // Auto-assign hybrid doctor when doctors are loaded
    useEffect(() => {
        if (user?.data?.roles[0] === 'hybrid' && doctors.length === 1 && !isEditMode) {
            const hybridDoctor = doctors[0];
            setSelectedDoctors([hybridDoctor]);
            setDoctorAssignments([{
                doctorId: hybridDoctor.user_id._id,
                profileImage: hybridDoctor.user_id.profileImageUrl,
                specializations: hybridDoctor.specializations,
                doctorName: hybridDoctor.user_id.name,
                consultationMode: formData.consultationMode,
                appointmentTime: new Date().toISOString().slice(0, 16),
                status: 'Pending',
                diagnosis: formData.diagnosis || ''
            }]);
        }
    }, [doctors, user?.data?.roles[0], isEditMode, formData.consultationMode, formData.diagnosis]);

    const fetchDoctors = async (page = 1, reset = false) => {
        try {
            setLoadingDoctors(true);
            const token = localStorage.getItem('authtoken');
            
            // If user has hybrid role, fetch only that specific doctor using getDoctorByUserId
            if (user?.data?.roles[0] === 'hybrid') {
                const response = await axios.get(`${BACKEND_URL}/doctors/list/${user.data._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.data.success && response.data.data) {
                    // Transform the single doctor data to match the expected format
                    const doctorData = {
                        user_id: response.data.data.user_id,
                        specializations: response.data.data.specializations || [],
                        ...response.data.data
                    };
                    setDoctors([doctorData]);
                    setHasMore(false);
                    setPage(1);
                } else {
                    setDoctors([]);
                    setHasMore(false);
                }
                return;
            }
            
            // For other roles, fetch all doctors as before
            const response = await axios.get(`${BACKEND_URL}/doctors/list?page=${page}&limit=${DOCTORS_PER_PAGE}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newDoctors = response.data.doctors || [];
            const pagination = response.data.pagination;

            if (reset) {
                setDoctors(newDoctors);
            } else {
                setDoctors(prev => [...prev, ...newDoctors]);
            }

            setHasMore(pagination?.hasNext || false);
            setPage(page);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            showPopup("Failed to load doctors list", 'error');
        } finally {
            setLoadingDoctors(false);
        }
    };

    const loadMoreDoctors = () => {
        if (!loadingDoctors && hasMore) {
            fetchDoctors(page + 1);
        }
    };

    const showPopup = (message, type = 'success') => {
        setPopup({ message, type });
        setTimeout(() => setPopup({ message: '', type: '' }), 3000);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        setProfileImage(file);
        if (file) {
            setProfilePreview(URL.createObjectURL(file));
        } else {
            setProfilePreview(null);
        }
    };

    const handleRemoveProfileImage = () => {
        setProfileImage(null);
        setProfilePreview(null);
        setExistingProfileImage('');
    };

    const handleDoctorSelect = (doctor) => {
        const isAlreadySelected = selectedDoctors.some(d => d.user_id._id === doctor.user_id._id);

        if (isAlreadySelected) {
            // Remove doctor if already selected
            setSelectedDoctors(prev => prev.filter(d => d.user_id._id !== doctor.user_id._id));
            setDoctorAssignments(prev => prev.filter(d => d.doctorId !== doctor.user_id._id));
        } else {
            // Add doctor if not selected
            setSelectedDoctors(prev => [...prev, doctor]);
            setDoctorAssignments(prev => [
                ...prev,
                {
                    doctorId: doctor.user_id._id,
                    profileImage: doctor.user_id.profileImageUrl,
                    specializations: doctor.specializations,
                    doctorName: doctor.user_id.name,
                    consultationMode: formData.consultationMode,
                    appointmentTime: new Date().toISOString().slice(0, 16),
                    status: 'Pending',
                    diagnosis: formData.diagnosis || ''
                }
            ]);

        }
    };

    const handleRemoveDoctor = (doctorId) => {
        setDoctorAssignments(prev => prev.filter(d => d.doctorId !== doctorId));
        setSelectedDoctors(prev => prev.filter(d => d.user_id._id !== doctorId));
    };

    const handleAssignmentChange = (doctorId, field, value) => {
        setDoctorAssignments(prev =>
            prev.map(assignment =>
                assignment.doctorId === doctorId
                    ? { ...assignment, [field]: value }
                    : assignment
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authtoken');
            const formDataToSend = new FormData();
            // Add all fields to FormData
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formDataToSend.append(key, value);
                }
            });
            // Add assignedDoctors as JSON
            formDataToSend.append('assignedDoctors', JSON.stringify(doctorAssignments.map(d => ({
                doctorId: d.doctorId,
                doctorName: d.doctorName,
                consultationMode: d.consultationMode,
                appointmentTime: d.appointmentTime,
                status: d.status,
                diagnosis: d.diagnosis
            }))));
            // Add profile image
            if (profileImage) {
                formDataToSend.append('profileImageUrl', profileImage);
            } else if (existingProfileImage && !existingProfileImage.startsWith('blob:')) {
                formDataToSend.append('existingProfileImage', existingProfileImage);
            }
            // Add clinicId if present
            if (patient?.clinicId) {
                formDataToSend.append('clinicId', patient.clinicId);
            }
            const endpoint = isEditMode
                ? `${BACKEND_URL}/patients/update/${patient._id}`
                : BACKEND_URL + '/patients/register';
            const method = isEditMode ? 'put' : 'post';
            const response = await axios({
                method,
                url: endpoint,
                data: formDataToSend,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            showPopup(isEditMode ? "Patient updated successfully!" : "Patient registered successfully!", 'success');
            if (onSuccess) onSuccess(response.data);
            
            // Redirect to patient list after successful submission

                navigate('/patient-list');
            
        } catch (error) {
            console.error('Error:', error);
            showPopup(
                error.response?.data?.error ||
                (isEditMode ? "Update failed. Please try again." : "Registration failed. Please try again."),
                'error'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    console.log(doctors)

    // Show full page loader when submitting
    if (isSubmitting) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="relative">
                    {popup.message && (
                        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300
                            ${popup.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {popup.message}
                        </div>
                    )}

                    {isEditMode && onClose && (
                        <button onClick={onClose} className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    )}

                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {isEditMode ? 'Update Patient Profile' : 'Patient Registration'}
                        </h1>
                        <p className="text-lg text-gray-600">
                            {isEditMode ? 'Update patient information' : 'Complete patient registration form'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Profile Image Upload */}
                            <section className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Profile Photo
                                    </label>
                                    {(profilePreview || existingProfileImage) ? (
                                        <div className="flex items-center gap-2 mb-2">
                                            <img
                                                src={profilePreview || existingProfileImage}
                                                alt="Profile preview"
                                                className="w-24 h-24 rounded-full object-cover border border-gray-300"
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    )}
                                </div>
                            </section>
                            {/* Personal Information */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                    <User className="w-6 h-6 text-blue-600" />
                                    <h2 className="sm:text-2xl text-xl font-semibold text-gray-800">Patient Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth *
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="date"
                                                value={formData.DOB}
                                                onChange={(e) => handleInputChange('DOB', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Consultation Mode *
                                        </label>
                                        <div className="relative">
                                            <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <select
                                                value={formData.consultationMode}
                                                onChange={(e) => handleInputChange('consultationMode', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white pr-10"
                                                required
                                            >
                                                <option value="onsite">Onsite</option>
                                                <option value="tele-consultation">Tele-Consultation</option>
                                                <option value="home-visit">Home Visit</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Relationship *
                                        </label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <select
                                                value={formData.relationship}
                                                onChange={(e) => handleInputChange('relationship', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white pr-10"
                                                required
                                            >
                                                <option value="self">Self</option>
                                                <option value="mother">Mother</option>
                                                <option value="father">Father</option>
                                                <option value="brother">Brother</option>
                                                <option value="sister">Sister</option>
                                                <option value="spouse">Spouse</option>
                                                <option value="child">Child</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {formData.relationship !== 'self' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Family Member's Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.familyMemberName}
                                                onChange={(e) => handleInputChange('familyMemberName', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                required={formData.relationship !== 'self'}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Triage Status *
                                        </label>
                                        <div className="relative">
                                            <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <select
                                                value={formData.triage}
                                                onChange={(e) => handleInputChange('triage', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white pr-10"
                                                required
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="emergency">Emergency</option>
                                                <option value="follow-up">Follow-up</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gender *
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white pr-10"
                                                required
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Blood Group *
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.bloodGroup}
                                                onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white pr-10"
                                                required
                                            >
                                                <option value="">Select Blood Group</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="Not Known">Not Known</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* DOCTOR VISIT INFO  */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                    <Stethoscope className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-xl font-semibold sm:text-2xl text-gray-800">Assigned Doctors</h2>
                                </div>

                                {/* Doctor Selection */}
                                {user?.data?.roles[0] !== 'hybrid' && (
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Add Doctor
                                        </label>
                                        <div className="relative">
                                            <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                                            <button
                                                type="button"
                                                onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                                                className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-left"
                                            >
                                                {selectedDoctors.length === 0
                                                    ? 'Select doctor'
                                                    : `${selectedDoctors.length} doctor${selectedDoctors.length > 1 ? 's' : ''} selected`}
                                            </button>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

                                            {showDoctorDropdown && (
                                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                                                    <div
                                                        id="doctor-scrollable-target"
                                                        className="max-h-60 overflow-y-auto"
                                                    >
                                                        <InfiniteScroll
                                                            dataLength={doctors.length}
                                                            next={loadMoreDoctors}
                                                            hasMore={hasMore}
                                                            loader={
                                                                <div className="p-3 text-center text-gray-500">
                                                                    Loading more doctors...
                                                                </div>
                                                            }
                                                            scrollableTarget="doctor-scrollable-target"
                                                            endMessage={
                                                                <div className="p-3 text-center text-gray-500">
                                                                    <b>...</b>
                                                                </div>
                                                            }
                                                        >
                                                            {doctors.map((doctor) => (
                                                                <div
                                                                    key={doctor.user_id._id}
                                                                    className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-gray-100`}
                                                                    onClick={() => handleDoctorSelect(doctor)}
                                                                >
                                                                    <div className="flex items-center">
                                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-blue-100">
                                                                            <Stethoscope className="w-4 h-4 text-blue-600" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">
                                                                                {doctor.user_id?.name}
                                                                            </div>
                                                                            {doctor.specializations && (
                                                                                <div className="text-sm text-gray-500">
                                                                                    {doctor.specializations}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </InfiniteScroll>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Show message for hybrid users */}
                                {user?.data?.roles[0] === 'hybrid' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="w-5 h-5 text-blue-600" />
                                            <span className="text-blue-800 font-medium">
                                                You will be automatically assigned as the doctor for this patient.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Doctor Assignment Cards */}
                                {doctorAssignments.map((assignment) => (
                                    <div key={assignment.doctorId} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className='flex gap-4 items-center '>
                                                <img className='w-10 h-10 rounded-full' src={assignment.profileImage} alt="" />
                                                <h3 className="font-medium text-lg">{assignment.doctorName}</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    {assignment.specializations && assignment.specializations.length > 0 ? (
                                                        assignment.specializations.map((spec, index) => (
                                                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                {spec}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-500 text-sm">No specialization</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDoctor(assignment.doctorId)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Consultation Modes
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={assignment.consultationMode}
                                                        onChange={(e) => handleAssignmentChange(
                                                            assignment.doctorId,
                                                            'consultationMode',
                                                            e.target.value
                                                        )}
                                                        className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white pr-8"
                                                    >
                                                        <option value="onsite">Onsite</option>
                                                        <option value="tele-consultation">Tele-Consultation</option>
                                                        <option value="home-visit">Home Visit</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Appointment Time
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={assignment.appointmentTime}
                                                    onChange={(e) => handleAssignmentChange(
                                                        assignment.doctorId,
                                                        'appointmentTime',
                                                        e.target.value
                                                    )}
                                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Status
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={assignment.status}
                                                        onChange={(e) => handleAssignmentChange(
                                                            assignment.doctorId,
                                                            'status',
                                                            e.target.value
                                                        )}
                                                        className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white pr-8"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Follow Up">Follow Up</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Diagnosis
                                                </label>
                                                <input
                                                    type="text"
                                                    value={assignment.diagnosis}
                                                    onChange={(e) => handleAssignmentChange(
                                                        assignment.doctorId,
                                                        'diagnosis',
                                                        e.target.value
                                                    )}
                                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                                    placeholder="Enter diagnosis"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            {/* Health Metrics */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                    <HeartPulse className="w-6 h-6 text-red-600" />
                                    <h2 className="text-2xl font-semibold text-gray-800">Health Metrics</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Blood Pressure
                                        </label>
                                        <div className="relative">
                                            <HeartPulse className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.bloodPressure}
                                                onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="120/80"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Weight (kg)
                                        </label>
                                        <div className="relative">
                                            <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                value={formData.weight}
                                                onChange={(e) => handleInputChange('weight', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Height (m)
                                        </label>
                                        <div className="relative">
                                            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                value={formData.height}
                                                onChange={(e) => handleInputChange('height', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Heart Rate (bpm)
                                        </label>
                                        <div className="relative">
                                            <HeartPulse className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                value={formData.heartRate}
                                                onChange={(e) => handleInputChange('heartRate', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                min="0"
                                                placeholder="60-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Temperature (°F)
                                        </label>
                                        <div className="relative">
                                            <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                value={formData.temperature}
                                                onChange={(e) => handleInputChange('temperature', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                min="0"
                                                step="0.1"
                                                placeholder="97-99"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            HbA1c (%)
                                        </label>
                                        <div className="relative">
                                            <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                value={formData.hba1c}
                                                onChange={(e) => handleInputChange('hba1c', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                min="0"
                                                step="0.1"
                                                placeholder="<5.7"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Blood Glucose (mg/dl)
                                        </label>
                                        <div className="relative">
                                            <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                value={formData.bloodGlucose}
                                                onChange={(e) => handleInputChange('bloodGlucose', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                min="0"
                                                placeholder="70-110"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            SpO₂ (%)
                                        </label>
                                        <div className="relative">
                                            <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                value={formData.spO2}
                                                onChange={(e) => handleInputChange('spO2', e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                min="0"
                                                max="100"
                                                placeholder="95-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Notes Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                                    <FileText className="w-6 h-6 text-indigo-600" />
                                    <h2 className="text-xl font-semibold sm:text-2xl text-nowrap text-gray-800">Additional Information</h2>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] cursor-pointer shadow-lg flex items-center justify-center gap-2 text-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <FormLoader size="md" text="Processing..." />
                                    ) : (
                                        <>
                                            {isEditMode ? 'Update Patient Profile' : 'Register Patient'}
                                            <User className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {showDoctorDropdown && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDoctorDropdown(false)}
                />
            )}
        </div>
    );
};

export default PatientForm;