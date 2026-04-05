import { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, Plus, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import ActionList from '../ActionList';
import DownloadButton from '../ui/DownloadButton';
import InventoryForm from './InventoryForm';
import Popup from '../ui/PopUp';
import { BACKEND_URL } from '../../utils/urlConstants';
import { sentenceCase } from '../../utils/sentenceCase.js';

const InventoryList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchInventory();
        fetchStats();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(BACKEND_URL+'/inventory', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            const inventoryData = response.data?.data || [];
            setData(inventoryData);
            console.log('Inventory data:', inventoryData);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch inventory');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(BACKEND_URL+'/inventory/stats', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            setStats(response.data?.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setStats({
                totalItems: 0,
                lowStockItems: 0,
                expiringItems: 0,
                totalValue: 0
            });
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this inventory item?')) {
            try {
                await deleteItem(itemId);
                await fetchInventory();
                await fetchStats();
                alert('Inventory item deleted successfully');
            } catch (err) {
                console.error('Error deleting inventory item:', err);
                alert('Failed to delete inventory item');
            }
        }
    };

    const deleteItem = async (itemId) => {
        try {
            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            await axios.delete(`${BACKEND_URL}/inventory/${itemId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
        } catch (err) {
            console.error('Error deleting inventory item:', err);
            throw new Error(err.response?.data?.message || err.message || 'Failed to delete inventory item');
        }
    };

    const handleUpdateItem = (itemId) => {
        const item = data.find(item => item._id === itemId);
        setSelectedItem(item);
        setIsEditMode(true);
    };

    const handleFormClose = () => {
        setIsEditMode(false);
        setSelectedItem(null);
        setShowAddForm(false);
    };

    const handleFormSuccess = () => {
        fetchInventory();
        fetchStats();
        handleFormClose();
    };

    const handleAddItem = () => {
        setShowAddForm(true);
    };

    const handleRefresh = () => {
        fetchInventory();
        fetchStats();
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

    const getStockStatus = (quantity, minQuantity) => {
        if (quantity <= 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
        if (quantity <= minQuantity) return { text: 'Low Stock', color: 'bg-orange-100 text-orange-800' };
        return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
    };

    const filteredData = data.filter(item => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const name = (item.itemName || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const supplier = (item.supplier || '').toLowerCase();
        
        return name.includes(searchLower) ||
               description.includes(searchLower) ||
               category.includes(searchLower) ||
               supplier.includes(searchLower);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading inventory data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
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
        );
    }

    return (
        <>
            {isEditMode && selectedItem ? (
                <InventoryForm
                    item={selectedItem}
                    isEditMode={true}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            ) : showAddForm ? (
                <InventoryForm
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                <div className="bg-white relative rounded-lg shadow-sm border pb-5 border-gray-200 overflow-hidden">
                    {/* Stats Section */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Plus className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-600">Total Items</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-600">Low Stock</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <Calendar className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.expiringItems}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <span className="text-green-600 font-bold">₹</span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-600">Total Value</p>
                                        <p className="text-2xl font-bold text-gray-900">₹{stats.totalValue?.toLocaleString() || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <div className='h-16 flex items-center justify-between px-10'>
                            <input
                                type="text"
                                placeholder="Search Inventory"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-1/3 rounded-xl bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-gray-300 px-3 py-2 transition duration-300 ease-in-out focus:border-blue-500 hover:border-blue-300 outline-none"
                            />
                            <div className="flex items-center gap-2 text-nowrap ">
                                <button
                                    onClick={handleAddItem}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-2 ml-2 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Item
                                </button>
                                <button
                                    onClick={handleRefresh}
                                    className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                                    title="Refresh"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                                <div className='border border-gray-200 rounded-sm p-1 hover:scale-110 transition-all duration-300'>
                                    <DownloadButton />
                                </div>
                            </div>
                        </div>
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Item Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cost Price
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supplier
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            {searchTerm ? 'No inventory items found matching your search.' : 'No inventory items found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => {
                                        const stockStatus = getStockStatus(item.quantity, item.minQuantity);
                                        return (
                                            <tr key={item._id || index} className="hover:bg-gray-50 transition-colors duration-150 border-t border-gray-200">
                                                <td className='px-6 py-4 whitespace-nowrap'>
                                                    <div className="flex items-center">
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {sentenceCase(item.itemName)}
                                                            </div>
                                                            {item.description && (
                                                                <div className="text-sm text-gray-500">
                                                                    {item.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-sm rounded-md inline-block ${getCategoryColor(item.category)}`}>
                                                        {sentenceCase(item.category)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {item.quantity} {item.unit}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Min: {item.minQuantity} {item.unit}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-sm rounded-md inline-block ${stockStatus.color}`}>
                                                        {stockStatus.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        ₹{(item.costPrice || 0).toLocaleString()}
                                                    </div>
                                                    {item.sellingPrice && (
                                                        <div className="text-xs text-gray-500">
                                                            Sell: ₹{(item.sellingPrice || 0).toLocaleString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {item.supplier || 'N/A'}
                                                    </div>
                                                    {item.location && (
                                                        <div className="text-xs text-gray-500">
                                                            {item.location}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ActionList
                                                        item={item}
                                                        actions={[
                                                            {
                                                                label: 'Edit',
                                                                icon: Edit,
                                                                onClick: () => handleUpdateItem(item._id),
                                                            },
                                                            {
                                                                label: 'Delete',
                                                                icon: Trash2,
                                                                onClick: () => handleDeleteItem(item._id),
                                                                className: 'text-red-600 hover:bg-red-50',
                                                            },
                                                        ]}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
};

export default InventoryList; 