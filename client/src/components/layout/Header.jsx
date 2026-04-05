import { Menu, Search, User, Power, Plus, MoreVertical } from "lucide-react";
import Notification from "../doctor/Notification";
import { useAuth } from '../../hooks/useAuth'
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from "../../utils/urlConstants";
import { useNavigate, Link } from 'react-router-dom'; // Fixed import
import { getAuthToken } from '../../utils/authUtils';
import Logout from '../auth/Logout';
import AddAppointment from '../appointment/AddAppointment';

const Header = () => {
    const { user } = useAuth();
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const searchRef = useRef(null);
    const debounceTimeout = useRef(null);
    // New state for contextual menus
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState(null);
    const navigate = useNavigate();

    // Debug selectedUser changes
    useEffect(() => {
        if (selectedUser) {
            console.log('selectedUser state changed to:', selectedUser);
            console.log('selectedUser.roles:', selectedUser.roles);
        }
    }, [selectedUser]);

    // Debug appointment modal state changes
    useEffect(() => {
        console.log('showAppointmentModal changed to:', showAppointmentModal);
        console.log('selectedPatientForAppointment:', selectedPatientForAppointment);
    }, [showAppointmentModal, selectedPatientForAppointment]);

    // Click-away handler - Fixed logic
    useEffect(() => {
        function handleClickOutside(event) {
            // Only close if clicking outside the search container
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
                setSearchTerm("");
                setSearchResult(null);
                setError("");
            }

            // Don't automatically close the user menu - let buttons handle it
            // This prevents the popup from closing before button clicks are processed
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu, showAddMenu]);

    // Search handler - Added cleanup
    useEffect(() => {
        if (!showSearch) {
            setSearchTerm("");
            setSearchResult(null);
            setError("");
            setLoading(false);
            return;
        }

        if (searchTerm.trim() === "") {
            setSearchResult(null);
            setError("");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        const token = getAuthToken();
        const headers = {
            Authorization: `Bearer ${token}`,
        };

        debounceTimeout.current = setTimeout(() => {
            axios.get(`${BACKEND_URL}/users/search-by-mobile?q=${encodeURIComponent(searchTerm)}`, { headers })
                .then((res) => {
                    console.log('Search results:', res.data.data);
                    console.log('First result structure:', res.data.data[0]);
                    setSearchResult(res.data.data);
                    setError("");
                })
                .catch(() => {
                    setSearchResult(null);
                    setError('Not found');
                })
                .finally(() => setLoading(false));
        }, 500);

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [searchTerm, showSearch]);

    // Navigation handlers
    const handleAddDoctor = () => {
        setShowAddMenu(false);
        setShowSearch(false);
        navigate('add-doctor');
    };

    const handleAddPatient = () => {
        setShowAddMenu(false);
        setShowSearch(false);
        navigate('add-patient');
    };

    const handleUserClick = (searchUser) => {
        console.log('handleUserClick called with:', searchUser);
        if (searchUser.roles && searchUser.roles.includes('doctor')) {
            setShowSearch(false);
            navigate(`profile/doctor/${searchUser._id}`);
        } else if (searchUser.roles && searchUser.roles.includes('patient')) {
            setShowSearch(false);
            navigate(`profile/patient/${searchUser._id}`);
        }
    };

    const handleCreateAppointment = (patientId) => {
        console.log('handleCreateAppointment called with patientId:', patientId);
        console.log('selectedUser:', selectedUser);
        
        // Validate that we have the patient data
        if (!selectedUser || selectedUser._id !== patientId) {
            console.error('Invalid patient data for appointment creation');
            alert('Unable to create appointment: Patient data not available');
            return;
        }
        
        // Close the user menu and search
        setShowUserMenu(false);
        setShowSearch(false);
        
        // Set the patient data and show the modal
        setSelectedPatientForAppointment(selectedUser);
        setShowAppointmentModal(true);
        
        console.log('Opening appointment modal for patient:', selectedUser);
    };

    const handleVisitProfile = (patientId) => {
        console.log('handleVisitProfile called with patientId:', patientId);
        setShowUserMenu(false);
        setShowSearch(false);
        navigate(`profile/patient/${patientId}`);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 px-4 flex items-center justify-between">
            {/* Mobile Header */}
            <div className="flex w-full items-center justify-between sm:hidden">
                <button className="p-2 rounded-md hover:bg-gray-100 focus:outline-none">
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Notification />
                    </div>
                    <div className="relative">
                        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
                            {user?.data?.profileImageUrl ? (
                                <img
                                    className="w-8 h-8 rounded-full object-cover"
                                    src={user?.data?.profileImageUrl}
                                    alt={user?.data?.name || "User"}
                                />
                            ) : (
                                <User className="w-4 h-4 text-gray-600" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="w-full sm:flex hidden flex-1 justify-between items-center gap-4">
                {/* Search Section */}
                <div className="flex-1 flex justify-end">
                    {!showSearch ? (
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                            onClick={() => setShowSearch(true)}
                            aria-label="Show search"
                        >
                            <Search className="w-5 h-5 text-gray-600" />
                        </button>
                    ) : (
                        <div
                            ref={searchRef}
                            className="flex flex-col w-full max-w-md border rounded-xl border-gray-400 transition-all duration-300 ease-in-out bg-white items-stretch relative"
                        >
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    placeholder="Search by Name, Email, or Phone"
                                    className="w-full bg-transparent text-right placeholder:text-slate-400 text-slate-700 text-sm px-3 py-2 outline-none"
                                    autoFocus
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <button
                                    className="p-2 hover:bg-gray-100 focus:outline-none rounded-r-xl"
                                    onClick={() => setShowSearch(false)}
                                    aria-label="Close search"
                                >
                                    <Search className="w-4 h-4 text-[#0096f2]" />
                                </button>
                            </div>

                            {/* Search Results Dropdown */}
                            {(loading || error || (searchResult && searchResult.length >= 0)) && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-xl shadow-lg z-50 mt-1">
                                    {loading && (
                                        <div className="p-4 text-sm text-gray-500 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                                                Searching...
                                            </div>
                                        </div>
                                    )}

                                    {/* Show Add menu when no results found */}
                                    {!loading && ((error) || (Array.isArray(searchResult) && searchResult.length === 0)) && (
                                        <div className="p-4 text-sm text-gray-500 text-center bg-gray-50 border-l-4 border-blue-400 flex flex-col items-center gap-4">
                                            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                                                <button
                                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                                    onClick={handleAddDoctor}
                                                >
                                                    <User className="w-4 h-4" /> Add Doctor
                                                </button>
                                                <button
                                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                                    onClick={handleAddPatient}
                                                >
                                                    <User className="w-4 h-4" /> Add Patient
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show search results - Only patients and doctors */}
                                    {!loading && searchResult && Array.isArray(searchResult) && searchResult.length > 0 && (
                                        <div className="max-h-64 overflow-y-auto">
                                            <ul className="divide-y divide-gray-100">
                                                {searchResult
                                                    .filter(searchUser => 
                                                        searchUser.roles && 
                                                        (searchUser.roles.includes('doctor') || searchUser.roles.includes('patient'))
                                                    )
                                                    .map((searchUser, idx) => {
                                                        const tag = searchUser.roles?.includes('doctor') ? 'Doctor'
                                                            : searchUser.roles?.includes('patient') ? 'Patient' : '';

                                                        return (
                                                            <li
                                                                key={searchUser._id || idx}
                                                                className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 hover:shadow-sm relative"
                                                            >
                                                            <div className="flex items-center gap-4">
                                                                {/* Main clickable area for profile navigation */}
                                                                <div
                                                                    className="flex items-center gap-4 flex-1 cursor-pointer"
                                                                    onClick={() => handleUserClick(searchUser)}
                                                                >
                                                                    <div className="relative">
                                                                        <img
                                                                            src={searchUser.profileImageUrl || '/default-avatar.png'}
                                                                            alt={searchUser.name || 'User'}
                                                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                                                                                {searchUser.name || 'N/A'}
                                                                            </h3>
                                                                            {tag && (
                                                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${tag === 'Doctor' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                                                    }`}>
                                                                                    {tag}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                            <span className="font-medium">{searchUser.phone || 'N/A'}</span>
                                                                            {searchUser.email && (
                                                                                <span className="truncate">{searchUser.email}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Actions menu button */}
                                                                <button
                                                                    className="p-2 hover:bg-blue-100 rounded-full transition-colors focus:outline-none"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        console.log('Three-dot menu clicked for user:', searchUser);
                                                                        setSelectedUser(searchUser);
                                                                        setShowUserMenu(true);
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setPopupPosition({
                                                                            top: rect.bottom + window.scrollY,
                                                                            left: rect.left + window.scrollX
                                                                        });
                                                                    }}
                                                                    aria-label="Show actions"
                                                                >
                                                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                                                </button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Notification - Single instance */}
                <div className="relative">
                    <Notification />
                </div>

                {/* User Profile Section */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 rounded-lg p-2 cursor-pointer group">
                        {/* User Info */}
                        <div className="flex flex-col text-right">
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                {user?.data?.name || " "}
                            </p>
                            <p className="text-xs font-semibold text-gray-500 leading-tight">
                                {user?.data?.email || " "}
                            </p>
                        </div>

                        {/* User Avatar */}
                        <div className="relative">
                            {user?.data?.profileImageUrl ? (
                                <img
                                    className="w-10 h-10 rounded-full object-cover"
                                    src={user?.data?.profileImageUrl}
                                    alt={user?.data?.name || "User"}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-200 flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                            )}
                        </div>

                        {/* Clinic Logo */}
                        <div className="relative">
                            {user?.data?.clinic?.logo ? (
                                <img
                                    className="w-10 h-10 rounded-full object-cover"
                                    src={user?.data?.clinic?.logo}
                                    alt={user?.data?.clinic?.name || "Clinic"}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-gray-200 group-hover:border-blue-300 transition-colors duration-200 flex items-center justify-center">
                                    <User className="w-5 h-5 text-red-300" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logout Button */}
                    <div className="relative mr-12">
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none group"
                            aria-label="Logout"
                            onClick={() => setShowLogoutConfirm(true)}
                        >
                            <Power className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors cursor-pointer" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating User Action Popup */}
            {showUserMenu && selectedUser && (
                <div
                    data-popup="user-menu"
                    style={{
                        position: 'fixed',
                        top: popupPosition.top + 4,
                        left: popupPosition.left,
                        zIndex: 9999,
                        minWidth: 200,
                        backgroundColor: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                        overflow: 'hidden'
                    }}
                    className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {console.log('Rendering popup with selectedUser:', selectedUser)}
                    {console.log('selectedUser.roles:', selectedUser.roles)}
                    {console.log('Is doctor?', selectedUser.roles && selectedUser.roles.includes('doctor'))}
                    {console.log('Is patient?', selectedUser.roles && selectedUser.roles.includes('patient'))}
                
                    {selectedUser.roles && selectedUser.roles.includes('doctor') ? (
                        <>
                            <button
                                className="w-full px-4 py-3 hover:bg-blue-50 text-left transition-colors bg-blue-50 hover:bg-blue-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Visit Profile clicked for doctor:', selectedUser);
                                    setShowUserMenu(false);
                                    navigate(`profile/doctor/${selectedUser._id}`);
                                }}
                            >
                                👤 Visit Profile
                            </button>
                        </>
                    ) : selectedUser.roles && selectedUser.roles.includes('patient') ? (
                        <>
                            <button
                                className="w-full px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-100 bg-green-50 hover:bg-green-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Create Appointment clicked for patient:', selectedUser);
                                    console.log('About to call handleCreateAppointment with:', selectedUser._id);
                                    handleCreateAppointment(selectedUser._id);
                                }}
                            >
                                🗓️ Create Appointment
                            </button>
                            <button
                                className="w-full px-4 py-3 hover:bg-blue-50 text-left transition-colors bg-blue-50 hover:bg-blue-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Visit Profile clicked for patient:', selectedUser);
                                    console.log('About to call handleVisitProfile with:', selectedUser._id);
                                    handleVisitProfile(selectedUser._id);
                                }}
                            >
                                👤 Visit Profile
                            </button>
                        </>
                    ) : (
                        <div className="p-4 text-gray-500 text-center">
                            <p>No actions available for this user type</p>
                            <p className="text-xs mt-1">Roles: {JSON.stringify(selectedUser.roles)}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Logout Confirmation */}
            {showLogoutConfirm && (
                <Logout onCancel={() => setShowLogoutConfirm(false)} />
            )}

            {/* Create Appointment Modal */}
            {showAppointmentModal && selectedPatientForAppointment && (
                <>
                    {/* Backdrop with blur effect */}
                    <div 
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={() => {
                            console.log('Backdrop clicked, closing modal');
                            setShowAppointmentModal(false);
                            setSelectedPatientForAppointment(null);
                        }}
                    />
                    
                    {/* Modal content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {console.log('Rendering appointment modal with patient:', selectedPatientForAppointment)}
                        <AddAppointment
                            patient={selectedPatientForAppointment}
                            onClose={() => {
                                console.log('Closing appointment modal');
                                setShowAppointmentModal(false);
                                setSelectedPatientForAppointment(null);
                            }}
                            onSuccess={() => {
                                console.log('Appointment created successfully');
                                setShowAppointmentModal(false);
                                setSelectedPatientForAppointment(null);
                                // Optionally show a success message or refresh data
                            }}
                        />
                    </div>
                </>
            )}
        </header>
    );
};

export default Header;
