import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';
import { FormLoader, FullPageLoader } from '../ui/FormLoader'; // Import useAuth to get clinic ID

const CreateConsentForm = () => {
  const { user } = useAuth(); // Get user from auth context
  const userRole = user?.data?.roles?.[0]; // Get user role
  const [formData, setFormData] = useState({
    patientId: '',
    procedureName: '',
    description: '',
    benefits: '',
    risks: '',
    alternatives: '',
    consentDate: new Date().toISOString().split('T')[0],
    doctorId: '', // Add doctorId to form data
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]); // Add state for doctors
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch patients to populate the dropdown
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

    // Fetch doctors to populate the dropdown (only if not hybrid role)
    const fetchDoctors = async () => {
      if (userRole === 'hybrid') return; // Don't fetch doctors for hybrid role
      
      try {
        const token = localStorage.getItem('authtoken');
        const res = await axios.get(`${BACKEND_URL}/doctors/list-clinic-doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("doctor data", res.data);
        setDoctors(res.data.data || []);
      } catch {
        setError('Failed to fetch doctors.');
        setDoctors([]);
      }
    };

    fetchPatients();
    fetchDoctors();
  }, [user, userRole]);

  // Set doctorId automatically for hybrid role
  useEffect(() => {
    if (userRole === 'hybrid' && user?.data?._id) {
      setFormData(prev => ({
        ...prev,
        doctorId: user.data._id
      }));
    }
  }, [userRole, user?.data?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authtoken');
      const dataToSend = {
        ...formData,
        risks: formData.risks.split(',').map(item => item.trim()),
        alternatives: formData.alternatives.split(',').map(item => item.trim()),
      };

      await axios.post(`${BACKEND_URL}/consent`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Consent form created and sent to patient successfully!');
      // Reset form
      setFormData({
        patientId: '',
        procedureName: '',
        description: '',
        benefits: '',
        risks: '',
        alternatives: '',
        consentDate: new Date().toISOString().split('T')[0],
        doctorId: userRole === 'hybrid' ? user?.data?._id : '', 
      });
    } catch {
      setError('Failed to create consent form. Please check the details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md">
      {isSubmitting && <FullPageLoader text="Creating consent form..." />}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Consent Form</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
        {success && <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">{success}</div>}

        {/* Only show doctor selection if user is not hybrid role */}
        {userRole !== 'hybrid' && (
          <div>
            <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700">Select Doctor</label>
            <select
              name="doctorId"
              id="doctorId"
              value={formData.doctorId}
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

        {/* Show current doctor info for hybrid role */}
        {userRole === 'hybrid' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Doctor</label>
            <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
              {user?.data?.name} ({user?.data?.email})
            </div>
            <p className="mt-1 text-sm text-gray-500">You will be assigned as the doctor for this consent form.</p>
          </div>
        )}
        
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
              .filter(patient => patient.userId)
              .map((patient) => (
                <option key={patient.userId._id} value={patient.userId._id}>
                  {patient.userId.name} ({patient.userId.email})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="procedureName" className="block text-sm font-medium text-gray-700">Procedure Name</label>
          <input
            type="text"
            name="procedureName"
            id="procedureName"
            value={formData.procedureName}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
        </div>

        <div>
            <label htmlFor="benefits" className="block text-sm font-medium text-gray-700">Benefits</label>
            <textarea
                name="benefits"
                id="benefits"
                value={formData.benefits}
                onChange={handleChange}
                required
                rows="3"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
        </div>

        <div>
            <label htmlFor="risks" className="block text-sm font-medium text-gray-700">Risks (comma-separated)</label>
            <input
                type="text"
                name="risks"
                id="risks"
                value={formData.risks}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Infection, Bleeding"
            />
        </div>

        <div>
            <label htmlFor="alternatives" className="block text-sm font-medium text-gray-700">Alternatives (comma-separated)</label>
            <input
                type="text"
                name="alternatives"
                id="alternatives"
                value={formData.alternatives}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Medication, Physical therapy"
            />
        </div>

        <div>
            <label htmlFor="consentDate" className="block text-sm font-medium text-gray-700">Consent Date</label>
            <input
                type="date"
                name="consentDate"
                id="consentDate"
                value={formData.consentDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <FormLoader size="sm" text="Creating..." />
            ) : (
              'Create and Send Consent'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateConsentForm; 