import { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

const InventoryTest = () => {
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        const results = {};
        const token = localStorage.getItem("authtoken");

        if (!token) {
            setTestResults({ error: 'No authentication token found' });
            setLoading(false);
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        try {
            // Test 1: Get all inventory
            try {
                const response = await axios.get(`${BACKEND_URL}/inventory`, { headers });
                results.getAllInventory = {
                    success: true,
                    count: response.data?.data?.length || 0,
                    message: 'Successfully fetched inventory'
                };
            } catch (error) {
                results.getAllInventory = {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }

            // Test 2: Get stats
            try {
                const response = await axios.get(`${BACKEND_URL}/inventory/stats`, { headers });
                results.getStats = {
                    success: true,
                    data: response.data?.data,
                    message: 'Successfully fetched stats'
                };
            } catch (error) {
                results.getStats = {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }

            // Test 3: Get low stock items
            try {
                const response = await axios.get(`${BACKEND_URL}/inventory/low-stock`, { headers });
                results.getLowStock = {
                    success: true,
                    count: response.data?.data?.length || 0,
                    message: 'Successfully fetched low stock items'
                };
            } catch (error) {
                results.getLowStock = {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }

            // Test 4: Get expiring items
            try {
                const response = await axios.get(`${BACKEND_URL}/inventory/expiring`, { headers });
                results.getExpiring = {
                    success: true,
                    count: response.data?.data?.length || 0,
                    message: 'Successfully fetched expiring items'
                };
            } catch (error) {
                results.getExpiring = {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }

            // Test 5: Debug total value calculation
            try {
                const response = await axios.get(`${BACKEND_URL}/inventory/debug-total-value`, { headers });
                results.debugTotalValue = {
                    success: true,
                    data: response.data?.data,
                    message: 'Successfully fetched debug information'
                };
            } catch (error) {
                results.debugTotalValue = {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }

            // Test 6: Create a test item
            try {
                const testItem = {
                    itemName: 'Test Item',
                    description: 'Test description',
                    category: 'other',
                    quantity: 10,
                    unit: 'pieces',
                    minQuantity: 5,
                    costPrice: 100,
                    supplier: 'Test Supplier'
                };

                const response = await axios.post(`${BACKEND_URL}/inventory`, testItem, { headers });
                results.createItem = {
                    success: true,
                    id: response.data?.data?._id,
                    message: 'Successfully created test item'
                };

                // Clean up: Delete the test item
                if (response.data?.data?._id) {
                    try {
                        await axios.delete(`${BACKEND_URL}/inventory/${response.data.data._id}`, { headers });
                        results.cleanup = {
                            success: true,
                            message: 'Successfully cleaned up test item'
                        };
                    } catch (error) {
                        results.cleanup = {
                            success: false,
                            error: error.response?.data?.message || error.message
                        };
                    }
                }
            } catch (error) {
                results.createItem = {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }

        } catch (error) {
            results.general = {
                success: false,
                error: error.message
            };
        }

        setTestResults(results);
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory API Test</h2>
            
            <button
                onClick={runTests}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
                {loading ? 'Running Tests...' : 'Run API Tests'}
            </button>

            {Object.keys(testResults).length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Test Results:</h3>
                    
                    {Object.entries(testResults).map(([testName, result]) => (
                        <div key={testName} className={`p-4 rounded-lg border ${
                            result.success 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <h4 className="font-medium text-gray-900 capitalize">
                                {testName.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            {result.success ? (
                                <div className="text-green-800">
                                    <p>{result.message}</p>
                                    {result.count !== undefined && <p>Count: {result.count}</p>}
                                    {result.data && (
                                        <pre className="text-xs mt-2 bg-white p-2 rounded">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ) : (
                                <div className="text-red-800">
                                    <p>Error: {result.error}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryTest; 