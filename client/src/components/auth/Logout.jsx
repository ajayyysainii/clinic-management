import React from 'react';
import { performLogout } from '../../utils/authUtils';

const Logout = ({ onCancel }) => {
    const handleLogout = () => {
        performLogout();
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 rounded shadow-lg max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-4">Are you sure you want to logout?</h3>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={handleCancel}
                        className="cursor-pointer px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogout}
                        className="cursor-pointer px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Logout;