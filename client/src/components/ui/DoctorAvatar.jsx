import React from 'react'

const DoctorAvatar = ({ name, id }) => {
    const initials = name
        .split(' ')
        .map(n => n.charAt(0))
        .join('')
        .substring(0, 2);

    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
    ];

    const colorClass = colors[id % colors.length];

    return (
        <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-medium`}>
            {initials}
        </div>
    );
};


export default DoctorAvatar