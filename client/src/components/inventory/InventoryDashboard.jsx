import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Calendar, TrendingUp, Package, Plus, Eye, RefreshCw } from 'lucide-react';
import { BACKEND_URL } from '../../utils/urlConstants';
import { withBasePath } from '../../utils/basePath.js';
import { sentenceCase } from '../../utils/sentenceCase.js';

const InventoryDashboard = () => {
    const [lowStockItems, setLowStockItems] = useState([]);
    const [expiringItems, setExpiringItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Fetch data with individual error handling
            const fetchData = async (endpoint, defaultValue = []) => {
                try {
                    const response = await axios.get(`${BACKEND_URL}/inventory/${endpoint}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    return response.data?.data || defaultValue;
                } catch (err) {
                    console.error(`Error fetching ${endpoint}:`, err);
                    return defaultValue;
                }
            };

            // Fetch all data in parallel
            const [lowStockData, expiringData, statsData] = await Promise.all([
                fetchData('low-stock', []),
                fetchData('expiring', []),
                fetchData('stats', {
                    totalItems: 0,
                    lowStockItems: 0,
                    expiringItems: 0,
                    totalValue: 0
                })
            ]);

            setLowStockItems(lowStockData);
            setExpiringItems(expiringData);
            setStats(statsData);

            // Debug logging
            console.log('Dashboard data received:', {
                lowStockItems: lowStockData,
                expiringItems: expiringData,
                stats: statsData
            });

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Failed to fetch dashboard data');
            // Set default values on error
            setLowStockItems([]);
            setExpiringItems([]);
            setStats({
                totalItems: 0,
                lowStockItems: 0,
                expiringItems: 0,
                totalValue: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'medicine':
                return 'bg-blue-100 text-blue-800';
            case 'equipment':
                return 'bg-purple-100 text-purple-800';
            case 'supplies':
                return 'bg-green-100 text-green-800';
            case 'consumables':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (err) {
            return 'Invalid Date';
        }
    };

    const getDaysUntilExpiry = (expiryDate) => {
        if (!expiryDate) return null;
        try {
            const today = new Date();
            const expiry = new Date(expiryDate);
            const diffTime = expiry - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (err) {
            return null;
        }
    };

    const handleRefresh = () => {
        fetchDashboardData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-red-800">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 text-red-600 hover:text-red-800"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Items</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalItems || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Low Stock</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.lowStockItems || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.expiringItems || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Value</p>
                            <p className="text-2xl font-bold text-gray-900">₹{(stats?.totalValue || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                                Low Stock Items
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{lowStockItems.length} items</span>
                                <button
                                    onClick={handleRefresh}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Refresh"
                                >
                                    <RefreshCw className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {lowStockItems.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No low stock items</p>
                                <p className="text-sm text-gray-400 mt-1">All items are well stocked</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {lowStockItems.slice(0, 5).map((item) => (
                                    <div key={item._id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{sentenceCase(item.itemName)}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-1 text-xs rounded-md ${getCategoryColor(item.category)}`}>
                                                    {sentenceCase(item.category)}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {item.quantity} {item.unit} remaining
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-orange-600">
                                                Min: {item.minQuantity} {item.unit}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                ₹{(item.costPrice || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {lowStockItems.length > 5 && (
                                    <p className="text-sm text-gray-500 text-center">
                                        +{lowStockItems.length - 5} more items
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Expiring Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Calendar className="h-5 w-5 text-red-600 mr-2" />
                                Expiring Soon
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{expiringItems.length} items</span>
                                <button
                                    onClick={handleRefresh}
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Refresh"
                                >
                                    <RefreshCw className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {expiringItems.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No items expiring soon</p>
                                <p className="text-sm text-gray-400 mt-1">All items have good expiry dates</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {expiringItems.slice(0, 5).map((item) => {
                                    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                                    const isExpired = daysUntilExpiry < 0;
                                    const isExpiringSoon = daysUntilExpiry <= 7;
                                    
                                    return (
                                        <div key={item._id} className={`flex items-center justify-between p-4 rounded-lg hover:bg-opacity-80 transition-colors ${
                                            isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-orange-50' : 'bg-yellow-50'
                                        }`}>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{sentenceCase(item.itemName)}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-1 text-xs rounded-md ${getCategoryColor(item.category)}`}>
                                                        {sentenceCase(item.category)}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${
                                                    isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-yellow-600'
                                                }`}>
                                                    {isExpired ? 'Expired' : daysUntilExpiry !== null ? `${daysUntilExpiry} days` : 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(item.expiryDate)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {expiringItems.length > 5 && (
                                    <p className="text-sm text-gray-500 text-center">
                                        +{expiringItems.length - 5} more items
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => { window.location.href = withBasePath('/inventory?tab=list'); }}
                            className="flex items-center justify-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <Plus className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="text-blue-600 font-medium">Add New Item</span>
                        </button>
                        <button 
                            onClick={() => window.location.href = '/inventory?tab=list'}
                            className="flex items-center justify-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                        >
                            <Package className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-green-600 font-medium">View All Items</span>
                        </button>
                        <button 
                            onClick={handleRefresh}
                            className="flex items-center justify-center p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                            <Eye className="h-5 w-5 text-purple-600 mr-2" />
                            <span className="text-purple-600 font-medium">Refresh Data</span>
                        </button>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default InventoryDashboard; 