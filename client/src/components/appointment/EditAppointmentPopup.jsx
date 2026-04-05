import { useState, useEffect } from "react";
import { X, Calendar, Clock, User, FileText, Pill } from "lucide-react";
import axios from "axios";
import {BACKEND_URL} from '../../utils/urlConstants'


const EditAppointmentPopup = ({ appointment, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    appointmentTime: "",
    consultationMode: "",
    status: "",
    diagnosis: "",
    prescriptionId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (appointment && isOpen) {
      // Format the date for datetime-local input
      const appointmentDate = appointment.appointmentTime
        ? new Date(appointment.appointmentTime).toISOString().slice(0, 16)
        : "";

      setFormData({
        appointmentTime: appointmentDate,
        consultationMode: appointment.consultationMode || "",
        status: appointment.status || "",
        diagnosis: appointment.diagnosis || "",
        prescriptionId: appointment.prescriptionId || "",
      });
      setError(null);
    }
  }, [appointment, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authtoken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Only send non-empty fields
      const updateData = {};
      if (formData.appointmentTime) {
        updateData.appointmentTime = new Date(
          formData.appointmentTime
        ).toISOString();
      }
      if (formData.consultationMode) {
        updateData.consultationMode = formData.consultationMode;
      }
      if (formData.status) {
        updateData.status = formData.status;
      }
      if (formData.diagnosis) {
        updateData.diagnosis = formData.diagnosis;
      }
      if (formData.prescriptionId) {
        updateData.prescriptionId = formData.prescriptionId;
      }

      const response = await axios.put(
        `${BACKEND_URL}/appointments/update/${appointment._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        onUpdate(response.data.data);
        onClose();
      }
    } catch (err) {
      console.error("Error updating appointment:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update appointment"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Appointment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Appointment Time */}
          <div>
            <label
              htmlFor="appointmentTime"
              className="flex items-center text-sm font-medium text-gray-700 mb-2"
            >
              <Calendar size={16} className="mr-2" />
              Appointment Date & Time
            </label>
            <input
              type="datetime-local"
              id="appointmentTime"
              name="appointmentTime"
              value={formData.appointmentTime}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Consultation Mode */}
          <div>
            <label
              htmlFor="consultationMode"
              className="flex items-center text-sm font-medium text-gray-700 mb-2"
            >
              <User size={16} className="mr-2" />
              Consultation Mode
            </label>
            <select
              id="consultationMode"
              name="consultationMode"
              value={formData.consultationMode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Mode</option>
              <option value="onsite">On-site</option>
              <option value="tele-consultation">Tele-consultation</option>
              <option value="home-visit">Home Visit</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="flex items-center text-sm font-medium text-gray-700 mb-2"
            >
              <Clock size={16} className="mr-2" />
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Follow Up">Follow Up</option>
            </select>
          </div>

          {/* Diagnosis */}
          <div>
            <label
              htmlFor="diagnosis"
              className="flex items-center text-sm font-medium text-gray-700 mb-2"
            >
              <FileText size={16} className="mr-2" />
              Diagnosis
            </label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter diagnosis..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating..." : "Update Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointmentPopup;
