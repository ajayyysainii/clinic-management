import { useState, useEffect } from 'react';
import { Package, List, BarChart3 } from 'lucide-react';
import InventoryDashboard from './InventoryDashboard';
import InventoryList from './InventoryList';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Check URL parameters for tab
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['dashboard', 'list'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, []);

    const tabs = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            icon: BarChart3,
        },
        {
            id: 'list',
            name: 'Inventory List',
            icon: List,
        },
    ];

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId);
        window.history.pushState({}, '', url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                        <p className="text-gray-600">Manage your clinic's inventory items</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'dashboard' && <InventoryDashboard />}
                {activeTab === 'list' && <InventoryList />}
            </div>
        </div>
    );
};

export default Inventory; 