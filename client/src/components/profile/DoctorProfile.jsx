import React, { useState, useEffect } from 'react';
import { Mail, Phone, User, ClipboardPlus, Hospital, CirclePlus, BadgePlus, Calendar, Clock, MapPin, Award, BookOpen, Stethoscope, Users, Menu, Edit, Upload, X } from 'lucide-react';
import { useParams } from 'react-router';
import axios from 'axios';
import { Loading } from '../ui/Loading';
import { Link } from 'react-router';
import DoctorAvatar from '../ui/DoctorAvatar';
import { sentenceCase } from '../../utils/sentenceCase';
import { BACKEND_URL } from '../../utils/urlConstants';

const SECTION = {
  NONE: null,
  // Add doctor-specific sections if needed
};

const DoctorProfile = () => {
  const { id } = useParams();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Edit states
  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const token = localStorage.getItem('authtoken');
        const response = await axios.get(`${BACKEND_URL}/doctors/list/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctorData(response.data.data);
        console.log('Full response:', response);
        console.log('Doctor data:', response.data.data);
        console.log('Doctor ID from response:', response.data.data?._id);
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  useEffect(() => {
    if (!doctorData) return;
    const fetchAppointments = async () => {
      setAppointmentsLoading(true);
      setAppointmentsError(null);
      try {
        const token = localStorage.getItem('authtoken');
        const response = await axios.get(`${BACKEND_URL}/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(response.data.data || []);
        console.log(response.data.data);
      } catch {
        setAppointmentsError('Failed to load appointments.');
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchAppointments();
  }, [doctorData, id]);

  if (loading) {
    return <Loading />;
  }

  if (!doctorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Doctor Profile Not Found</h2>
          <p className="text-gray-600">The doctor profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const doctor = doctorData;
  const user = doctor?.user_id || {};

  // Edit handler functions
  const handleEdit = (section, data = {}) => {
    setEditingSection(section);

    // Initialize data structures for different sections
    if (section === 'availability') {
      const defaultAvailability = [
        { day: 'Monday', slots: [] },
        { day: 'Tuesday', slots: [] },
        { day: 'Wednesday', slots: [] },
        { day: 'Thursday', slots: [] },
        { day: 'Friday', slots: [] },
        { day: 'Saturday', slots: [] },
        { day: 'Sunday', slots: [] },
      ];

      // Use existing availability or default structure
      const availabilityData = data.availability && data.availability.length > 0
        ? data.availability
        : defaultAvailability;

      setEditFormData({ ...data, availability: availabilityData });
    } else if (section === 'degrees') {
      // Initialize with existing degrees or empty array
      const degreesData = data.degrees && data.degrees.length > 0
        ? data.degrees
        : [];

      setEditFormData({ ...data, degrees: degreesData });
    } else if (section === 'certificates') {
      // Initialize with existing certificates or empty array
      const certificatesData = data.certificates && data.certificates.length > 0
        ? data.certificates
        : [];

      setEditFormData({ ...data, certificates: certificatesData });
    } else {
      setEditFormData(data);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditFormData({});
    setSelectedImage(null);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const uploadImageToS3 = async (file) => {
    try {
      const token = localStorage.getItem('authtoken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${BACKEND_URL}/upload/image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('authtoken');
      let updateData = {};
      let formData = null;

      // Debug: Log the IDs to see what we're working with
      console.log('Route ID from useParams (userId):', id);
      console.log('Doctor data:', doctor);
      console.log('Doctor _id:', doctor._id);

      // Check if doctor data is available
      if (!doctor) {
        alert('Error: Doctor data not loaded. Please refresh the page and try again.');
        return;
      }

      // The route param 'id' is actually the userId, but we need the doctor's _id for updates
      // The doctor data contains the doctor's _id from the DoctorMeta collection
      const doctorId = doctor._id;

      if (!doctorId) {
        alert('Error: Doctor ID not found. Please refresh the page and try again.');
        return;
      }

      // Handle different edit sections
      switch (editingSection) {
        case 'profileImage':
          if (selectedImage) {
            setImageUploading(true);
            const imageUrl = await uploadImageToS3(selectedImage);

            // Update the user's profile image via User endpoint
            const userUpdateResponse = await axios.put(`${BACKEND_URL}/users/profile`, {
              profileImageUrl: imageUrl
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (userUpdateResponse.data.success) {
              // Update the local state to show the new image immediately
              setDoctorData(prev => ({
                ...prev,
                user_id: {
                  ...prev.user_id,
                  profileImageUrl: imageUrl
                }
              }));
              alert('Profile image updated successfully!');
              handleCancelEdit();
            }
            return;
          }
          break;

        case 'email':
          // Update user data directly
          const emailResponse = await axios.put(`${BACKEND_URL}/users/profile`, {
            email: editFormData.email
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (emailResponse.data.success) {
            setDoctorData(prev => ({
              ...prev,
              user_id: {
                ...prev.user_id,
                email: editFormData.email
              }
            }));
            alert('Email updated successfully!');
            handleCancelEdit();
          }
          return;

        case 'phone':
          // Update user data directly
          const phoneResponse = await axios.put(`${BACKEND_URL}/users/profile`, {
            phone: editFormData.phone
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (phoneResponse.data.success) {
            setDoctorData(prev => ({
              ...prev,
              user_id: {
                ...prev.user_id,
                phone: editFormData.phone
              }
            }));
            alert('Phone updated successfully!');
            handleCancelEdit();
          }
          return;

        case 'experience':
          updateData = {
            yearsOfExperience: editFormData.yearsOfExperience,
            specializations: doctor?.specializations || [],
            availability: doctor?.availability || []
          };
          break;

        case 'bio':
          updateData = {
            bio: editFormData.bio,
            specializations: doctor?.specializations || [],
            availability: doctor?.availability || []
          };
          break;

        case 'availability':
          updateData = {
            availability: editFormData.availability || [],
            specializations: doctor?.specializations || []
          };
          break;

        case 'degrees':
          // For degrees, we need to use FormData with file upload
          setImageUploading(true);
          formData = new FormData();

          // Add degree titles
          const degreeTitles = editFormData.degrees?.map(deg => deg.title) || [];
          formData.append('degreeTitles', JSON.stringify(degreeTitles));

          // Add existing degree images
          const existingDegreeImages = editFormData.degrees?.map(deg => deg.degrees_image_url || '') || [];
          formData.append('existingDegrees', JSON.stringify(existingDegreeImages));

          // Add degree files if any
          editFormData.degrees?.forEach((deg, index) => {
            if (deg.newFile) {
              formData.append('degrees', deg.newFile);
            }
          });

          // Also need to include other required fields
          formData.append('specializations', JSON.stringify(doctor?.specializations || []));
          formData.append('availability', JSON.stringify(doctor?.availability || []));
          break;

        case 'certificates':
          // For certificates, we need to use FormData with file upload
          setImageUploading(true);
          formData = new FormData();

          // Add certificate titles
          const certificateTitles = editFormData.certificates?.map(cert => cert.title) || [];
          formData.append('certificateTitles', JSON.stringify(certificateTitles));

          // Add existing certificate images
          const existingCertificateImages = editFormData.certificates?.map(cert => cert.certificates_image_url || '') || [];
          formData.append('existingCertificates', JSON.stringify(existingCertificateImages));

          // Add certificate files if any
          editFormData.certificates?.forEach((cert, index) => {
            if (cert.newFile) {
              formData.append('certificates', cert.newFile);
            }
          });

          // Also need to include other required fields
          formData.append('specializations', JSON.stringify(doctor?.specializations || []));
          formData.append('availability', JSON.stringify(doctor?.availability || []));
          break;

        case 'eSign':
          if (selectedImage) {
            setImageUploading(true);
            // For eSign, we need to use FormData with file upload
            formData = new FormData();
            formData.append('eSign', selectedImage);
            formData.append('existingESign', doctor?.eSign || '');
            // Also need to include other required fields
            formData.append('specializations', JSON.stringify(doctor?.specializations || []));
            formData.append('availability', JSON.stringify(doctor?.availability || []));
          }
          break;

        default:
          break;
      }

      // Update the doctor data using the existing endpoint for doctor-specific fields
      if (Object.keys(updateData).length > 0 || formData) {
        const dataToSend = formData || updateData;
        const headers = formData
          ? { Authorization: `Bearer ${token}` }
          : { Authorization: `Bearer ${token}` };

        console.log('Sending update data:', dataToSend); // Debug log
        console.log('Using doctor ID:', doctorId);

        const response = await axios.put(`${BACKEND_URL}/doctors/update/${doctorId}`, dataToSend, {
          headers,
        });

        if (response.data.success) {
          // Refresh doctor data
          const refreshResponse = await axios.get(`${BACKEND_URL}/doctors/list/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDoctorData(refreshResponse.data.data);
          handleCancelEdit();
          alert('Profile updated successfully!');
        }
      }

    } catch (error) {
      console.error('Error updating doctor:', error);

      if (error.response?.status === 404) {
        alert('Doctor not found. This might be due to a data mismatch. Please refresh the page and try again.');
      } else if (error.response?.data?.message) {
        alert(`Update failed: ${error.response.data.message}`);
      } else {
        alert('Failed to update doctor profile. Please try again.');
      }
    } finally {
      setImageUploading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'qualifications', label: 'Qualifications', icon: Award },
    { id: 'availability', label: 'Availability', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header Section - Mobile Responsive */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-transparent"></div>

        {/* Decorative elements - Hidden on mobile */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 hidden md:block">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-1/3 w-16 h-16 bg-white rounded-full"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Enhanced Profile Image - Responsive sizing */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl bg-white p-2 shadow-2xl">
                <img
                  className="w-full h-full rounded-2xl object-cover"
                  src={user.profileImageUrl || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                  alt="Profile"
                />
                {/* Edit button for profile image */}
                <button
                  onClick={() => handleEdit('profileImage', { profileImageUrl: user?.profileImageUrl })}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
                  title="Edit Profile Image"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Doctor Info - Responsive text sizing */}
            <div className="flex flex-col items-center text-white text-center sm:text-left">
              <div className="mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
                  Medical Professional
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{user.name || 'N/A'}</h1>
              <p className="text-lg sm:text-xl text-blue-100 mb-4">
                {(doctor?.specializations && doctor.specializations.length > 0)
                  ? doctor.specializations.join(', ')
                  : 'General Practitioner'}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-blue-100 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{doctor?.yearsOfExperience || 0} years experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{appointments.length} appointments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Section - Mobile responsive */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-8 relative">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Enhanced Tab Navigation - Mobile responsive with dropdown */}
          <div className="border-b border-gray-200 bg-gray-50/50">
            {/* Mobile menu button */}
            <div className="md:hidden p-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm"
              >
                <Menu className="w-5 h-5" />
                <span className="font-medium">
                  {tabs.find(tab => tab.id === activeTab)?.label || 'Menu'}
                </span>
              </button>

              {/* Mobile dropdown menu */}
              {mobileMenuOpen && (
                <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${activeTab === tab.id
                            ? 'bg-blue-50 text-blue-600 border-l-4 border-l-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop tab navigation */}
            <nav className="hidden md:flex space-x-8 px-8 py-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Contact Information Cards - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-blue-600">Email</p>
                          <p className="text-xs font-semibold text-gray-900 truncate">{user.email || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('email', { email: user?.email })}
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Edit Email"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-green-600">Phone</p>
                          <p className="text-sm sm:text-lg font-semibold text-gray-900">{user.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('phone', { phone: user?.phone })}
                        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors duration-200"
                        title="Edit Phone"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6 border border-purple-200 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ClipboardPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-purple-600">Experience</p>
                          <p className="text-sm sm:text-lg font-semibold text-gray-900">
                            {doctor?.yearsOfExperience ? `${doctor.yearsOfExperience} years` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('experience', { yearsOfExperience: doctor?.yearsOfExperience })}
                        className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                        title="Edit Experience"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bio & eSign Section - Responsive layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Professional Bio
                      </h3>
                      <button
                        onClick={() => handleEdit('bio', { bio: doctor?.bio })}
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Edit Bio"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {doctor?.bio || 'No bio available for this doctor.'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Digital Signature
                      </h3>
                      <button
                        onClick={() => handleEdit('eSign', { eSign: doctor?.eSign })}
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Edit Digital Signature"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    {doctor?.eSign ? (
                      <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                        <img src={doctor.eSign} alt="eSign" className="h-16 sm:h-20 object-contain mx-auto" />
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No digital signature available</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Qualifications Tab */}
            {activeTab === 'qualifications' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Degrees */}
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        Degrees
                      </h3>
                      <button
                        onClick={() => handleEdit('degrees', { degrees: doctor?.degrees || [] })}
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Edit Degrees"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    {doctor?.degrees && doctor.degrees.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {doctor.degrees.map((deg) => (
                          <div key={deg._id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{deg.title}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">Medical Degree</p>
                              </div>
                              {deg.degrees_image_url && (
                                <div className="flex-shrink-0">
                                  <img src={deg.degrees_image_url} alt={deg.title} className="h-12 w-16 sm:h-16 sm:w-24 object-cover rounded border shadow-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm sm:text-base">No degrees available</p>
                      </div>
                    )}
                  </div>

                  {/* Certificates */}
                  <div>
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                        <BadgePlus className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        Certificates
                      </h3>
                      <button
                        onClick={() => handleEdit('certificates', { certificates: doctor?.certificates || [] })}
                        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors duration-200"
                        title="Edit Certificates"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    {doctor?.certificates && doctor.certificates.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {doctor.certificates.map((cert) => (
                          <div key={cert._id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{cert.title}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">Professional Certificate</p>
                              </div>
                              {cert.certificates_image_url && (
                                <div className="flex-shrink-0">
                                  <img src={cert.certificates_image_url} alt={cert.title} className="h-12 w-16 sm:h-16 sm:w-24 object-cover rounded border shadow-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <BadgePlus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm sm:text-base">No certificates available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    Weekly Availability
                  </h3>
                  <button
                    onClick={() => handleEdit('availability', { availability: doctor?.availability || [] })}
                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                    title="Edit Availability"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                {doctor?.availability && doctor.availability.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {doctor.availability.map((day) => (
                      <div key={day._id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {day.day}
                        </h4>
                        {day.slots && day.slots.length > 0 ? (
                          <div className="space-y-2">
                            {day.slots.map((slot) => (
                              <div key={slot._id} className="bg-blue-50 border border-blue-200 rounded-lg px-2 sm:px-3 py-2">
                                <div className="text-xs sm:text-sm font-medium text-blue-900">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs sm:text-sm">No slots available</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">No availability information available</p>
                  </div>
                )}
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className='text-nowrap'>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  Appointments History
                </h3>

                {/* Appointments Summary Cards - Mobile/Tablet */}
                <div className="lg:hidden mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                      <div className="text-xs text-blue-700">Total</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {appointments.filter(a => a.status === 'Completed').length}
                      </div>
                      <div className="text-xs text-green-700">Completed</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">
                        {appointments.filter(a => a.status === 'Pending').length}
                      </div>
                      <div className="text-xs text-yellow-700">Pending</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">
                        {appointments.filter(a => a.consultationMode === 'tele-consultation').length}
                      </div>
                      <div className="text-xs text-purple-700">Tele</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {appointmentsLoading ? (
                    <div className="flex items-center justify-center h-24 sm:h-32 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm sm:text-base">Loading appointments...</span>
                    </div>
                  ) : appointmentsError ? (
                    <div className="flex items-center justify-center h-24 sm:h-32 text-red-500">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                        </div>
                        <p className="text-sm sm:text-base">{appointmentsError}</p>
                      </div>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="flex items-center justify-center h-24 sm:h-32 text-gray-500">
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <p className="text-sm sm:text-base">No appointments found</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {/* Tablet view - Compact cards for medium screens */}
                      <div className="hidden md:block lg:hidden space-y-3 p-4">
                        {appointments.map((appt, idx) => {
                          const patient = appt.clinicPatientId?.userId || {};
                          const patientName = patient.name || appt.clinicPatientId?.familyMemberName || 'N/A';
                          const dateObj = appt.appointmentTime ? new Date(appt.appointmentTime) : null;
                          return (
                            <div key={appt._id || idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex-shrink-0">
                                    {patient.profileImageUrl ? (
                                      <img src={patient.profileImageUrl} alt={patientName} className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                                        <User className="w-5 h-5 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm">{sentenceCase(patientName) || 'N/A'}</div>
                                    <div className="text-gray-500 text-xs truncate">{patient.email || 'N/A'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="text-right">
                                    <div className="font-medium text-gray-900">
                                      {dateObj ? dateObj.toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="text-gray-500">
                                      {dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <span className={` items-center px-2 py-1 rounded-full text-xs font-medium ${appt.consultationMode === 'onsite'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                      }`}>
                                      {appt.consultationMode === 'onsite' ? 'On-site' : 'Tele'}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        appt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                          appt.status === 'Follow Up' ? 'bg-blue-100 text-blue-800' :
                                            appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                              'bg-gray-100 text-gray-800'
                                      }`}>
                                      {appt.status || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {appt.diagnosis && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="text-xs text-gray-500 mb-1">Diagnosis:</div>
                                  <div className="text-sm text-gray-900 truncate">{sentenceCase(appt.diagnosis)}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile view - Full cards for small screens */}
                      <div className="md:hidden space-y-4 p-4">
                        {appointments.map((appt, idx) => {
                          const patient = appt.clinicPatientId?.userId || {};
                          const patientName = patient.name || appt.clinicPatientId?.familyMemberName || 'N/A';
                          const dateObj = appt.appointmentTime ? new Date(appt.appointmentTime) : null;
                          return (
                            <div key={appt._id || idx} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">

                              {/* Header with patient info and status */}
                              <div className="flex flex-col space-y-4 items-start overflow-hidden  justify-between mb-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {patient.profileImageUrl ? (
                                      <img src={patient.profileImageUrl} alt={patientName} className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
                                    ) : (
                                      <div className="h-12 w-12  rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                                        <User className="w-6 h-6 text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 text-base mb-1">{sentenceCase(patientName) || 'N/A'}</div>
                                    <div className="text-gray-500 text-sm flex items-center gap-2">
                                      <span className="text-wrap text-xs">{patient.email || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-2">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                      appt.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                                        appt.status === 'Follow Up' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                          appt.status === 'Cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                            'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                    {appt.status || 'Unknown'}
                                  </span>
                                </div>
                                {/* Status badge */}
                                
                              </div>

                              {/* Appointment details in responsive grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {/* Date and Time */}
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Date & Time</span>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {dateObj ? dateObj.toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {dateObj ? dateObj.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 'N/A'}
                                  </div>
                                </div>
                                {/* Consultation Mode */}
                                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    {appt.consultationMode === 'onsite' ? (
                                      <MapPin className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Phone className="w-4 h-4 text-green-600" />
                                    )}
                                    <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Mode</span>
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${appt.consultationMode === 'onsite'
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                    {appt.consultationMode === 'onsite' ? 'On-site Visit' : 'Tele-consultation'}
                                  </span>
                                </div>
                              </div>
                              {/* Diagnosis section - if available */}
                              {appt.diagnosis && (
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Stethoscope className="w-4 h-4 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Diagnosis</span>
                                  </div>
                                  <div className="text-sm text-gray-900 leading-relaxed">{sentenceCase(appt.diagnosis)}</div>
                                </div>
                              )}

                              
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop table view for appointments */}
                      <table className="hidden lg:table w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {appointments.map((appt, idx) => {
                            const patient = appt.clinicPatientId?.userId || {};
                            const patientName = patient.name || appt.clinicPatientId?.familyMemberName || 'N/A';
                            const dateObj = appt.appointmentTime ? new Date(appt.appointmentTime) : null;
                            return (
                              <tr key={appt._id || idx} className="hover:bg-blue-50 transition-all duration-200 group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-12 w-12">
                                      {patient.profileImageUrl ? (
                                        <img src={patient.profileImageUrl} alt={patientName} className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
                                      ) : (
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 shadow-sm">
                                          <User className="w-6 h-6 text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-semibold text-gray-900">{sentenceCase(patientName) || 'N/A'}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate max-w-32">{patient.email || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {dateObj ? dateObj.toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {dateObj ? dateObj.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 'N/A'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${appt.consultationMode === 'onsite'
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                    {appt.consultationMode === 'onsite' ? (
                                      <>
                                        <MapPin className="w-3 h-3 mr-1.5" />
                                        On-site
                                      </>
                                    ) : (
                                      <>
                                        <Phone className="w-3 h-3 mr-1.5" />
                                        Tele-consultation
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                      appt.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                                        appt.status === 'Follow Up' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                          appt.status === 'Cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                            'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                    {appt.status || 'Unknown'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 max-w-48 truncate">
                                    {appt.diagnosis ? sentenceCase(appt.diagnosis) : 'N/A'}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit {editingSection === 'profileImage' ? 'Profile Image' :
                    editingSection === 'email' ? 'Email' :
                      editingSection === 'phone' ? 'Phone' :
                        editingSection === 'experience' ? 'Experience' :
                          editingSection === 'bio' ? 'Professional Bio' :
                            editingSection === 'eSign' ? 'Digital Signature' :
                              editingSection === 'availability' ? 'Weekly Availability' :
                                editingSection === 'degrees' ? 'Degrees' :
                                  editingSection === 'certificates' ? 'Certificates' : 'Information'}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Profile Image Edit */}
                {editingSection === 'profileImage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Image
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {selectedImage ? (
                          <img
                            src={URL.createObjectURL(selectedImage)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={user.profileImageUrl || 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png'}
                            alt="Current"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: Square image, max 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Edit */}
                {editingSection === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                )}

                {/* Phone Edit */}
                {editingSection === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                )}

                {/* Experience Edit */}
                {editingSection === 'experience' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={editFormData.yearsOfExperience || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter years of experience"
                    />
                  </div>
                )}

                {/* Bio Edit */}
                {editingSection === 'bio' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Bio
                    </label>
                    <textarea
                      value={editFormData.bio || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your professional bio"
                    />
                  </div>
                )}

                {/* eSign Edit */}
                {editingSection === 'eSign' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Digital Signature
                    </label>
                    <div className="space-y-3">
                      {editFormData?.eSign && (
                        <div className="text-center">
                          <img
                            src={editFormData.eSign}
                            alt="Current eSign"
                            className="h-20 object-contain mx-auto border border-gray-300 rounded-lg"
                          />
                          <p className="text-xs text-gray-500 mt-1">Current signature</p>
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload new digital signature image
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Availability Edit */}
                {editingSection === 'availability' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Weekly Availability
                    </label>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {editFormData.availability && editFormData.availability.map((day, dayIndex) => (
                        <div key={dayIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{day.day}</h4>
                            <button
                              onClick={() => {
                                const newAvailability = [...editFormData.availability];
                                newAvailability[dayIndex] = {
                                  ...day,
                                  slots: [...(day.slots || []), { startTime: '09:00', endTime: '10:00' }]
                                };
                                setEditFormData({ ...editFormData, availability: newAvailability });
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              + Add Slot
                            </button>
                          </div>

                          {day.slots && day.slots.length > 0 ? (
                            <div className="space-y-2">
                              {day.slots.map((slot, slotIndex) => (
                                <div key={slotIndex} className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => {
                                      const newAvailability = [...editFormData.availability];
                                      newAvailability[dayIndex].slots[slotIndex].startTime = e.target.value;
                                      setEditFormData({ ...editFormData, availability: newAvailability });
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  />
                                  <span className="text-gray-500">to</span>
                                  <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => {
                                      const newAvailability = [...editFormData.availability];
                                      newAvailability[dayIndex].slots[slotIndex].endTime = e.target.value;
                                      setEditFormData({ ...editFormData, availability: newAvailability });
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  />
                                  <button
                                    onClick={() => {
                                      const newAvailability = [...editFormData.availability];
                                      newAvailability[dayIndex].slots.splice(slotIndex, 1);
                                      setEditFormData({ ...editFormData, availability: newAvailability });
                                    }}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    title="Remove Slot"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No slots available for this day</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Add or modify time slots for each day of the week
                    </p>
                  </div>
                )}

                {/* Degrees Edit */}
                {editingSection === 'degrees' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Degrees
                    </label>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {editFormData.degrees && editFormData.degrees.map((degree, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Degree {index + 1}</h4>
                            <button
                              onClick={() => {
                                const newDegrees = [...editFormData.degrees];
                                newDegrees.splice(index, 1);
                                setEditFormData({ ...editFormData, degrees: newDegrees });
                              }}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Remove Degree"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Degree Title</label>
                              <input
                                type="text"
                                value={degree.title || ''}
                                onChange={(e) => {
                                  const newDegrees = [...editFormData.degrees];
                                  newDegrees[index] = { ...degree, title: e.target.value };
                                  setEditFormData({ ...editFormData, degrees: newDegrees });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="e.g., Bachelor of Medicine"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Degree Certificate Image</label>
                              {degree.degrees_image_url && !degree.newFile && (
                                <div className="mb-2">
                                  <img src={degree.degrees_image_url} alt="Current" className="h-16 w-24 object-cover rounded border" />
                                  <p className="text-xs text-gray-500 mt-1">Current image</p>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const newDegrees = [...editFormData.degrees];
                                    newDegrees[index] = { ...degree, newFile: file };
                                    setEditFormData({ ...editFormData, degrees: newDegrees });
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newDegrees = [...(editFormData.degrees || []), { title: '', degrees_image_url: '' }];
                          setEditFormData({ ...editFormData, degrees: newDegrees });
                        }}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors duration-200"
                      >
                        + Add New Degree
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Add your medical degrees and upload certificate images
                    </p>
                  </div>
                )}

                {/* Certificates Edit */}
                {editingSection === 'certificates' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Certificates
                    </label>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {editFormData.certificates && editFormData.certificates.map((certificate, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Certificate {index + 1}</h4>
                            <button
                              onClick={() => {
                                const newCertificates = [...editFormData.certificates];
                                newCertificates.splice(index, 1);
                                setEditFormData({ ...editFormData, certificates: newCertificates });
                              }}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Remove Certificate"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Title</label>
                              <input
                                type="text"
                                value={certificate.title || ''}
                                onChange={(e) => {
                                  const newCertificates = [...editFormData.certificates];
                                  newCertificates[index] = { ...certificate, title: e.target.value };
                                  setEditFormData({ ...editFormData, certificates: newCertificates });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="e.g., Board Certification in Cardiology"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Certificate Image</label>
                              {certificate.certificates_image_url && !certificate.newFile && (
                                <div className="mb-2">
                                  <img src={certificate.certificates_image_url} alt="Current" className="h-16 w-24 object-cover rounded border" />
                                  <p className="text-xs text-gray-500 mt-1">Current image</p>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const newCertificates = [...editFormData.certificates];
                                    newCertificates[index] = { ...certificate, newFile: file };
                                    setEditFormData({ ...editFormData, certificates: newCertificates });
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newCertificates = [...(editFormData.certificates || []), { title: '', certificates_image_url: '' }];
                          setEditFormData({ ...editFormData, certificates: newCertificates });
                        }}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-green-600 hover:border-green-300 transition-colors duration-200"
                      >
                        + Add New Certificate
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Add your professional certificates and upload certificate images
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={imageUploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {imageUploading ? (
                    <>
                      <div className="text-nowrap animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;
