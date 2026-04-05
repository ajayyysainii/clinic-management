import { ArrowBigRight, ArrowBigLeft, ArrowBigRightDash } from 'lucide-react';
import Availability from './ui/Availability';
import { useEffect, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import axios from "axios"
import ActionList from './ActionList';
import DoctorAvatar from './ui/DoctorAvatar';
import DownloadButton from './ui/DownloadButton';
import DoctorRegisterationForm from './doctor/DoctorRegisterationForm';
import { BACKEND_URL } from '../utils/urlConstants';
import DoctorPayoutForm from './doctor/DoctorPayoutForm';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { exportToCSV, formatDoctorDataForCSV } from '../utils/csvExport';

const StatusBadge = ({ status }) => {
    const isActive = status === 'Active';
    return (
        <span
            className={`inline-flex w-[80px] items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-orange-100 text-orange-800 border border-orange-200'
                }`}
        >
            {status}
        </span>
    );
};


const DoctorList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Added limit state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
    });

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [showPayoutForm, setShowPayoutForm] = useState(false);
    const [selectedPayoutDoctor, setSelectedPayoutDoctor] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    const navigate = useNavigate();

    const handleUpdateDoctor = (doctor) => {
        setSelectedDoctor(doctor);
        setIsEditMode(true);
        setShowFormModal(true);
    };

    const handleDeleteDoctor = async (doctor) => {
        if (window.confirm(`Are you sure you want to delete Dr. ${doctor.user_id.name}?`)) {
            try {
                const token = localStorage.getItem("authtoken");
                await axios.delete(`${BACKEND_URL}/doctors/delete/${doctor._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setPageNumber(1);
                console.log('Doctor deleted successfully');
            } catch (error) {
                console.error('Error deleting doctor:', error);
                alert('Failed to delete doctor. Please try again.');
            }
        }
    };

    const handleAddPayoutConfig = (doctor) => {
        setSelectedPayoutDoctor(doctor);
        console.log(doctor)
        console.log(doctor.user_id._id)
        setShowPayoutForm(true);
    };

    const handleNext = () => {
        if (pagination.hasNext) {
            setPageNumber(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (pagination.hasPrev) {
            setPageNumber(prev => prev - 1);
        }
    };

    // Handle items per page change
    const handleItemsPerPageChange = (newLimit) => {
        setItemsPerPage(newLimit);
        setPageNumber(1); // Reset to first page when changing limit
    };

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("authtoken");
                const response = await axios.get(`${BACKEND_URL}/doctors/list?page=${pageNumber}&limit=${itemsPerPage}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setData(response.data.doctors || response.data);
                console.log(response.data.doctors)
                setPagination(response.data.pagination || {
                    currentPage: pageNumber,
                    totalPages: 1,
                    totalCount: response.data.length,
                    hasNext: false,
                    hasPrev: pageNumber > 1
                });

                console.log(response.data);
                setError(null);
            } catch (error) {
                console.error("Error fetching doctors:", error);
                setError("Failed to fetch doctors data");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, [pageNumber, itemsPerPage]); // Added itemsPerPage to dependency array

    // Helper function to calculate total available slots
    const getTotalAvailableSlots = (availability) => {
        if (!availability || !Array.isArray(availability)) return 0;
        return availability.reduce((total, day) => {
            return total + (day.slots ? day.slots.length : 0);
        }, 0);
    };

    // Helper function to determine doctor status based on availability
    const getDoctorStatus = (availability) => {
        const totalSlots = getTotalAvailableSlots(availability);
        return totalSlots > 0 ? 'Active' : 'On Leave';
    };



    // Helper function to filter doctors by search query
    const filteredDoctors = data.filter((doctor) => {
        const name = doctor.user_id?.name?.toLowerCase() || "";
        const email = doctor.user_id?.email?.toLowerCase() || "";
        const specialties = (doctor.specializations || []).join(", ").toLowerCase();
        const query = searchQuery.toLowerCase();
        return (
            name.includes(query) ||
            email.includes(query) ||
            specialties.includes(query)
        );
    });

    const handleExportToCSV = async () => {
        if (data.length === 0) {
            alert('No doctors to export');
            return;
        }
        
        setIsExporting(true);
        try {
            const formattedData = formatDoctorDataForCSV(data);
            const headers = ['Name', 'Specialty', 'Email', 'Phone', 'Status'];
            exportToCSV(formattedData, 'doctors', headers);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading doctors...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-500">{error}</div>
                </div>
            </div>
        );
    }
    return (
        <>
            {showFormModal && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <DoctorRegisterationForm
                            doctor={selectedDoctor}
                            isEditMode={isEditMode}
                            onClose={() => {
                                setShowFormModal(false);
                                setSelectedDoctor(null);
                                setIsEditMode(false);
                            }}
                            onSuccess={() => {
                                setShowFormModal(false);
                                setSelectedDoctor(null);
                                setIsEditMode(false);
                                setPageNumber(1); // Refresh the list
                            }}
                        />
                    </div>
                </div>
            )}
            {showPayoutForm && selectedPayoutDoctor && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <DoctorPayoutForm
                            doctorId={selectedPayoutDoctor.user_id._id}
                            onClose={() => {
                                setShowPayoutForm(false);
                                setSelectedPayoutDoctor(null);
                            }}
                            onSuccess={() => {
                                setShowPayoutForm(false);
                                setSelectedPayoutDoctor(null);
                            }}
                        />
                    </div>
                </div>
            )}
            <div className="bg-white relative text-nowrap rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <div className='h-16 flex items-center justify-between px-10'>
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl  font-semibold text-gray-800">My Doctor List</h2>
                            <button
                                className="bg-[#0096f2] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors duration-200"
                                onClick={() => {
                                    navigate("/add-doctor");
                                }}
                            >
                                + Add Doctor
                            </button>
                        </div>
                        {/* Right: Search and Download */}
                        <div className="mx-10 flex items-center space-x-3">
                            <input
                                type="text"
                                placeholder="Search Doctors"
                                className="w-64 rounded-xl bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border  px-3 py-2 transition duration-300 border-blue-300 ease-in-out focus:border-blue-600 hover:border-blue-400 outline-none"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <div className='border border-gray-200 rounded-sm p-1 hover:scale-110 transition-all duration-300'>
                                <DownloadButton onDownload={handleExportToCSV} loading={isExporting} />
                            </div>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Specialty
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Availability
                                </th>
                                
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDoctors.map((doctor) => (
                                <tr key={doctor._id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className='rounded-full inline-flex w-[50px] h-[50px] object-fill items-center justify-center' src={doctor.user_id.profileImageUrl} alt={doctor.user_id.name} />
                                            <div className="ml-4">
                                            <Link to ={`/profile/doctor/${doctor?.user_id._id}`}>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {doctor.user_id.name}
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {doctor.specializations && doctor.specializations.length > 0
                                                ? doctor.specializations.join(', ')
                                                : 'General Practice'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Availability availability={doctor.availability} />
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-gray-900">{doctor.user_id.email}</div>
                                        <div className="text-xs text-gray-500">{doctor.user_id.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={getDoctorStatus(doctor.availability)} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ActionList
                                            item={doctor} // The item these actions will act upon
                                            actions={[
                                                {
                                                    label: 'Edit',
                                                    icon: Edit,
                                                    onClick: () => handleUpdateDoctor(doctor),
                                                },
                                                {
                                                    label: 'Add Payout Details',
                                                    icon: Edit, // or any icon you prefer
                                                    onClick: () => handleAddPayoutConfig(doctor),
                                                },
                                                {
                                                    label: 'Delete',
                                                    icon: Trash2,
                                                    onClick: () => handleDeleteDoctor(doctor),
                                                    className: 'text-red-600 hover:bg-red-50',
                                                },

                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredDoctors.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            No doctors found
                        </div>
                    )}
                </div>

                {/* Enhanced Pagination Controls */}
                <div className='flex items-center justify-between pt-4 px-6'>
                    <div className='flex items-center space-x-4'>
                        <button
                            onClick={handlePrev}
                            disabled={!pagination.hasPrev}
                            className={`border border-gray-200 rounded-sm p-2 transition-all duration-300 ${pagination.hasPrev
                                ? 'hover:scale-110 cursor-pointer hover:bg-gray-50'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <ArrowBigLeft
                                color={pagination.hasPrev ? '#9EA1C0' : '#D1D5DB'}
                                size={20}
                            />
                        </button>

                        <span className="text-sm text-gray-600">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>

                        <button
                            onClick={handleNext}
                            disabled={!pagination.hasNext}
                            className={`border border-gray-200 rounded-sm p-2 transition-all duration-300 ${pagination.hasNext
                                ? 'hover:scale-110 cursor-pointer hover:bg-gray-50'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <ArrowBigRight
                                color={pagination.hasNext ? '#9EA1C0' : '#D1D5DB'}
                                size={20}
                            />
                        </button>
                    </div>

                    {/* Items per page selector */}
                    <div className='flex items-center space-x-2'>
                        <span className="text-sm text-gray-600">Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-600">entries</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DoctorList;