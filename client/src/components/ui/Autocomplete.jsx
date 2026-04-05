import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

const Autocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search...',
  className = '',
  disabled = false,
  searchEndpoint = '',
  searchParams = {},
  minQueryLength = 2,
  debounceMs = 300,
  maxResults = 10,
  renderOption = null,
  noResultsMessage = 'No items found',
  loadingMessage = 'Searching...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState('');
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Debounced search function
  const searchItems = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authtoken');
      const params = {
        query: searchQuery,
        limit: maxResults,
        ...searchParams,
      };

      const response = await axios.get(`${BACKEND_URL}${searchEndpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setSuggestions(response.data.data || []);
      } else {
        setError(response.data.error || 'Failed to fetch suggestions');
        setSuggestions([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query && query.length >= minQueryLength) {
      timeoutRef.current = setTimeout(() => {
        searchItems(query);
      }, debounceMs);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, searchEndpoint, searchParams, minQueryLength, debounceMs, maxResults]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange?.(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Handle option selection
  const handleSelectOption = (option) => {
    const displayName = option.serviceName || option.itemName || option.name || option;
    setQuery(displayName);
    onChange?.(displayName);
    onSelect?.(option);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectOption(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Default render option function
  const defaultRenderOption = (option) => (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{option.itemName}</div>
        {option.description && (
          <div className="text-sm text-gray-500">{option.description}</div>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">
          ₹{option.sellingPrice || option.costPrice || 0}
        </div>
        <div className="text-xs text-gray-500">
          Stock: {option.quantity} {option.unit}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : (
            <Search size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (suggestions.length > 0 || loading || error) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {loading && (
            <div className="p-3 text-center text-gray-500 text-sm">
              {loadingMessage}
            </div>
          )}

          {error && (
            <div className="p-3 text-center text-red-500 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && query.length >= minQueryLength && (
            <div className="p-3 text-center text-gray-500 text-sm">
              {noResultsMessage}
            </div>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <div className="py-1">
              {suggestions.map((option, index) => (
                <div
                  key={option._id || index}
                  onClick={() => handleSelectOption(option)}
                  className={`${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  {renderOption ? renderOption(option) : defaultRenderOption(option)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Autocomplete; 