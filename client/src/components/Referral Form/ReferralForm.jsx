import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';
import { FormLoader, FullPageLoader } from '../ui/FormLoader';

const ReferralForm = () => {
  const { user } = useAuth();
  const userRole = user?.data?.roles?.[0];
  
  // Debug logging for role-based behavior
  console.log('ReferralForm - User role:', userRole);
  console.log('ReferralForm - Is hybrid?', userRole === 'hybrid');
  console.log('ReferralForm - Current user ID:', user?.data?._id);
  
  const [formData, setFormData] = useState({
    patientId: '',
    referredBy: '',
    referredTo: {
      doctorId: '',
      name: '',
      department: '',
      hospital: '',
      contact: '',
    },
    reasonForReferral: '',
    provisionalDiagnosis: '',
    medicalHistory: '',
    investigationsDone: '',
    instructions: '',
    referralDate: new Date().toISOString().split('T')[0],
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Fetch patients
    const fetchPatients = async () => {
      if (!user?.data?.clinic?._id) return;
      try {
        const token = localStorage.getItem('authtoken');
        const res = await axios.get(`${BACKEND_URL}/patients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPatients(res.data.data);
      } catch {
        setError('Failed to fetch patients.');
      }
    };
    // Fetch doctors only if user is not hybrid
    const fetchDoctors = async () => {
      if (userRole === 'hybrid') return; // Don't fetch doctors for hybrid users
      try {
        const token = localStorage.getItem('authtoken');
        const res = await axios.get(`${BACKEND_URL}/doctors/list-clinic-doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(res.data.data || []);
      } catch {
        setError('Failed to fetch doctors.');
        setDoctors([]);
      }
    };
    fetchPatients();
    fetchDoctors();
  }, [user, userRole]);

  // Auto-set referredBy for hybrid users
  useEffect(() => {
    if (userRole === 'hybrid' && user?.data?._id) {
      setFormData(prev => ({
        ...prev,
        referredBy: user.data._id
      }));
    }
  }, [userRole, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('referredTo.')) {
      const key = name.split('.')[1];
      setFormData({
        ...formData,
        referredTo: { ...formData.referredTo, [key]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const token = localStorage.getItem('authtoken');
      // Prepare investigationsDone as array
      const investigationsDoneArr = formData.investigationsDone
        ? formData.investigationsDone.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const dataToSend = {
        ...formData,
        referredTo: {
          ...formData.referredTo,
          doctorId: formData.referredTo.doctorId || undefined,
        },
        investigationsDone: investigationsDoneArr,
        referralDate: formData.referralDate,
      };
      // Remove empty referredTo if all fields are empty
      if (
        !dataToSend.referredTo.doctorId &&
        !dataToSend.referredTo.name &&
        !dataToSend.referredTo.department &&
        !dataToSend.referredTo.hospital &&
        !dataToSend.referredTo.contact
      ) {
        delete dataToSend.referredTo;
      }
      await axios.post(`${BACKEND_URL}/forms/referral/create`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Referral form created successfully!');
      setFormData({
        patientId: '',
        referredBy: userRole === 'hybrid' ? user?.data?._id : '',
        referredTo: {
          doctorId: '',
          name: '',
          department: '',
          hospital: '',
          contact: '',
        },
        reasonForReferral: '',
        provisionalDiagnosis: '',
        medicalHistory: '',
        investigationsDone: '',
        instructions: '',
        referralDate: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      setError('Failed to create referral form. Please check the details and try again.'+err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md">
      {uploading && <FullPageLoader text="Creating referral form..." />}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Referral Form</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
        {success && <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">{success}</div>}

        {/* Patient Dropdown */}
        <div>
          <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">Select Patient</label>
          <select
            name="patientId"
            id="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Please select a patient --</option>
            {patients
              .filter((patient) => patient.userId && patient.userId._id)
              .map((patient) => (
                <option key={patient.userId._id} value={patient.userId._id}>
                  {patient.userId.name} ({patient.userId.email})
                </option>
              ))}
          </select>
        </div>

        {/* Referred By (Doctor) - Conditional display based on role */}
        {userRole === 'hybrid' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">Referred By (Doctor)</label>
            <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              {user?.data?.name} ({user?.data?.email}) - Current User
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="referredBy" className="block text-sm font-medium text-gray-700">Referred By (Doctor)</label>
            <select
              name="referredBy"
              id="referredBy"
              value={formData.referredBy}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Please select a doctor --</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>{doctor.name} ({doctor.email})</option>
              ))}
            </select>
          </div>
        )}

        {/* Referred To (Doctor or External) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRole !== 'hybrid' && (
            <div>
              <label htmlFor="referredTo.doctorId" className="block text-sm font-medium text-gray-700">Referred To (Doctor)</label>
              <select
                name="referredTo.doctorId"
                id="referredTo.doctorId"
                value={formData.referredTo.doctorId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- Select doctor (optional) --</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>{doctor.name} ({doctor.email})</option>
                ))}
              </select>
            </div>
          )}
          <div className={userRole === 'hybrid' ? 'col-span-2' : ''}>
            <label htmlFor="referredTo.name" className="block text-sm font-medium text-gray-700">
              {userRole === 'hybrid' ? 'Referred To (External Doctor/Hospital)' : 'Referred To (Name)'}
            </label>
            <input
              type="text"
              name="referredTo.name"
              id="referredTo.name"
              value={formData.referredTo.name}
              onChange={handleChange}
              placeholder={userRole === 'hybrid' ? 'External doctor or hospital name' : 'External doctor name'}
              required={userRole === 'hybrid'}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="referredTo.department" className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              name="referredTo.department"
              id="referredTo.department"
              value={formData.referredTo.department}
              onChange={handleChange}
              placeholder="Department"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="referredTo.hospital" className="block text-sm font-medium text-gray-700">Hospital</label>
            <input
              type="text"
              name="referredTo.hospital"
              id="referredTo.hospital"
              value={formData.referredTo.hospital}
              onChange={handleChange}
              placeholder="Hospital"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="referredTo.contact" className="block text-sm font-medium text-gray-700">Contact</label>
            <input
              type="text"
              name="referredTo.contact"
              id="referredTo.contact"
              value={formData.referredTo.contact}
              onChange={handleChange}
              placeholder="Contact"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Reason for Referral */}
        <div>
          <label htmlFor="reasonForReferral" className="block text-sm font-medium text-gray-700">Reason for Referral</label>
          <textarea
            name="reasonForReferral"
            id="reasonForReferral"
            value={formData.reasonForReferral}
            onChange={handleChange}
            required
            rows="2"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        {/* Provisional Diagnosis */}
        <div>
          <label htmlFor="provisionalDiagnosis" className="block text-sm font-medium text-gray-700">Provisional Diagnosis</label>
          <input
            type="text"
            name="provisionalDiagnosis"
            id="provisionalDiagnosis"
            value={formData.provisionalDiagnosis}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Medical History */}
        <div>
          <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">Medical History</label>
          <textarea
            name="medicalHistory"
            id="medicalHistory"
            value={formData.medicalHistory}
            onChange={handleChange}
            rows="2"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        {/* Investigations Done */}
        <div>
          <label htmlFor="investigationsDone" className="block text-sm font-medium text-gray-700">Investigations Done (comma-separated)</label>
          <input
            type="text"
            name="investigationsDone"
            id="investigationsDone"
            value={formData.investigationsDone}
            onChange={handleChange}
            placeholder="e.g., Blood test, X-ray"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Instructions</label>
          <textarea
            name="instructions"
            id="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows="2"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        {/* Referral Date */}
        <div>
          <label htmlFor="referralDate" className="block text-sm font-medium text-gray-700">Referral Date</label>
          <input
            type="date"
            name="referralDate"
            id="referralDate"
            value={formData.referralDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <FormLoader size="sm" text="Submitting..." /> : 'Create Referral'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReferralForm; 