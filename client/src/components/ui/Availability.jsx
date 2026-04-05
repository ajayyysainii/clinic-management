import React from 'react'

const Availability = ({ className, availability = [] }) => {
  const days = [
    { short: 'M', full: 'Monday' },
    { short: 'T', full: 'Tuesday' },
    { short: 'W', full: 'Wednesday' },
    { short: 'T', full: 'Thursday' },
    { short: 'F', full: 'Friday' },
    { short: 'S', full: 'Saturday' },
    { short: 'S', full: 'Sunday' }
  ];

  // Check if doctor is available on a specific day
  const isAvailable = (dayName) => {
    const dayAvailability = availability.find(avail => avail.day === dayName);
    return dayAvailability && dayAvailability.slots && dayAvailability.slots.length > 0;
  };

  // Get time slots for tooltip
  const getTimeSlots = (dayName) => {
    const dayAvailability = availability.find(avail => avail.day === dayName);
    if (!dayAvailability || !dayAvailability.slots) return [];
    return dayAvailability.slots.map(slot => `${slot.startTime}-${slot.endTime}`);
  };

  return (
    <div className={`flex gap-1 ${className || ''}`}>
      {days.map((day, index) => {
        const available = isAvailable(day.full);
        const timeSlots = getTimeSlots(day.full);
        
        return (
          <div 
            key={index}
            className={`h-[25px] w-[25px] flex items-center justify-center hover:-translate-y-1 transition-all duration-300 rounded-full text-xs font-medium text-white cursor-pointer ${
              available 
                ? 'bg-blue-400 hover:bg-blue-500' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            title={`${day.full} - ${
              available 
                ? `Available (${timeSlots.join(', ')})` 
                : 'Not Available'
            }`}
          >
            {day.short}
          </div>
        );
      })}
    </div>
  )
}

export default Availability