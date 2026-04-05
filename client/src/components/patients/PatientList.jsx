import { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Eye } from 'lucide-react';
import ActionList from '../ActionList';
import DoctorAvatar from '../ui/DoctorAvatar';
import DownloadButton from '../ui/DownloadButton';
import PatientForm from './PatientForm';
import Popup from '../ui/PopUp';
import {Link} from 'react-router'
import { BACKEND_URL } from '../../utils/urlConstants';
import { sentenceCase } from '../../utils/sentenceCase.js';
import AddAppointment from '../appointment/AddAppointment';
import { exportToCSV, formatPatientDataForCSV } from '../../utils/csvExport';

const PatientList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showAddAppointment, setShowAddAppointment] = useState(false);
    const [appointmentPatient, setAppointmentPatient] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(BACKEND_URL+'/patients', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            // Safely access response data
            const patientsData = response.data?.data || [];
            setData(patientsData);
            console.log(patientsData);
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch patients');
        } finally {
            setLoading(false);
        }
    };
    const handleDeletePatient = async (patientId) => {
        console.log(patientId)
        if (window.confirm('Are you sure you want to delete this patient?')) {
            try {
                await deletePatient(patientId);
                await fetchPatients();
                alert('Patient deleted successfully');
            } catch (err) {
                console.error('Error deleting patient:', err);
                alert('Failed to delete patient');
            }
        }
    };

    const deletePatient = async (patientId) => {
        try {
            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            await axios.delete(`${BACKEND_URL}/patients/delete/${patientId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
        } catch (err) {
            console.error('Error deleting patient:', err);
            throw new Error(err.response?.data?.message || err.message || 'Failed to delete patient');
        }
    };

    const calculateAge = (DOB) => {
        if (!DOB) return 'N/A';

        const today = new Date();
        const birthDate = new Date(DOB);

        if (isNaN(birthDate.getTime())) return 'N/A';

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 0 ? age : 'N/A';
    };

    // Filter patients based on search term
    const filteredData = data.filter(patient => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const name = patient.userId?.name?.toLowerCase() || '';
        const email = patient.userId?.email?.toLowerCase() || '';
        const phone = patient.userId?.phone?.toLowerCase() || '';

        return name.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower);
    });

    if (loading) {
        return (
            <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading patients...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">Error: {error}</div>
                </div>
            </div>
        );
    }

    const handleUpdatePatient = (patientId) => {
        const patient = data.find(p => p._id === patientId);
        if (patient) {
            setSelectedPatient({
                ...patient,
                name: patient.userId?.name || '',
                phone: patient.userId?.phone || '',
                email: patient.userId?.email || ''
            });
            setIsEditMode(true);
        }
    };

    const handleFormClose = () => {
        setIsEditMode(false);
        setSelectedPatient(null);
    };

    const handleFormSuccess = () => {
        fetchPatients(); // Refresh the patient list
        handleFormClose(); // Close the form
    };

    const handleAddAppointment = (patient) => {
      setAppointmentPatient(patient);
      setShowAddAppointment(true);
    };
    const handleAddAppointmentClose = () => {
      setShowAddAppointment(false);
      setAppointmentPatient(null);
    };
    const handleAddAppointmentSuccess = () => {
      fetchPatients();
      handleAddAppointmentClose();
    };

    const handleExportToCSV = async () => {
      if (data.length === 0) {
        alert('No patients to export');
        return;
      }
      
      setIsExporting(true);
      try {
        const formattedData = formatPatientDataForCSV(data);
        const headers = ['Name', 'Age', 'Phone', 'Email', 'Relationship', 'Triage', 'Gender', 'Blood Group'];
        exportToCSV(formattedData, 'patients', headers);
      } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data. Please try again.');
      } finally {
        setIsExporting(false);
      }
    };


    return (
        <>
            {isEditMode && selectedPatient ? (
                <PatientForm
                    patient={selectedPatient}
                    isEditMode={true}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className='h-16 flex items-center justify-between gap-2 px-10 text-nowrap'>
                            <input
                                type="text"
                                placeholder="Search Patients"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-1/3 rounded-xl bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-gray-300 px-3 py-2 transition duration-300 ease-in-out focus:border-blue-500 hover:border-blue-300 outline-none"
                            />
                            <div className='border border-gray-200 rounded-sm p-1 hover:scale-110 transition-all duration-300'>
                                <DownloadButton onDownload={handleExportToCSV} loading={isExporting} />
                            </div>
                        </div>
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Age
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    {/* <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Visit
                                    </th> */}
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Triage
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((patient, index) => (
                                        <tr key={patient._id || index} className="hover:bg-gray-50 transition-colors duration-150 border-t border-gray-200">
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className="flex items-center">
                                                    {patient.userId?.profileImageUrl ? (
                                                        <img
                                                            src={patient.userId.profileImageUrl}
                                                            alt={patient.userId?.name || 'Patient'}
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-300"
                                                        />
                                                    ) : (
                                                        <DoctorAvatar
                                                            name={patient.userId?.name || 'Unknown'}
                                                            id={index}
                                                        />
                                                    )}
                                                    <div className="ml-4">
                                                        {patient.userId?._id ? (
                                                            <Link to={`/profile/patient/${patient.userId._id}`}>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {(patient.relationship == "self") ? sentenceCase(patient.userId?.name) || "none" : sentenceCase(patient.familyMemberName) || "none"}
                                                                </div>
                                                            </Link>
                                                        ) : (
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {(patient.relationship == "self") ? sentenceCase(patient.userId?.name) || "none" : sentenceCase(patient.familyMemberName) || "none"}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {calculateAge(patient.DOB)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {patient.userId?.phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {patient.userId?.email || 'N/A'}
                                            </td>
                                            {/* <td className="px-6 py-4 whitespace-nowrap">
                                                {patient.visitDates || 'N/A'}
                                            </td> */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-sm rounded-md w-24 text-center inline-block ${patient.triage === 'normal' ? 'bg-green-100 text-green-800' :
                                                    patient.triage === 'follow-up' ? 'bg-yellow-100 text-yellow-800' :
                                                        patient.triage === 'emergency' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {sentenceCase(patient.triage) || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ActionList
                                                    item={patient} // The item these actions will act upon
                                                    actions={[
                                                        {
                                                            label: 'Edit',
                                                            icon: Edit,
                                                            onClick: () => handleUpdatePatient(patient._id),
                                                        },
                                                        {
                                                            label: 'Delete',
                                                            icon: Trash2,
                                                            onClick: () => handleDeletePatient(patient._id),
                                                            className: 'text-red-600 hover:bg-red-50',
                                                        },
                                                        {
                                                            label: 'Create Appointment',
                                                            icon: Eye,
                                                            onClick: () => handleAddAppointment(patient),
                                                        },
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {showAddAppointment && appointmentPatient && (
              <AddAppointment
                patient={appointmentPatient}
                onClose={handleAddAppointmentClose}
                onSuccess={handleAddAppointmentSuccess}
              />
            )}
        </>
    );
};
export default PatientList;