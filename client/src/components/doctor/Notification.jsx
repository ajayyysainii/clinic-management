import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X, Calendar, Video, User, Clock } from 'lucide-react';
import axios from 'axios'
import {BACKEND_URL} from '../../utils/urlConstants'
import { useAuth } from '../../hooks/useAuth';

// Utility function to check if user should see clinic notifications
const shouldShowClinicNotifications = (user) => {
    if (!user || !user.data || !user.data.roles) {
        return false;
    }
    
    // Handle both array and string cases
    const roles = Array.isArray(user.data.roles) ? user.data.roles : [user.data.roles];
    
    return roles.some(role => 
        ['admin', 'clinic-admin', 'clinic-head'].includes(role)     
    );
};

const Notification = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { user } = useAuth();

    const fetchNotifications = useCallback(async () => {
        const hasValidClinicId = Boolean(user?.data?.clinic);

        try {
            setLoading(true);
            const token = localStorage.getItem('authtoken');
            
            // Check if user has a valid clinic ID before using clinic endpoint
            // Debug user data structure
            console.log('User object:', user);
            console.log('User data:', user?.data?.roles[0]);
            console.log('User roles type:', typeof user?.data?.roles);
            console.log('User roles value:', user?.data?.roles);
            console.log('User clinic ID:', user?.data?.clinic);
            console.log('User clinic ID type:', typeof user?.data?.clinic);
            console.log('Has valid clinic ID:', hasValidClinicId);
            
            // Determine which endpoint to use based on user role and clinic ID
            let endpoint = '/notifications/my-notifications';
            
            // Check if user is admin, clinic-admin, or clinic-head AND has valid clinic ID
            if (shouldShowClinicNotifications(user) && hasValidClinicId) {
                endpoint = '/notifications/clinic-notifications';
            }
            
            console.log('Attempting to fetch from endpoint:', endpoint);
            
            const response = await axios.get(
                `${BACKEND_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            setNotifications(response.data.data || []);
            console.log('Fetched notifications:', response.data.data);
            console.log('User roles:', user?.data?.roles);
            console.log('Endpoint used:', endpoint);
            console.log('Is clinic user:', shouldShowClinicNotifications(user));

            setError('');
        } catch (err) {
            console.error('Error fetching notifications:', err);
            
            // If clinic notifications fail and user is clinic user, try personal notifications
            if (shouldShowClinicNotifications(user) && hasValidClinicId && (err.response?.status === 400 || err.response?.status === 403)) {
                console.log('Clinic notifications failed, falling back to personal notifications');
                try {
                    const token = localStorage.getItem('authtoken');
                    const fallbackResponse = await axios.get(
                        `${BACKEND_URL}/notifications/my-notifications`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                    
                    setNotifications(fallbackResponse.data.data || []);
                    setError('Clinic notifications unavailable. Showing personal notifications.');
                    console.log('Fallback successful, showing personal notifications');
                } catch (fallbackErr) {
                    console.error('Fallback also failed:', fallbackErr);
                    setError('Failed to fetch notifications');
                }
            } else {
                setError('Failed to fetch notifications');
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    const markAsRead = async (notificationId) => {
        try {
            setError(''); // Clear any previous errors
            
            // Optimistically update UI
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                )
            );

            const token = localStorage.getItem('authtoken');
            
            // Check if user has a valid clinic ID before using clinic endpoint
            const hasValidClinicId = user?.data?.clinic && user.data.clinic !== '';
            
            // Use clinic endpoint only if user has valid clinic ID, otherwise fall back to personal
            const endpoint = (shouldShowClinicNotifications(user) && hasValidClinicId)
                ? '/notifications/clinic-mark-read'
                : '/notifications/mark-read';
            
            const requestBody = { notificationIds: [notificationId] };
            console.log('Marking notification as read:', notificationId, 'using endpoint:', endpoint);
            
            const response = await axios.put(
                `${BACKEND_URL}${endpoint}`,
                requestBody, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            
            console.log('Mark as read successful:', response.data);
        } catch (err) {
            console.error('Error marking notification as read:', err);
            
            // Check if it's a clinic ID error
            if (err.response?.data?.error?.includes('Invalid Clinic ID') || err.response?.data?.error?.includes('Clinic ID is missing')) {
                setError('Unable to mark clinic notification as read. Using personal notification instead.');
                console.log('Clinic ID error detected, falling back to personal notification');
                
                // Try to mark personal notification as read instead
                try {
                    const token = localStorage.getItem('authtoken');
                    const personalResponse = await axios.put(
                        `${BACKEND_URL}/notifications/mark-read`,
                        { notificationIds: [notificationId] },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            }
                        }
                    );
                    console.log('Personal notification marked as read successfully:', personalResponse.data);
                } catch (personalErr) {
                    console.error('Failed to mark personal notification as read:', personalErr);
                    setError('Failed to mark notification as read');
                }
            } else {
                setError('Failed to mark notification as read');
            }
            
            // Revert on error
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        try {
            // Check if there are any unread notifications
            const unreadCount = notifications.filter(n => !n.isRead).length;
            if (unreadCount === 0) {
                console.log('No unread notifications to mark as read');
                return;
            }
            
            setMarkingAllAsRead(true);
            setError(''); // Clear any previous errors
            
            // Optimistically update UI
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );

            const token = localStorage.getItem('authtoken');
            
            // Check if user has a valid clinic ID before using clinic endpoint
            const hasValidClinicId = user?.data?.clinic && user.data.clinic !== '';
            
            // Use clinic endpoint only if user has valid clinic ID, otherwise fall back to personal
            const endpoint = (shouldShowClinicNotifications(user) && hasValidClinicId)
                ? '/notifications/clinic-mark-read'
                : '/notifications/mark-read';
            
            // For clinic notifications, we need to send all unread notification IDs
            // For personal notifications, we can send empty body to mark all as read
            let requestBody = {};
            
            if (shouldShowClinicNotifications(user) && hasValidClinicId) {
                // Get all unread notification IDs for clinic notifications
                const unreadNotificationIds = notifications
                    .filter(notif => !notif.isRead)
                    .map(notif => notif._id);
                
                if (unreadNotificationIds.length === 0) {
                    console.log('No unread notifications to mark as read');
                    return;
                }
                
                requestBody = { notificationIds: unreadNotificationIds };
                console.log('Marking clinic notifications as read:', unreadNotificationIds);
            } else {
                console.log('Marking all personal notifications as read (no valid clinic ID or not clinic user)');
            }
            
            console.log('Sending request to:', `${BACKEND_URL}${endpoint}`);
            console.log('Request body:', requestBody);
            console.log('User roles:', user?.data?.roles);
            console.log('Is clinic user:', shouldShowClinicNotifications(user));
            console.log('User object:', user);
            console.log('User clinic ID:', user?.data?.clinic);
            console.log('User data structure:', user?.data);
            
            const response = await axios.put(
                `${BACKEND_URL}${endpoint}`,
                requestBody,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            
            console.log("Mark all as read successful:", response.data);
            
            // Show success message
            setSuccessMessage('All notifications marked as read successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
            
            // Refresh notifications to ensure consistency
            await fetchNotifications();
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            
            // Check if it's a clinic ID error
            if (err.response?.data?.error?.includes('Invalid Clinic ID') || err.response?.data?.error?.includes('Clinic ID is missing')) {
                setError('Unable to mark clinic notifications as read. Using personal notifications instead.');
                console.log('Clinic ID error detected, falling back to personal notifications');
                
                // Try to mark personal notifications as read instead
                try {
                    const token = localStorage.getItem('authtoken');
                    const personalResponse = await axios.put(
                        `${BACKEND_URL}/notifications/mark-read`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            }
                        }
                    );
                    console.log('Personal notifications marked as read successfully:', personalResponse.data);
                    setSuccessMessage('Personal notifications marked as read successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                } catch (personalErr) {
                    console.error('Failed to mark personal notifications as read:', personalErr);
                    setError('Failed to mark notifications as read');
                }
            } else {
                setError('Failed to mark notifications as read');
            }
            
            // Revert on error
            fetchNotifications();
        } finally {
            setMarkingAllAsRead(false);
        }
    };

    useEffect(() => {
        if (user && user.data) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment': return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'reminder': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'completed': return <Check className="w-4 h-4 text-green-500" />;
            case 'billing': return <span className="w-4 h-4 text-purple-500">💰</span>;
            case 'consent': return <span className="w-4 h-4 text-indigo-500">📋</span>;
            case 'system': return <span className="w-4 h-4 text-gray-500">⚙️</span>;
            default: return <User className="w-4 h-4 text-gray-500" />;
        }
    };

    const getModeIcon = (mode) => {
        switch (mode) {
            case 'Video Call': return <Video className="w-3 h-3" />;
            case 'Phone Call': return <span className="w-3 h-3 text-xs">📞</span>;
            default: return <User className="w-3 h-3" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const isClinicUser = shouldShowClinicNotifications(user) && (user?.data?.clinic && user.data.clinic !== '');
    const isFallbackMode = error && error.includes('Clinic notifications unavailable');

    // Don't render if user is not loaded yet
    if (!user || !user.data) {
        return null;
    }

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={toggleDropdown}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
            >
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white px-1">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </div>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 mt-3 w-72 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-top-2">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {isClinicUser ? 'Clinic Notifications' : 'Notifications'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                    </p>
                                    {isClinicUser && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {isFallbackMode 
                                                ? 'Showing personal notifications (clinic unavailable)'
                                                : (user?.data?.clinic && user.data.clinic !== '')
                                                ? 'Showing all clinic notifications'
                                                : 'Showing personal notifications (no clinic ID)'
                                            }
                                        </p>
                                    )}
                                    {successMessage && (
                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                            {successMessage}
                                        </p>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={markingAllAsRead}
                                        className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium ${
                                            markingAllAsRead 
                                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                        title={!(user?.data?.clinic && user.data.clinic !== '') ? 'Clinic ID not available - using personal notifications' : 'Mark all notifications as read'}
                                    >
                                        {markingAllAsRead ? 'Marking...' : 'Mark all read'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-500 mt-2">Loading notifications...</p>
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center">
                                    <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                    <p className="text-red-500 font-medium">{error}</p>
                                    <button
                                        onClick={fetchNotifications}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No notifications yet</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {isClinicUser 
                                            ? "We'll notify you when something happens in your clinic"
                                            : "We'll notify you when something happens"
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`p-4 hover:bg-gray-25 transition-colors group ${!notification.isRead ? 'bg-blue-25 border-l-2 border-l-blue-400' : ''
                                                }`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                {/* Icon */}
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className="font-medium text-gray-900 text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={() => markAsRead(notification._id)}
                                                                className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-all duration-200"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                        {notification.message}
                                                    </p>

                                                    {/* Meta info */}
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            {formatDate(notification.createdAt)}
                                                        </span>
                                                        {notification.metadata?.consultationMode && (
                                                            <div className="flex items-center space-x-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                                {getModeIcon(notification.metadata.consultationMode)}
                                                                <span className="ml-1">{notification.metadata.consultationMode}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                    View All Notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Notification;
