import { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, Search, User, Mail, Phone, GraduationCap, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom'
import axios from "axios";
import { BACKEND_URL } from '../../utils/urlConstants';
import { useNavigate } from 'react-router';
import StaffRegisterationForm from './StaffRegisterationForm';
import StaffPayoutForm from './StaffPayoutForm';

const StaffList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [showPayoutForm, setShowPayoutForm] = useState(false);
    const [selectedPayoutStaff, setSelectedPayoutStaff] = useState(null);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("authtoken");
                const response = await axios.get(`${BACKEND_URL}/staff`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setData(response.data.data || response.data);
                setError(null);
            } catch (error) {
                setError("Failed to fetch staff data" + error);
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const filteredStaff = data.filter((staff) => {
        const name = staff.user_id?.name?.toLowerCase() || "";
        const email = staff.user_id?.email?.toLowerCase() || "";
        const phone = staff.user_id?.phone?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return (
            name.includes(query) ||
            email.includes(query) ||
            phone.includes(query)
        );
    });

    const handleDelete = async (staffId) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;
        try {
            const token = localStorage.getItem('authtoken');
            await axios.delete(`${BACKEND_URL}/staff/${staffId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(prev => prev.filter(staff => staff._id !== staffId));
        } catch (error) {
            alert('Failed to delete staff. Please try again.'+error);
        }
    };

    const handleEditStaff = (staff) => {
        setSelectedStaff(staff);
        setIsEditMode(true);
        setShowFormModal(true);
    };

    const handleAddSalaryConfig = (staff) => {
        setSelectedPayoutStaff(staff);
        setShowPayoutForm(true);
    };

    if (loading) {
        return (
            <div className="min-h-[400px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600 font-medium">Loading staff...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                <div className="flex flex-col items-center justify-center h-96">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {showFormModal && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <StaffRegisterationForm
                            staff={selectedStaff}
                            isEditMode={isEditMode}
                            onClose={() => {
                                setShowFormModal(false);
                                setSelectedStaff(null);
                                setIsEditMode(false);
                            }}
                            onSuccess={() => {
                                setShowFormModal(false);
                                setSelectedStaff(null);
                                setIsEditMode(false);
                                // Optionally refresh list here
                            }}
                        />
                    </div>
                </div>
            )}
            {showPayoutForm && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <StaffPayoutForm
                            staffId={selectedPayoutStaff._id}
                            onClose={() => {
                                setShowPayoutForm(false);
                                setSelectedPayoutStaff(null);
                            }}
                            onSuccess={() => {
                                setShowPayoutForm(false);
                                setSelectedPayoutStaff(null);
                                // Optionally refresh list here
                            }}
                        />
                    </div>
                </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <Link to="/staffs">
                            <button
                                className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                onClick={() => navigate("/add-staff")}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add New Staff
                            </button>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-6 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Stats Section */}
                <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Total Staff: <span className="font-semibold text-gray-900">{data.length}</span>
                        </p>
                        {searchQuery && (
                            <p className="text-sm text-gray-600">
                                Showing: <span className="font-semibold text-gray-900">{filteredStaff.length}</span> results
                            </p>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Staff Member
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Qualifications
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Contact Information
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredStaff.map((staff, index) => (
                                <tr
                                    key={staff._id}
                                    className="hover:bg-blue-50 transition-colors duration-200 group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center">
                                            <div className="relative">
                                                <img
                                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200"
                                                    src={staff.user_id.profileImageUrl || '/api/placeholder/48/48'}
                                                    alt={staff.user_id.name}
                                                    onError={(e) => {
                                                        e.target.src = '/api/placeholder/48/48';
                                                    }}
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                                                    {staff.user_id.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6">
                                        <div className="space-y-1">
                                            {staff.degrees && staff.degrees.length > 0 ? (
                                                staff.degrees.map((deg, i) => (
                                                    <div key={i} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-1 mb-1">
                                                        <GraduationCap className="w-3 h-3 mr-1" />
                                                        {deg.name}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                                    No qualifications listed
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                                {staff.user_id.email}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-700">
                                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                                {staff.user_id.phone}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                                onClick={() => handleEditStaff(staff)}
                                                title="Edit Staff"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="inline-flex items-center p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                                onClick={() => handleAddSalaryConfig(staff)}
                                                title="Add Salary Config"
                                            >
                                                <IndianRupee size={16} />
                                            </button>
                                            <button
                                                className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                                onClick={() => handleDelete(staff._id)}
                                                title="Delete Staff"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {filteredStaff.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                                <User className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchQuery ? 'No staff found' : 'No staff members yet'}
                            </h3>
                            <p className="text-gray-500 text-center max-w-sm mb-6">
                                {searchQuery
                                    ? 'Try adjusting your search criteria to find what you\'re looking for.'
                                    : 'Get started by adding your first staff member to your team.'
                                }
                            </p>
                            {!searchQuery && (
                                <Link to="/staffs">
                                    <button
                                        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200"
                                        onClick={() => navigate("/add-staff")}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Staff Member
                                    </button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {filteredStaff.length > 0 && (
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Showing {filteredStaff.length} of {data.length} staff members</span>
                            <span>Last updated: {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
};

export default StaffList;
