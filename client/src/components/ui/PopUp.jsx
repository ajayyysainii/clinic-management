// src/components/ui/Popup.jsx
const Popup = ({ message, onClose }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[250px]">
            <div className="mb-4 text-gray-800">{message}</div>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={onClose}
            >
                Close
            </button>
        </div>
    </div>
);

export default Popup;
