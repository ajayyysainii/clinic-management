import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

const SignatureConsent = ({ consentId, onClose, onSigned }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeSignature = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const saveSignature = async () => {
    if (!selectedFile) {
      setError('Please select a signature image to upload.');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('signatureImage', selectedFile);

    try {
      const token = localStorage.getItem('authtoken');
      await axios.put(`${BACKEND_URL}/api/consent/${consentId}/sign`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Signature uploaded successfully!');
      onSigned(); // Callback to refresh or update UI
      onClose(); // Close the modal
    } catch {
      setError('Failed to upload signature. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold">Upload Your Signature</h2>
        <p className='text-xs'>Uploading a signature confirms your consent</p>
        
        {!preview ? (
          <div className="mt-4">
            <label htmlFor="signature-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Select an image file for your signature.
            </label>
            <input
              id="signature-upload"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>
        ) : (
          <div className="mt-4 text-center">
            <img src={preview} alt="Signature Preview" className="max-h-48 mx-auto border rounded-md" />
            <button onClick={removeSignature} className="mt-2 text-sm text-red-600 hover:underline">
              Remove Signature
            </button>
          </div>
        )}
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 mr-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={saveSignature} 
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]" 
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Signature'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureConsent; 