import { Download } from 'lucide-react';

const DownloadButton = ({ onDownload, disabled = false, loading = false }) => {
  return (
    <button
      onClick={onDownload}
      disabled={disabled || loading}
      className={`transition-all duration-300 ${
        disabled || loading
          ? 'cursor-not-allowed opacity-50' 
          : 'cursor-pointer hover:scale-110'
      }`}
      title="Download CSV"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
      ) : (
        <Download color='#9EA1C0' size={20} />
      )}
    </button>
  );
};

export default DownloadButton;