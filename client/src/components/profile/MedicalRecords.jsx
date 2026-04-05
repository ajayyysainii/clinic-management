import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FileText, FilePlus, FlaskConical, BarChart2, ImageIcon, FileSymlink } from 'lucide-react';
import { BACKEND_URL } from '../../utils/urlConstants';

const TABS = [
    { label: 'EMR', icon: FileText },
    { label: 'E-PRESCRIPTION', icon: FilePlus },
    { label: 'LAB REPORTS', icon: FlaskConical },
    { label: 'REPORTS', icon: BarChart2 },
    { label: 'IMAGES', icon: ImageIcon },
];

const MedicalRecords = ({ userId }) => {
    const [activeTab, setActiveTab] = useState('EMR');
    const [allEMRs, setAllEMRs] = useState([]);
    const [allEPrescriptions, setAllEPrescriptions] = useState([]);
    const [allImages, setAllImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEPrescriptions, setIsLoadingEPrescriptions] = useState(false);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (endpoint, setData, setIsLoadingState) => {
        try {
            setIsLoadingState(true);
            setError(null);
            const token = localStorage.getItem('authtoken');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Handle endpoints that don't require userId parameter
            const url = endpoint.includes('/user/') 
                ? `${BACKEND_URL}/${endpoint}`
                : `${BACKEND_URL}/${endpoint}/${userId}`;

            console.log(`Making request to: ${url}`);

            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(`Fetched ${endpoint} data:`, response.data.data)

            if (response.data && response.data.data) {
                setData(Array.isArray(response.data.data) ? response.data.data : [response.data.data]);
            } else {
                setData([]);
            }
        } catch (err) {
            console.error(`Error fetching ${endpoint} data:`, err);
            setError(`Failed to load ${endpoint} data. Please try again.`);
            setData([]);
        } finally {
            setIsLoadingState(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData('emr', setAllEMRs, setIsLoading);
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === 'E-PRESCRIPTION' && allEPrescriptions.length === 0) {
            fetchData('prescription', setAllEPrescriptions, setIsLoadingEPrescriptions);
        }
    }, [activeTab, allEPrescriptions.length, fetchData]);

    useEffect(() => {
        if (activeTab === 'IMAGES' && allImages.length === 0) {
            fetchData('prescription/images', setAllImages, setIsLoadingImages);
        }
    }, [activeTab, allImages.length, fetchData]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
        } catch {
            return '-';
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? '-' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '-';
        }
    };

    const renderTabContent = () => {
        if (error) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-red-500">
                    {error}
                </div>
            );
        }

        switch (activeTab) {
            case 'EMR':
                return (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speciality</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMR Link</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">Loading EMRs...</td>
                                    </tr>
                                ) : allEMRs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">No EMR records found</td>
                                    </tr>
                                ) : (
                                    allEMRs.map((emr) => (
                                        <tr key={emr._id || emr.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {emr.doctor?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatDate(emr.createdAt)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatTime(emr.createdAt)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{emr.doctor?.specialization || 'General'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {emr.emrPdfFileUrl ? (
                                                    <a href={emr.emrPdfFileUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileSymlink className="w-5 h-5 text-blue-500 hover:text-blue-700" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">No PDF</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            case 'E-PRESCRIPTION':
                return (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speciality</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription Link</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingEPrescriptions ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">Loading E-Prescriptions...</td>
                                    </tr>
                                ) : allEPrescriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">No E-Prescription records found</td>
                                    </tr>
                                ) : (
                                    allEPrescriptions.map((prescription) => (
                                        <tr key={prescription._id || prescription.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {prescription.doctor ? 
                                                        `${prescription.doctor.name }`.trim() || 'N/A' : 
                                                        'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatDate(prescription.date || prescription.createdAt)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{formatTime(prescription.date || prescription.createdAt)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{prescription.doctor?.specialization || 'General'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{prescription.prescriptionID || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {prescription.link ? (
                                                    <a href={prescription.link} target="_blank" rel="noopener noreferrer">
                                                        <FileSymlink className="w-5 h-5 text-blue-500 hover:text-blue-700" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">No PDF</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            case 'IMAGES':
                return (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {isLoadingImages ? (
                            <div className="text-center py-8 text-gray-500">Loading Images...</div>
                        ) : allImages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No images found</div>
                        ) : (
                            <div className="space-y-6">
                                {allImages.map((prescriptionData, index) => (
                                    <div key={prescriptionData.prescriptionId || index} className="border-b border-gray-200 pb-6 last:border-b-0">
                                        <div className="mb-4">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p><span className="font-medium">Date:</span> {formatDate(prescriptionData.prescriptionDate)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {prescriptionData.images?.map((img, imageIndex) => (
                                                <div key={img.url || imageIndex} className="relative group">
                                                    <img
                                                        src={img.url}
                                                        className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                                                        onClick={() => window.open(img.url, '_blank')} 
                                                    />
                                                    {img.remark && (
                                                        <div className="mt-2 text-xl text-gray-600 text-center break-words">
                                                            {img.remark}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                        Content for {activeTab} is not implemented yet
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen text-nowrap">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-2 border border-gray-100">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {TABS.map((tab) => {
                                const IconComp = tab.icon;
                                return (
                                    <button
                                        key={tab.label}
                                        onClick={() => setActiveTab(tab.label)}
                                        className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap
                                            ${activeTab === tab.label
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105 transform'
                                                : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 hover:shadow-md'
                                            }`}
                                    >
                                        <IconComp className={`w-5 h-5 ${activeTab === tab.label ? 'text-white' : 'text-blue-500'}`} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {renderTabContent()}
            </div>
        </div>
    );
};

export default MedicalRecords;