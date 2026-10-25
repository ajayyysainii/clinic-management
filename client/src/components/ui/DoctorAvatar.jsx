import React, { useEffect, useState } from 'react'

const DoctorAvatar = ({
    name = 'Doctor',
    id = 0,
    src,
    className = 'w-10 h-10',
    roundedClass = 'rounded-full',
}) => {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [src]);

    const safeName = name?.trim() || 'Doctor';
    const initials = safeName
        .split(' ')
        .filter(Boolean)
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

    const numericId = typeof id === 'number'
        ? id
        : String(id).split('').reduce((total, character) => total + character.charCodeAt(0), 0);
    const colorClass = colors[Math.abs(numericId) % colors.length];

    if (src && !imageFailed) {
        return (
            <img
                src={src}
                alt={safeName}
                className={`${className} ${roundedClass} object-cover flex-shrink-0`}
                onError={() => setImageFailed(true)}
            />
        );
    }

    return (
        <div
            className={`${className} ${roundedClass} ${colorClass} flex flex-shrink-0 items-center justify-center text-white text-sm font-medium`}
            role="img"
            aria-label={safeName}
        >
            {initials}
        </div>
    );
};


export default DoctorAvatar
