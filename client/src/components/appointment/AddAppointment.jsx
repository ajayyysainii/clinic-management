import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { FormLoader } from '../ui/FormLoader';

const AddAppointment = ({ patient: propPatient, onClose: propOnClose, onSuccess: propOnSuccess }) => {
  const { user } = useAuth();
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // Use props if provided (for modal usage) or URL params (for standalone page)
  const patient = propPatient || { _id: patientId };
  const onClose = propOnClose || (() => navigate('/'));
  const onSuccess = propOnSuccess || (() => navigate('/'));
  
  console.log(user);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]); // Array of doctor objects
  const [doctorAssignments, setDoctorAssignments] = useState([]); // Array of {doctorId, ...}
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patientData, setPatientData] = useState(null);

  // Fetch patient data if we have a patientId from URL
  useEffect(() => {
    if (patientId && !propPatient) {
      fetchPatientData();
    }
  }, [patientId, propPatient]);

  const fetchPatientData = async () => {
    try {
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/users/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatientData(response.data.data);
    } catch (err) {
      setError('Failed to load patient data');
      console.error('Error fetching patient:', err);
    }
  };

  useEffect(() => {
    // Only proceed if user data is available
    if (!user) return;
    
    // If user is hybrid role, automatically set the current user as the doctor
    if (user?.data?.roles[0] === 'hybrid') {
      const currentUserAsDoctor = {
        _id: user._id,
        user_id: {
          _id: user._id,
          name: user.name,
          profileImageUrl: user.profileImageUrl
        },
        name: user.name,
        specialization: user.specialization || [],
        profileImageUrl: user.profileImageUrl
      };
      
      setSelectedDoctors([currentUserAsDoctor]);
      setDoctorAssignments([{
        doctorId: user._id,
        profileImage: user.profileImageUrl || '',
        doctorName: user.name,
        specialization: user.specialization || [],
        appointmentTime: '',
        consultationMode: 'onsite',
        status: 'Pending',
        diagnosis: '',
      }]);
      console.log("dcotor selected : "+selectedDoctors)
      console.log("dcotor assignments : "+doctorAssignments)
      setDoctorsLoading(false);
    } else {
      fetchDoctors();
    }
  }, [user]);

  const fetchDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/doctors/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors(response.data.doctors || []);
    } catch (err) {
      setError('Failed to load doctors' + err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  // Doctor selection logic (multi-select)
  const handleDoctorSelect = (doctor) => {
    const isAlreadySelected = selectedDoctors.some(d => (d.user_id?._id || d._id) === (doctor.user_id?._id || doctor._id));
    const doctorId = doctor.user_id?._id || doctor._id;
    if (isAlreadySelected) {
      setSelectedDoctors(prev => prev.filter(d => (d.user_id?._id || d._id) !== doctorId));
      setDoctorAssignments(prev => prev.filter(d => d.doctorId !== doctorId));
    } else {
      setSelectedDoctors(prev => [...prev, doctor]);
      setDoctorAssignments(prev => [
        ...prev,
        {
          doctorId,
          profileImage: doctor.user_id?.profileImageUrl || doctor.profileImageUrl || '',
          doctorName: doctor.user_id?.name || doctor.name,
          specialization: doctor.specialization || doctor.specializations || [],
          appointmentTime: '',
          consultationMode: 'onsite',
          status: 'Pending',
          diagnosis: '',
        }
      ]);
    }
  };

  const handleRemoveDoctor = (doctorId) => {
    setSelectedDoctors(prev => prev.filter(d => (d.user_id?._id || d._id) !== doctorId));
    setDoctorAssignments(prev => prev.filter(d => d.doctorId !== doctorId));
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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authtoken');
      const payload = {
        clinicPatientId: patient._id,
        doctorAssignments: doctorAssignments.map(d => ({
          doctorId: d.doctorId,
          appointmentTime: d.appointmentTime,
          consultationMode: d.consultationMode,
          status: d.status,
          diagnosis: d.diagnosis,
        })),
      };

      await axios.post(`${BACKEND_URL}/appointments/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Appointment(s) created successfully');

      // Auto close after success
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appointment(s)');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date for appointment (current date/time)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className={`${!propOnClose ? 'min-h-screen bg-gray-50' : 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4'}`}>
      <div className={`${!propOnClose ? 'container mx-auto py-8' : 'bg-white rounded-xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto'}`}>
        {/* Header */}
        <div className={`${!propOnClose ? 'bg-white rounded-lg shadow-sm border border-gray-200 mb-6' : 'sticky top-0 bg-white border-b border-gray-200 rounded-t-xl'} px-6 py-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add Appointment</h2>
              {/* Show patient info when used as standalone page */}
              {!propOnClose && patientData && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{patientData.name || 'Patient'}</p>
                    <p className="text-sm text-gray-500">{patientData.phone || 'No phone'}</p>
                  </div>
                </div>
              )}
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              onClick={onClose}
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className={`${!propOnClose ? 'bg-white rounded-lg shadow-sm border border-gray-200' : ''} px-6 py-4`}>
          {/* Alert Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start space-x-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start space-x-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Doctor Selection */}
            {!user ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading user data...</p>
              </div>
            ) : user.data.roles[0] !== 'hybrid' ? (
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Doctor(s) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-left flex justify-between items-center"
                  disabled={doctorsLoading}
                >
                  {selectedDoctors.length === 0
                    ? (doctorsLoading ? 'Loading doctors...' : 'Choose doctor(s)')
                    : `${selectedDoctors.length} doctor${selectedDoctors.length > 1 ? 's' : ''} selected`}
                  <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDoctorDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {doctors.map((doctor) => {
                      const doctorId = doctor.user_id?._id || doctor._id;
                      const isSelected = selectedDoctors.some(d => (d.user_id?._id || d._id) === doctorId);
                      return (
                        <div
                          key={doctorId}
                          className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-gray-100 flex items-center ${isSelected ? 'bg-blue-50' : ''}`}
                          onClick={() => handleDoctorSelect(doctor)}
                        >
                          <img
                            src={doctor.user_id?.profileImageUrl || doctor.profileImageUrl || '/default-doctor.png'}
                            alt="Doctor"
                            className="w-8 h-8 rounded-full object-cover mr-3 border border-gray-200"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{doctor.user_id?.name || doctor.name}</div>
                            {doctor.specialization && (
                              <div className="text-sm text-gray-500">{doctor.specialization}</div>
                            )}
                          </div>
                          {isSelected && <span className="ml-auto text-blue-600 font-bold">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
            
            {/* Show current doctor info for hybrid role */}
            
            {/* Doctor Assignment Cards */}
            {doctorAssignments.map((assignment) => (
              <div key={assignment.doctorId} className="border border-gray-200 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                  </div>
                  {user && user.data.roles[0] !== 'hybrid' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctor(assignment.doctorId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Mode</label>
                    <select
                      value={assignment.consultationMode}
                      onChange={e => handleAssignmentChange(assignment.doctorId, 'consultationMode', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="onsite">Onsite</option>
                      <option value="tele-consultation">Tele-Consultation</option>
                      <option value="home-visit">Home Visit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time</label>
                    <input
                      type="datetime-local"
                      value={assignment.appointmentTime}
                      onChange={e => handleAssignmentChange(assignment.doctorId, 'appointmentTime', e.target.value)}
                      min={getMinDateTime()}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={assignment.status}
                      onChange={e => handleAssignmentChange(assignment.doctorId, 'status', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Notes/Diagnosis</label>
                    <input
                      type="text"
                      value={assignment.diagnosis}
                      onChange={e => handleAssignmentChange(assignment.doctorId, 'diagnosis', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Enter diagnosis"
                    />
                  </div>
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className={`${!propOnClose ? 'bg-white rounded-lg shadow-sm border border-gray-200 mt-6' : 'sticky bottom-0 bg-gray-50'} px-6 py-4 ${!propOnClose ? '' : 'border-t border-gray-200 rounded-b-xl'}`}>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
            >
              {propOnClose ? 'Cancel' : 'Back to Dashboard'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || doctorsLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <FormLoader size="sm" text="Creating..." />
              ) : (
                <span>Create Appointment</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAppointment;
