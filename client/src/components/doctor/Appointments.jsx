import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import DoctorAvatar from '../ui/DoctorAvatar.jsx';
import ActionList from '../ActionList.jsx'
import DownloadButton from '../ui/DownloadButton.jsx';
import EditAppointmentPopup from '../appointment/EditAppointmentPopup.jsx';
import TeleConsultationModal from '../teleConsultation/TeleConsultationModal.jsx';
import { Trash2, Edit, AlertCircle, FilePlus, ClipboardPlus, Video, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx'
import { Link, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../utils/urlConstants.js';
import { sentenceCase } from '../../utils/sentenceCase.js';

const Appointments = () => {
    let navigate = useNavigate();
    const { user } = useAuth();
    const userRole = user?.data?.roles?.[0];
    const userId = user?.data?._id;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [modeFilter, setModeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editPopup, setEditPopup] = useState({
        isOpen: false,
        appointment: null
    });
    const [teleconsultationModal, setTeleconsultationModal] = useState({
        isOpen: false,
        appointment: null,
        sessionData: null
    });
    const [isExporting, setIsExporting] = useState(false);

    // CSV Export function
    const handleExportCSV = async () => {
        if (!filteredData || filteredData.length === 0) {
            alert('No appointments to export');
            return;
        }

        setIsExporting(true);
        
        try {
            // Define CSV headers
            const headers = [
                'Appointment ID',
                'Patient Name',
                'Triage',
                'Date',
                'Time',
                'Consultation Mode',
                'Status',
                'Diagnosis'
            ];

                    // Prepare CSV data
            const csvData = filteredData.map(appointment => [
                appointment?._id || 'N/A',
                getPatientName(appointment) || 'N/A',
                getPatientTriage(appointment) || 'N/A',
                formatDate(appointment?.appointmentTime) || 'N/A',
                formatTime(appointment?.appointmentTime) || 'N/A',
                appointment?.consultationMode || 'N/A',
                appointment?.status || 'N/A',
                appointment?.diagnosis || 'N/A',
            ]).filter(row => row.some(cell => cell !== 'N/A')); // Filter out completely empty rows

            // Combine headers and data
            const csvContent = [headers, ...csvData]
                .map(row => row.map(cell => {
                    // Handle special characters and ensure proper CSV formatting
                    const cellStr = String(cell || '').replace(/"/g, '""');
                    return `"${cellStr}"`;
                }).join(','))
                .join('\n');

            // Create and download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            // Generate filename with filters
            let filename = `appointments_${new Date().toISOString().split('T')[0]}`;
            if (modeFilter !== 'all') filename += `_${modeFilter}`;
            if (statusFilter !== 'all') filename += `_${statusFilter}`;
            if (searchTerm) filename += `_search_${searchTerm.substring(0, 20)}`;
            filename += '.csv';
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            URL.revokeObjectURL(url);
            
            // Show success message
            alert(`Successfully exported ${filteredData.length} appointments to CSV`);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Failed to export CSV. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };


    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            let response;
            if (userRole === "doctor") {
                response = await axios.get(`${BACKEND_URL}/appointments/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
            } else if (userRole === "admin" || userRole === "superadmin") {
                if (statusFilter === 'Completed') {
                    // Show all completed appointments regardless of mode
                    response = await axios.get(`${BACKEND_URL}/appointments/clinic/completed`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                } else {
                    response = await axios.get(`${BACKEND_URL}/appointments/clinic`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                }
            } else if (userRole === "hybrid" || userRole === "staff") {
                if (statusFilter === 'Completed') {
                    // Show all completed appointments regardless of mode
                    response = await axios.get(`${BACKEND_URL}/appointments/clinic/completed`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                } else {
                    response = await axios.get(`${BACKEND_URL}/appointments/clinic`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                }
            }
            else {
                throw new Error('Invalid user role');
            }

            const appointmentsData = response.data?.data || [];
            setData(appointmentsData);
            console.log(appointmentsData);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            
            // Special handling for "no completed appointments found" case
            if (statusFilter === 'Completed' && 
                err.response?.status === 404 && 
                err.response?.data?.message === 'No completed appointments found for this clinic') {
                // This is not an error, just no completed appointments exist
                setData([]);
                setError(null);
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to fetch appointments');
            }
        } finally {
            setLoading(false);
        }
    }, [userId, userRole, statusFilter]);

    // FIX 3: Added userRole to dependencies to ensure proper re-fetching
    useEffect(() => {
        if (userId && userRole) {
            fetchAppointments();
        }
    }, [fetchAppointments, userId, userRole, statusFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid Date';
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Time';
            }
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Time formatting error:', error);
            return 'Invalid Time';
        }
    };

    // Helper function to check if appointment is scheduled for today
    const isAppointmentToday = (dateString) => {
        if (!dateString) return false;

        try {
            const appointmentDate = new Date(dateString);
            const today = new Date();
            
            // Reset time to compare only dates
            const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            return appointmentDateOnly.getTime() === todayOnly.getTime();
        } catch (error) {
            console.error('Error checking appointment date:', error);
            return false;
        }
    };

    // Helper functions to handle both doctor and admin/clinic head/clinic admin appointment data structures
    const getPatientName = (appointment) => {
        // Doctor response
        if (typeof appointment.clinicPatientId === 'object' && appointment.clinicPatientId !== null) {
            const cp = appointment.clinicPatientId;
            if (cp.relationship === "self") {
                return cp.userId?.name || "Unknown";
            }
            return cp.familyMemberName || "Unknown";
        }
        // Admin response
        if (appointment.clinicPatient && appointment.clinicPatient.user) {
            return appointment.clinicPatient.user.name || "Unknown";
        }
        return "Unknown";
    };

    const getPatientProfileImage = (appointment) => {
        // Doctor response
        if (typeof appointment.clinicPatientId === 'object' && appointment.clinicPatientId !== null) {
            return appointment.clinicPatientId.userId?.profileImageUrl;
        }
        // Admin response
        if (appointment.clinicPatient && appointment.clinicPatient.user) {
            return appointment.clinicPatient.user.profileImageUrl;
        }
        return null;
    };

    const getPatientUserId = (appointment) => {
        // Doctor response
        if (typeof appointment.clinicPatientId === 'object' && appointment.clinicPatientId !== null) {
            return appointment.clinicPatientId.userId?._id;
        }
        // Admin response
        if (appointment.clinicPatient && appointment.clinicPatient.user) {
            return appointment.clinicPatient.user._id;
        }
        return null;
    };

    const getPatientTriage = (appointment) => {
        // Doctor response
        if (typeof appointment.clinicPatientId === 'object' && appointment.clinicPatientId !== null) {
            return appointment.clinicPatientId.triage || 'N/A';
        }
        // Admin response
        if (appointment.clinicPatient) {
            return appointment.clinicPatient.triage || 'N/A';
        }
        return 'N/A';
    };

    // Filter appointments based on search term and mode filter
    const filteredData = data.filter(appointment => {
        // Search filter
        let matchesSearch = true;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const patientName = getPatientName(appointment).toLowerCase();
            const status = appointment?.status?.toLowerCase() || '';
            const consultationMode = appointment?.consultationMode?.toLowerCase() || '';
            const diagnosis = appointment?.diagnosis?.toLowerCase() || '';

            matchesSearch = patientName.includes(searchLower) ||
                status.includes(searchLower) ||
                consultationMode.includes(searchLower) ||
                diagnosis.includes(searchLower);
        }

        // Mode filter
        let matchesMode = true;
        if (modeFilter !== 'all') {
            matchesMode = appointment?.consultationMode === modeFilter;
        }

        // Status filter
        let matchesStatus = true;
        if (statusFilter === 'all') {
            // When status filter is 'all', exclude completed appointments for all users
            matchesStatus = appointment?.status !== 'Completed';
        } else if (statusFilter === 'Completed') {
            // When status filter is 'Completed', show only completed appointments
            matchesStatus = appointment?.status === 'Completed';
        } else {
            // For any other specific status filter
            matchesStatus = appointment?.status === statusFilter;
        }

        return matchesSearch && matchesMode && matchesStatus;
    });

    // FIX 4: Added confirmation dialog for better UX
    const handleCancelAppointment = async (appointmentId) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        try {
            console.log('Cancelling appointment:', appointmentId);

            const token = localStorage.getItem('authtoken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // FIX 5: Added status data to PUT request body
            await axios.put(
                `${BACKEND_URL}/appointments/${appointmentId}`,
                { status: 'Cancelled' }, // Send the status change in the request body
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            // Update the appointment in the local state
            setData(prevData =>
                prevData.map(appointment =>
                    appointment._id === appointmentId
                        ? { ...appointment, status: 'Cancelled' }
                        : appointment
                )
            );

            console.log('Appointment cancelled successfully');
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            setError(error.response?.data?.message || error.message || 'Failed to cancel appointment');
        }
    };

    const handleEditAppointment = (appointment) => {
        setEditPopup({
            isOpen: true,
            appointment: appointment
        });
    };

    const handleCloseEditPopup = () => {
        setEditPopup({
            isOpen: false,
            appointment: null
        });
    };

    const handleUpdateAppointment = (updatedAppointment) => {
        setData(prevData =>
            prevData.map(appointment =>
                appointment._id === updatedAppointment._id
                    ? updatedAppointment
                    : appointment
            )
        );
        console.log('Appointment updated successfully');
    };

    const handleRedirection = (path) => {
        navigate(path)
    }

    const handleStartTeleconsultation = async (appointment) => {
        try {
            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BACKEND_URL}/teleconsultation/doctor/${appointment._id}/token`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (response.data.success) {
                setTeleconsultationModal({
                    isOpen: true,
                    appointment: appointment,
                    sessionData: response.data.data
                });
            }
        } catch (error) {
            console.error('Error starting teleconsultation:', error);
            alert(error.response?.data?.message || 'Failed to start teleconsultation');
        }
    };

    const handleCloseTeleconsultationModal = () => {
        setTeleconsultationModal({
            isOpen: false,
            appointment: null,
            sessionData: null
        });
    };



    const LoadingState = () => (
        <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <div className="text-gray-500">Loading appointments...</div>
                </div>
            </div>
        </div>
    );

    const ErrorState = () => (
        <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <div className="text-red-600 font-medium">Error loading appointments</div>
                    <div className="text-gray-500 text-sm mt-1">{error}</div>
                    <button
                        onClick={fetchAppointments}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) return <LoadingState />;
    if (error) return <ErrorState />;

    return (
        <>
            <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <div className='h-16 flex items-center justify-between px-10'>
                        <div className="flex items-center gap-2">

                            {/* Mode filter buttons */}
                            <div className="flex gap-2  text-nowrap">
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-xl text-sm border transition duration-300 outline-none focus:border-blue-500 hover:border-blue-300 cursor-pointer ${modeFilter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-700 border-gray-300'}`}
                                    onClick={() => setModeFilter('all')}
                                >
                                    All Modes
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-xl text-sm border transition duration-300 outline-none focus:border-blue-500 hover:border-blue-300 cursor-pointer ${modeFilter === 'onsite' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-700 border-gray-300'}`}
                                    onClick={() => setModeFilter('onsite')}
                                >
                                    On-site
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-xl text-sm border transition duration-300 outline-none focus:border-blue-500 hover:border-blue-300 cursor-pointer ${modeFilter === 'tele-consultation' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-700 border-gray-300'}`}
                                    onClick={() => setModeFilter('tele-consultation')}
                                >
                                    Tele-consultation
                                </button>
                            </div>
                            
                            {/* Status filter buttons */}
                            <div className="flex gap-2 text-nowrap">
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-xl text-nowrap text-sm border transition duration-300 outline-none focus:border-blue-500 hover:border-blue-300 cursor-pointer ${statusFilter === 'Completed' ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-slate-700 border-gray-300'}`}
                                    onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'all' : 'Completed')}
                                >
                                    {statusFilter === 'Completed' ? 'Completed' : 'Show Completed'}
                                </button>
                            </div>
                        </div>
                        <div className='flex items-center gap-6 mx-5'>
                            <input
                                type="text"
                                placeholder="Search Appointments"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-80 rounded-xl bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-gray-300 px-3 py-2 transition duration-300 ease-in-out focus:border-blue-500 hover:border-blue-300 outline-none"
                            />
                            <div className='border border-gray-200 rounded-sm p-1 hover:scale-110 transition-all duration-300'>
                                <DownloadButton 
                                    onDownload={handleExportCSV} 
                                    disabled={filteredData.length === 0} 
                                    loading={isExporting}
                                />
                            </div>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Patient
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mode
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Diagnosis
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        {statusFilter === 'Completed' ? 'No completed appointments found.' : 
                                         searchTerm || modeFilter !== 'all' || statusFilter !== 'all' ? 'No appointments found matching your filters.' : 'No appointments found.'}
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {/* Note: Appointments are sorted by most recent first */}
                                    {filteredData.map((appointment, index) => (
                                    <tr key={appointment?._id || index} className="hover:bg-blue-100 transition-colors duration-150 border-t border-gray-200">
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <div className="flex items-center">
                                                {getPatientProfileImage(appointment) ? (
                                                    <img
                                                        src={getPatientProfileImage(appointment)}
                                                        alt={getPatientName(appointment)}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <DoctorAvatar
                                                        name={getPatientName(appointment)}
                                                        id={index}
                                                    />
                                                )}
                                                <div className="ml-4 flex items-center gap-2">
                                                    <div className='flex flex-col'>
                                                    <Link to={`/profile/patient/${getPatientUserId(appointment)}`}>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {sentenceCase(getPatientName(appointment))}
                                                        </div>
                                                    </Link>
                                                    <div className="text-sm text-gray-500">
                                                        {getPatientTriage(appointment)}
                                                    </div>
                                                    </div>
                                                    {appointment?.consultationMode === 'tele-consultation' && 
                                                     appointment?.status !== 'Completed' && 
                                                     (userRole === 'doctor' || userRole === 'hybrid') && 
                                                     isAppointmentToday(appointment?.appointmentTime) && (
                                                        <button
                                                            onClick={() => handleStartTeleconsultation(appointment)}
                                                            className="p-1 rounded-full bg-green-100 hover:bg-green-200 transition-all duration-300 group"
                                                            title="Start Tele-consultation"
                                                        >
                                                            <Video className="w-4 h-4 text-green-600 group-hover:text-green-700 animate-pulse" />
                                                        </button>
                                                    )}
                                                </div>

                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(appointment?.appointmentTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatTime(appointment?.appointmentTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-sm w-40 text-center rounded-md inline-block ${appointment?.consultationMode === 'onsite'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {appointment?.consultationMode === 'onsite' ? 'On-site' : 'Tele-consultation'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-sm rounded-md w-24 text-center inline-block ${appointment?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                appointment?.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    appointment?.status === 'Follow Up' ? 'bg-blue-100 text-blue-800' :
                                                        appointment?.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {appointment?.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {appointment?.diagnosis ? sentenceCase(appointment.diagnosis) : "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ActionList
                                                item={appointment}
                                                actions={[
                                                    {
                                                        label: 'Edit',
                                                        icon: Edit,
                                                        onClick: () => handleEditAppointment(appointment),
                                                    },
                                                    {
                                                        label: 'Cancel Appointment',
                                                        icon: Trash2,
                                                        onClick: () => handleCancelAppointment(appointment?._id),
                                                        className: 'text-red-600 hover:bg-red-50',
                                                    },
                                                    // Only show EMR and E-Prescription actions for doctors and hybrid users
                                                    ...((userRole === 'doctor' || userRole === 'hybrid') ? [
                                                        {
                                                            label: 'Create EMR',
                                                            icon: ClipboardPlus,
                                                            onClick: () => handleRedirection(`/emr/${getPatientUserId(appointment)}`)
                                                        },
                                                        {
                                                            label: 'Create E-Prescription',
                                                            icon: FilePlus,
                                                            onClick: () => handleRedirection(`/prescription/${getPatientUserId(appointment)}`)
                                                        }
                                                    ] : [])
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditAppointmentPopup
                appointment={editPopup.appointment}
                isOpen={editPopup.isOpen}
                onClose={handleCloseEditPopup}
                onUpdate={handleUpdateAppointment}
            />
            <TeleConsultationModal
                isOpen={teleconsultationModal.isOpen}
                onClose={handleCloseTeleconsultationModal}
                appointment={teleconsultationModal.appointment}
                sessionData={teleconsultationModal.sessionData}
            />
        </>
    );
};

export default Appointments;
