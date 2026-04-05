import React from 'react';

export const FormLoader = ({ size = "sm", text = "Processing..." }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
      <span>{text}</span>
    </div>
  );
};

export const ButtonLoader = ({ size = "sm", text = "Processing..." }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`}></div>
      <span>{text}</span>
    </div>
  );
};

export const InlineLoader = ({ size = "sm" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin`}></div>
  );
};

export const FullPageLoader = ({ text = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-lg shadow-lg">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 font-medium">{text}</p>
      </div>
    </div>
  );
};