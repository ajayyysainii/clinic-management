import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Loader2 } from 'lucide-react';
import { BACKEND_URL } from '../../utils/urlConstants';
import { FormLoader } from '../ui/FormLoader';

const InventoryForm = ({ item, isEditMode = false, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        itemName: '',
        description: '',
        category: 'other',
        quantity: 0,
        unit: 'pieces',
        minQuantity: 0,
        supplier: '',
        supplierContact: '',
        costPrice: 0,
        sellingPrice: '',
        expiryDate: '',
        location: '',
        barcode: '',
        sku: '',
        isActive: true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        { value: 'medicine', label: 'Medicine' },
        { value: 'equipment', label: 'Equipment' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'consumables', label: 'Consumables' },
        { value: 'other', label: 'Other' },
    ];

    const units = [
        { value: 'pieces', label: 'Pieces' },
        { value: 'boxes', label: 'Boxes' },
        { value: 'bottles', label: 'Bottles' },
        { value: 'packs', label: 'Packs' },
        { value: 'units', label: 'Units' },
        { value: 'kg', label: 'Kilograms' },
        { value: 'g', label: 'Grams' },
        { value: 'l', label: 'Liters' },
        { value: 'ml', label: 'Milliliters' },
    ];

    useEffect(() => {
        if (item && isEditMode) {
            setFormData({
                itemName: item.itemName || '',
                description: item.description || '',
                category: item.category || 'other',
                quantity: item.quantity || 0,
                unit: item.unit || 'pieces',
                minQuantity: item.minQuantity || 0,
                supplier: item.supplier || '',
                supplierContact: item.supplierContact || '',
                costPrice: item.costPrice || 0,
                sellingPrice: item.sellingPrice || '',
                expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
                location: item.location || '',
                barcode: item.barcode || '',
                sku: item.sku || '',
                isActive: item.isActive !== undefined ? item.isActive : true,
            });
        }
    }, [item, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const validateForm = () => {
        if (!formData.itemName.trim()) {
            setError('Item name is required');
            return false;
        }
        if (formData.quantity < 0) {
            setError('Quantity cannot be negative');
            return false;
        }
        if (formData.minQuantity < 0) {
            setError('Minimum quantity cannot be negative');
            return false;
        }
        if (formData.costPrice < 0) {
            setError('Cost price cannot be negative');
            return false;
        }
        if (formData.sellingPrice && formData.sellingPrice < 0) {
            setError('Selling price cannot be negative');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("authtoken");
            if (!token) {
                throw new Error('No authentication token found');
            }

            const submitData = {
                ...formData,
                quantity: Number(formData.quantity),
                minQuantity: Number(formData.minQuantity),
                costPrice: Number(formData.costPrice),
                sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : undefined,
            };

            if (isEditMode) {
                await axios.put(`${BACKEND_URL}/inventory/${item._id}`, submitData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
            } else {
                await axios.post(`${BACKEND_URL}/inventory`, submitData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
            }

            onSuccess();
        } catch (err) {
            console.error('Error saving inventory item:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save inventory item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Item Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                name="itemName"
                                value={formData.itemName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter item name"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter item description"
                            />
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity *
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                                required
                            />
                        </div>

                        {/* Unit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit *
                            </label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {units.map(unit => (
                                    <option key={unit.value} value={unit.value}>
                                        {unit.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Minimum Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Quantity *
                            </label>
                            <input
                                type="number"
                                name="minQuantity"
                                value={formData.minQuantity}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                                required
                            />
                        </div>

                        {/* Cost Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cost Price (₹) *
                            </label>
                            <input
                                type="number"
                                name="costPrice"
                                value={formData.costPrice}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Selling Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selling Price (₹)
                            </label>
                            <input
                                type="number"
                                name="sellingPrice"
                                value={formData.sellingPrice}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Supplier
                            </label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter supplier name"
                            />
                        </div>

                        {/* Supplier Contact */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Supplier Contact
                            </label>
                            <input
                                type="text"
                                name="supplierContact"
                                value={formData.supplierContact}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter supplier contact"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter storage location"
                            />
                        </div>

                        {/* Barcode */}
                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Barcode
                            </label>
                            <input
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter barcode"
                            />
                        </div> */}

                        {/* SKU */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SKU
                            </label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter SKU"
                            />
                        </div>

                        {/* Active Status */}
                        <div className="md:col-span-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <FormLoader size="sm" text="Saving..." />
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEditMode ? 'Update' : 'Save'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryForm; 