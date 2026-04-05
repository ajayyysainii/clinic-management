import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit } from 'lucide-react';
import { BACKEND_URL } from '../../utils/urlConstants';
import ActionList from '../ActionList';
import { useAuth } from '../../hooks/useAuth';
import SignatureConsent from './SignatureConsent'; // Import the new component

const ConsentList = () => {
  const { user } = useAuth();
  const userRole = user?.data?.roles?.[0]; // Get user role
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedConsentId, setSelectedConsentId] = useState(null);

  const fetchConsents = async () => {
    try {
      const token = localStorage.getItem('authtoken');
      const res = await axios.get(`${BACKEND_URL}/consent/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Consents fetched:', res.data); // Debug log
      setConsents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching consents:', err); // Debug log
      setError('Failed to fetch consent forms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && userRole) {
      fetchConsents();
    }
  }, [user, userRole]);

  if (loading) return <div className="p-8 text-center">Loading consents...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-100">{error}</div>;

  const isPatient = user?.data?.roles?.includes('patient');
  const isHybrid = userRole === 'hybrid';

  const handleView = (consentId, pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      alert(`No PDF available for consent: ${consentId}`);
    }
  };

  const handleUploadSign = (consentId) => {
    setSelectedConsentId(consentId);
    setShowSignatureModal(true);
  };
  
  const handleSigned = () => {
    fetchConsents(); // Refresh the list after signing
  };

  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {isHybrid ? 'My Consent Forms' : 'Consent Forms'}
      </h2>
      
      {consents.length === 0 ? (
        <div className="text-gray-500">
          {isHybrid ? 'No consent forms found where you are the assigned doctor.' : 'No consent forms found.'}
        </div>
      ) : (
        <div className="overflow-x-auto text-nowrap">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Consent Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {consents.map((consent) => {
                const actions = [];
                
                // Only show View button if pdfUrl exists
                if (consent.pdfUrl) {
                  actions.push({
                    label: 'View PDF',
                    icon: Edit,
                    onClick: () => handleView(consent._id, consent.pdfUrl),
                  });
                }
                
                // Only show upload signature option for patients
                if (isPatient && !consent.patientSignature?.signed) {
                  actions.push({
                    label: 'Upload Signature',
                    icon: Edit,
                    onClick: () => handleUploadSign(consent._id),
                  });
                }
                
                return (
                  <tr key={consent._id}>
                    <td className="px-4 py-2">{consent.procedureName}</td>
                    <td className="px-4 py-2">
                      {consent.patientId?.name || consent.patientId || 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      {consent.doctorId?.name || consent.doctorId || 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      {consent.consentDate ? new Date(consent.consentDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      {consent.patientSignature?.signed ? (
                        <span className="text-green-600 font-semibold">Signed</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionList
                        item={consent}
                        actions={actions}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showSignatureModal && (
        <SignatureConsent
          consentId={selectedConsentId}
          onClose={() => setShowSignatureModal(false)}
          onSigned={handleSigned}
        />
      )}
    </div>
  );
};

export default ConsentList; 