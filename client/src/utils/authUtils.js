// Authentication utilities for token management and logout handling
import { withBasePath } from './basePath.js'

/**
 * Logout utility function that clears auth token and redirects to login
 */
export const performLogout = () => {
  // Clear the auth token from localStorage
  localStorage.removeItem('authtoken');
  
  // Dispatch custom event to notify UserProvider about auth change
  window.dispatchEvent(new Event('authChange'));
  
  // Redirect to login page
  window.location.href = withBasePath('/login')
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authtoken');
};

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('authtoken');
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token) => {
  localStorage.setItem('authtoken', token);
  // Dispatch custom event to notify UserProvider about auth change
  window.dispatchEvent(new Event('authChange'));
};
