import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';
import { Search, X, Clock, Building2, Stethoscope, User, Sparkles, CalendarCheck, Activity } from 'lucide-react';

const QuickBookingPanel = ({ onSuccess }) => {
  const { user } = useAuth();
  const userRole = user?.data?.roles?.[0];

  // --- State ---
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);

  const [slotTime, setSlotTime] = useState('');
  const [slotLabel, setSlotLabel] = useState('');
  const [isEditingSlot, setIsEditingSlot] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visitType, setVisitType] = useState('');

  // Filter tab state
  const [activeTab, setActiveTab] = useState('new');

  const doctorDropdownRef = useRef(null);
  const patientDropdownRef = useRef(null);
  const slotInputRef = useRef(null);

  // --- Initialize slot to "Now" ---
  const updateSlotToNow = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    setSlotLabel(`Now (${displayHours}:${displayMinutes} ${ampm}) | In Clinic`);

    // Set the datetime-local value
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setSlotTime(now.toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    updateSlotToNow();
  }, [updateSlotToNow]);

  // --- Auto-select doctor for hybrid role ---
  useEffect(() => {
    if (!user) return;

    if (userRole === 'hybrid') {
      setSelectedDoctor({
        _id: user._id || user.data?._id,
        name: user.name || user.data?.name,
        profileImageUrl: user.profileImageUrl || user.data?.profileImageUrl,
      });
    } else {
      fetchDoctors();
    }
  }, [user, userRole]);

  // --- Fetch doctors ---
  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/doctors/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors(response.data.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  // --- Fetch patients ---
  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(`${BACKEND_URL}/patients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data.data || []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPatients();
  }, [user]);

  // --- Close dropdowns on outside click ---
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(e.target)) {
        setShowDoctorDropdown(false);
      }
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Filter helpers ---
  const filteredDoctors = doctors.filter((doc) => {
    const name = doc.user_id?.name || doc.name || '';
    return name.toLowerCase().includes(doctorSearch.toLowerCase());
  });

  const filteredPatients = patients.filter((p) => {
    const name = p.userId?.name || p.familyMemberName || '';
    return name.toLowerCase().includes(patientSearch.toLowerCase());
  });

  // --- Doctor select ---
  const handleSelectDoctor = (doctor) => {
    const doctorId = doctor.user_id?._id || doctor._id;
    const doctorName = doctor.user_id?.name || doctor.name;
    const doctorImg = doctor.user_id?.profileImageUrl || doctor.profileImageUrl;
    setSelectedDoctor({ _id: doctorId, name: doctorName, profileImageUrl: doctorImg });
    setShowDoctorDropdown(false);
    setDoctorSearch('');
  };

  // --- Patient select ---
  const handleSelectPatient = (patient) => {
    const patientName = patient.relationship === 'self'
      ? (patient.userId?.name || 'Unknown')
      : (patient.familyMemberName || 'Unknown');
    setSelectedPatient({
      _id: patient._id,
      name: patientName,
      phone: patient.userId?.phone || '',
      profileImageUrl: patient.userId?.profileImageUrl || '',
    });
    setShowPatientDropdown(false);
    setPatientSearch('');
  };

  // --- Slot edit ---
  const handleSlotChange = (e) => {
    const val = e.target.value;
    setSlotTime(val);

    if (val) {
      const d = new Date(val);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      setSlotLabel(`${displayHours}:${displayMinutes} ${ampm} | In Clinic`);
    }
    setIsEditingSlot(false);
  };

  // --- Check-In / Submit ---
  const handleCheckIn = async () => {
    setError('');
    setSuccess('');

    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    if (!visitType) {
      setError('Please select a visit type');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authtoken');
      const payload = {
        clinicPatientId: selectedPatient._id,
        doctorAssignments: [
          {
            doctorId: selectedDoctor._id,
            appointmentTime: slotTime ? new Date(slotTime).toISOString() : new Date().toISOString(),
            consultationMode: 'onsite',
            status: visitType === 'follow-up' ? 'Follow Up' : 'Pending',
            diagnosis: '',
          },
        ],
      };

      await axios.post(`${BACKEND_URL}/appointments/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update the patient's triage based on the selected visit type
      try {
        await axios.put(`${BACKEND_URL}/patients/update/${selectedPatient._id}`, {
          triage: visitType,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (triageErr) {
        console.error('Failed to update triage:', triageErr);
      }

      setSuccess('Appointment booked successfully!');
      // Reset patient selection
      setSelectedPatient(null);
      setVisitType('');
      updateSlotToNow();

      // Refresh appointments table
      if (onSuccess) onSuccess();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // --- Clinic name from user context ---
  const clinicName = user?.data?.clinicName || user?.clinicName || 'Clinic';

  // --- Get initials for avatar ---
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-[380px] min-w-[380px] flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'new'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          <span className="text-base">+</span> New
        </button>
        <button
          onClick={() => setActiveTab('booked')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'booked'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          Booked (00)
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'followups'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          Follow Ups (00)
        </button>
        <button
          onClick={() => setActiveTab('others')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'others'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
          Others (00)
        </button>
      </div>

      <div className="border-t border-gray-100" />

      {/* Form Fields */}
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <X className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CalendarCheck className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. Clinic Field */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 w-16 flex-shrink-0">
            <Building2 className="w-4 h-4" />
            <span>Clinic</span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-800 truncate">{clinicName}</span>
          </div>
        </div>

        {/* 2. Doctor Field */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 w-16 flex-shrink-0">
            <Stethoscope className="w-4 h-4" />
            <span>Doctor</span>
          </div>

          {selectedDoctor ? (
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              {selectedDoctor.profileImageUrl ? (
                <img
                  src={selectedDoctor.profileImageUrl}
                  alt={selectedDoctor.name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                  {getInitials(selectedDoctor.name)}
                </div>
              )}
              <span className="text-sm font-medium text-gray-800 truncate">{selectedDoctor.name}</span>
              {userRole !== 'hybrid' && (
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="ml-auto p-0.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 relative" ref={doctorDropdownRef}>
              <div
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
              >
                <span className="text-sm text-gray-400">Select Doctor</span>
              </div>
              {showDoctorDropdown && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Search doctor..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
                      autoFocus
                    />
                  </div>
                  {filteredDoctors.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400 text-center">No doctors found</div>
                  ) : (
                    filteredDoctors.map((doc) => {
                      const docId = doc.user_id?._id || doc._id;
                      const docName = doc.user_id?.name || doc.name;
                      const docImg = doc.user_id?.profileImageUrl || doc.profileImageUrl;
                      return (
                        <div
                          key={docId}
                          className="flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => handleSelectDoctor(doc)}
                        >
                          {docImg ? (
                            <img src={docImg} alt={docName} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                              {getInitials(docName)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-800">{docName}</div>
                            {doc.specialization && (
                              <div className="text-xs text-gray-400">{doc.specialization}</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Slot Field */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 w-16 flex-shrink-0">
            <Clock className="w-4 h-4" />
            <span>Slot</span>
          </div>

          <div className="flex-1 relative">
            {isEditingSlot ? (
              <input
                ref={slotInputRef}
                type="datetime-local"
                value={slotTime}
                onChange={handleSlotChange}
                onBlur={() => setIsEditingSlot(false)}
                className="w-full text-sm px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
            ) : (
              <div
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => setIsEditingSlot(true)}
              >
                <span className="text-sm font-medium text-gray-800">{slotLabel}</span>
                <CalendarCheck className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* 4. Patient Field */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 w-16 flex-shrink-0">
            <User className="w-4 h-4" />
            <span>Patient</span>
          </div>

          {selectedPatient ? (
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              {selectedPatient.profileImageUrl ? (
                <img
                  src={selectedPatient.profileImageUrl}
                  alt={selectedPatient.name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                  {getInitials(selectedPatient.name)}
                </div>
              )}
              <span className="text-sm font-medium text-gray-800 truncate">{selectedPatient.name}</span>
              <button
                onClick={() => setSelectedPatient(null)}
                className="ml-auto p-0.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          ) : (
            <div className="flex-1 relative" ref={patientDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Select or Add Patient"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="w-full text-sm pl-3 pr-9 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 hover:border-blue-300 transition-colors"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
              </div>
              {showPatientDropdown && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {patientsLoading ? (
                    <div className="p-3 text-sm text-gray-400 text-center">Loading patients...</div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400 text-center">No patients found</div>
                  ) : (
                    filteredPatients.map((patient) => {
                      const pName = patient.relationship === 'self'
                        ? (patient.userId?.name || 'Unknown')
                        : (patient.familyMemberName || 'Unknown');
                      const pImg = patient.userId?.profileImageUrl;
                      return (
                        <div
                          key={patient._id}
                          className="flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => handleSelectPatient(patient)}
                        >
                          {pImg ? (
                            <img src={pImg} alt={pName} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                              {getInitials(pName)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-800">{pName}</div>
                            {patient.userId?.phone && (
                              <div className="text-xs text-gray-400">{patient.userId.phone}</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Visit Type Field */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 w-16 flex-shrink-0 pt-2">
            <Activity className="w-4 h-4" />
            <span>Type</span>
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            {[
              { value: 'normal', label: 'Normal', color: 'amber' },
              { value: 'follow-up', label: 'Follow Up', color: 'blue' },
              { value: 'emergency', label: 'Emergency', color: 'red' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVisitType(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  visitType === opt.value
                    ? opt.color === 'amber'
                      ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm'
                      : opt.color === 'blue'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                      : 'bg-red-50 border-red-400 text-red-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* Check-In Button */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={handleCheckIn}
          disabled={loading || !selectedDoctor || !selectedPatient || !visitType}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all duration-200 text-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Booking...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Check-In</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuickBookingPanel;
