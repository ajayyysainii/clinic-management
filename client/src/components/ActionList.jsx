import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

const ActionList = ({
    item,
    actions = [],
    align = 'right',
    triggerClassName = '',
    dropdownClassName = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleActionClick = (action) => {
        setIsOpen(false);
        action.onClick(item);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`text-gray-400 hover:text-gray-600 transition-colors duration-150 p-1 rounded-md hover:bg-gray-100 ${triggerClassName}`}
                aria-label="Actions"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {isOpen && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-8 w-54 bg-white border border-gray-200 rounded-md shadow-lg z-10 ${dropdownClassName}`}
                >
                    <div className="py-1">
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-150 ${action.className || 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    <Icon className={`w-4 h-4 mr-2 ${action.iconClassName || ''}`} />
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionList;