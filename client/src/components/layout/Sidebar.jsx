import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, ChevronLeft, Menu } from 'lucide-react';
import Logout from '../auth/Logout';
import { menuItems } from '../../utils/constants';
import { Link } from 'react-router';

const Sidebar = ({ userRole, isExpanded, setIsExpanded, isMobile }) => {
    const [activeItem, setActiveItem] = useState('');
    const [expandedSubmenus, setExpandedSubmenus] = useState({});
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Close sidebar on mobile when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobile && isExpanded) {
                const sidebar = document.getElementById('sidebar');
                const mobileToggle = document.getElementById('mobile-toggle');
                
                if (sidebar && !sidebar.contains(event.target) && 
                    mobileToggle && !mobileToggle.contains(event.target)) {
                    setIsExpanded(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile, isExpanded, setIsExpanded]);

    const filteredMenuItems = React.useMemo(() => {
        if (!userRole) return [];

        return menuItems
            .filter(item => item.roles.includes(userRole))
            .map(item => {
                if (!item.submenu) return item;

                return {
                    ...item,
                    submenu: item.submenu.filter(subItem => subItem.roles.includes(userRole))
                };
            })
            .filter(item => !item.submenu || item.submenu.length > 0);
    }, [userRole]);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
        if (isExpanded) {
            setExpandedSubmenus({});
        }
    };

    const toggleSubmenu = (itemId) => {
        // If sidebar is collapsed and we're on desktop, expand it first
        if (!isExpanded && !isMobile) {
            setIsExpanded(true);
        }
        
        setExpandedSubmenus(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleMenuClick = (itemId, hasSubmenu = false) => {
        if (hasSubmenu) {
            toggleSubmenu(itemId);
        } else if (itemId === "logout") {
            setShowLogoutConfirm(true);
        } else {
            setActiveItem(itemId);
            // Close sidebar on mobile after navigation
            if (isMobile) {
                setTimeout(() => setIsExpanded(false), 300);
            }
        }
    };

    const handleSubmenuClick = (itemId) => {
        setActiveItem(itemId);
        // Close sidebar on mobile after navigation
        if (isMobile) {
            setTimeout(() => setIsExpanded(false), 300);
        }
    };

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false);
    };

    // Don't render anything if no user role
    if (!userRole) {
        return null;
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            {isMobile && (
                <button
                    id="mobile-toggle"
                    onClick={toggleSidebar}
                    className="fixed top-4 left-4 z-50 p-2 bg-white shadow-lg rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} className="text-gray-700" />
                </button>
            )}

            {/* Mobile Overlay */}
            {isMobile && isExpanded && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {/* Sidebar */}
            <div
                id="sidebar"
                className={`
                    fixed top-0 left-0 h-screen bg-white shadow-xl border-r border-gray-200 
                    transition-all duration-300 ease-in-out z-50 flex flex-col
                    ${isMobile 
                        ? `${isExpanded ? 'translate-x-0' : '-translate-x-full'} w-72`
                        : `${isExpanded ? 'w-56' : 'w-16'}`
                    }
                `}
            >
                {/* Desktop Toggle Button */}
                {!isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-6 p-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}

                {/* Mobile Close Button */}
                {isMobile && isExpanded && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto pt-14 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="space-y-1 px-3">
                        {filteredMenuItems.map((item) => {
                            const IconComponent = item.icon;
                            const isActive = activeItem === item.id;
                            const hasSubmenu = item.submenu && item.submenu.length > 0;
                            const isSubmenuExpanded = expandedSubmenus[item.id];

                            return (
                                <div key={item.id}>
                                    {!hasSubmenu ? (
                                        <Link
                                            to={`/${item.id === '' ? '' : item.id}`}
                                            onClick={() => handleMenuClick(item.id)}
                                            className={`
                                                flex items-center px-3 py-3 rounded-lg transition-all duration-200
                                                ${isActive 
                                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <IconComponent 
                                                size={20} 
                                                className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                                            />
                                            {isExpanded && (
                                                <span className="ml-3 font-medium text-sm truncate">
                                                    {item.label}
                                                </span>
                                            )}
                                        </Link>
                                    ) : (
                                        <div>
                                            <button
                                                onClick={() => handleMenuClick(item.id, true)}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200
                                                    ${isActive 
                                                        ? 'bg-blue-50 text-blue-700' 
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center">
                                                    <IconComponent 
                                                        size={20} 
                                                        className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                                                    />
                                                    {isExpanded && (
                                                        <span className="ml-3 font-medium text-sm truncate">
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </div>
                                                {isExpanded && (
                                                    <ChevronDown
                                                        size={16}
                                                        className={`transition-transform duration-200 ${
                                                            isSubmenuExpanded ? 'rotate-180' : ''
                                                        }`}
                                                    />
                                                )}
                                            </button>

                                            {/* Submenu */}
                                            {isExpanded && (
                                                <div className={`
                                                    overflow-hidden transition-all duration-200 ease-in-out
                                                    ${isSubmenuExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                                                `}>
                                                    <div className="ml-6 mt-1 space-y-1">
                                                        {item.submenu.map((subItem) => {
                                                            const SubIconComponent = subItem.icon;
                                                            const isSubActive = activeItem === subItem.id;

                                                            return (
                                                                <Link
                                                                    key={subItem.id}
                                                                    to={`/${subItem.id}`}
                                                                    onClick={() => handleSubmenuClick(subItem.id)}
                                                                    className={`
                                                                        flex items-center px-3 py-2 rounded-lg transition-all duration-200
                                                                        ${isSubActive 
                                                                            ? 'bg-blue-50 text-blue-700' 
                                                                            : 'text-gray-600 hover:bg-gray-50'
                                                                        }
                                                                    `}
                                                                >
                                                                    <SubIconComponent 
                                                                        size={16} 
                                                                        className={`flex-shrink-0 ${isSubActive ? 'text-blue-600' : 'text-gray-400'}`}
                                                                    />
                                                                    <span className="ml-3 font-medium text-sm truncate">
                                                                        {subItem.label}
                                                                    </span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout Confirmation */}
                <div className="flex-shrink-0">
                    {showLogoutConfirm && (
                        <Logout onCancel={handleLogoutCancel} />
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
