import { useState, useEffect } from "react";
import axios from "axios";
import { UserContext } from "./UserContext"; // Import from the separate file
import { BACKEND_URL } from "../utils/urlConstants";
import { getAuthToken } from "../utils/authUtils";

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            
            const res = await axios.get(BACKEND_URL+'/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUser(res.data);
        } catch (err) {
            console.error('Error fetching user:', err);
            // Don't handle 401 errors here - the axios interceptor will handle them
            // Just clear user state for any error
            if (err.response?.status !== 401) {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    // Listen for storage changes (when user logs in/out)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'authtoken') {
                if (e.newValue) {
                    // User logged in - fetch user data
                    fetchUser();
                } else {
                    // User logged out - clear user data
                    setUser(null);
                    setLoading(false);
                }
            }
        };

        // Listen for storage events
        window.addEventListener('storage', handleStorageChange);
        
        // Also listen for custom events (for same-tab login/logout)
        const handleAuthChange = () => {
            const token = getAuthToken();
            if (token) {
                fetchUser();
            } else {
                setUser(null);
                setLoading(false);
            }
        };

        window.addEventListener('authChange', handleAuthChange);

        // Initial fetch
        fetchUser();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authChange', handleAuthChange);
        };
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refetch: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
};