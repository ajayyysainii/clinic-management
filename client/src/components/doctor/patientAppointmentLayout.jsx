import React from 'react';
import PatientForm from '../patients/PatientForm';
import Appointments from './Appointments';

const PatientAppointmentLayout = ({
    patient,
    isEditMode,
    onClose,
    onSuccess,
}) => {
    return (
        <div className="w-full min-h-screen bg-gray-50 p-6">
            <div className="flex gap-6 items-start">
                
                {/* Left Side - Patient Form */}
                <div className="w-[35%] sticky top-4">
                    <PatientForm
                        patient={patient}
                        isEditMode={isEditMode}
                        onClose={onClose}
                        onSuccess={onSuccess}
                    />
                </div>

                {/* Right Side - Appointments */}
                <div className="w-[65%]">
                    <Appointments />
                </div>

            </div>
        </div>
    );
};

export default PatientAppointmentLayout;