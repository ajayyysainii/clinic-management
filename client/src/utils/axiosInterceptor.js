import axios from 'axios';
import { performLogout, getAuthToken } from './authUtils';

// Flag to prevent multiple logout calls
let isLoggingOut = false;

/**
 * Setup axios interceptors for automatic token handling and logout on expiry
 */
export const setupAxiosInterceptors = () => {
  // Request interceptor to add auth token to headers
  axios.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle 401 errors (token expiry)
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Check if error is due to unauthorized access (401)
      if (error.response && error.response.status === 401) {
        // Prevent multiple logout calls
        if (!isLoggingOut) {
          isLoggingOut = true;
          
          console.log('Token expired or invalid. Logging out...');
          
          // Perform logout after a small delay to prevent race conditions
          setTimeout(() => {
            performLogout();
            isLoggingOut = false;
          }, 100);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

/**
 * Remove axios interceptors (useful for cleanup)
 */
export const removeAxiosInterceptors = () => {
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
};
