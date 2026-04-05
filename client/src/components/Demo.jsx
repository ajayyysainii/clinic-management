import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../utils/urlConstants';
import { useAuth } from '../hooks/useAuth';
import { getAuthToken } from '../utils/authUtils';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  UserCheck,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  FileText,
  IndianRupee,
  PieChart,
  MapPin,
  User,
  Stethoscope
} from 'lucide-react';

function Demo() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const userRole = user?.data?.roles?.[0];
        const patientId = user?.data?._id;
        
        if (userRole === 'patient') {
          // For patient role, fetch only their appointments
          const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments/visits/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log("Patient appointments response:", appointmentsResponse.data);
          setPatientAppointments(appointmentsResponse.data.data);
        } else if (userRole === 'hybrid') {
          // For hybrid role, fetch all data in parallel
          const [basicStatsResponse, recentAppointmentsResponse, alertsResponse] = await Promise.all([
            axios.get(`${BACKEND_URL}/analytics/basic-stats?role=clinic`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${BACKEND_URL}/analytics/recent-appointments?role=clinic`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${BACKEND_URL}/analytics/alerts`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          ]);
          
          // Combine the data
          const mergedData = {
            stats: basicStatsResponse.data.data,
            recentAppointments: recentAppointmentsResponse.data.data,
            alerts: alertsResponse.data.data
          };
          console.log("all the data:", mergedData);
          console.log("monthly revenue data:", mergedData.stats?.monthlyRevenue);
          console.log("recent appointments response:", recentAppointmentsResponse.data);
          setAnalyticsData(mergedData);
        } else {
          // For single role, fetch all data in parallel
          const [basicStatsResponse, recentAppointmentsResponse, alertsResponse] = await Promise.all([
            axios.get(`${BACKEND_URL}/analytics/basic-stats`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${BACKEND_URL}/analytics/recent-appointments`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${BACKEND_URL}/analytics/alerts`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          ]);
          
          const mergedData = {
            stats: basicStatsResponse.data.data,
            recentAppointments: recentAppointmentsResponse.data.data,
            alerts: alertsResponse.data.data
          };
          console.log("response data:", mergedData);
          console.log("monthly revenue data:", mergedData.stats?.monthlyRevenue);
          console.log("recent appointments response:", recentAppointmentsResponse.data);
          setAnalyticsData(mergedData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Busy': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (iconName) => {
    switch (iconName) {
      case 'AlertCircle': return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
      case 'Clock': return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      case 'CheckCircle': return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
      default: return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />;
    }
  };

  const getAlertBgColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-red-50';
      case 'info': return 'bg-yellow-50';
      case 'success': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  const getAlertTextColor = (type) => {
    switch (type) {
      case 'warning': return 'text-red-900';
      case 'info': return 'text-yellow-900';
      case 'success': return 'text-green-900';
      default: return 'text-gray-900';
    }
  };

  const getAlertSubTextColor = (type) => {
    switch (type) {
      case 'warning': return 'text-red-700';
      case 'info': return 'text-yellow-700';
      case 'success': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Patient role - show only appointments
  if (user?.data?.roles?.[0] === 'patient') {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-full overflow-x-hidden">
        {/* Patient Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome, {user?.data?.name}</h1>
              <p className="text-sm text-gray-600">Here are your appointments</p>
            </div>
          </div>
        </div>

        {/* Patient Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              My Appointments
            </h2>
            <span className="text-sm text-gray-500">
              {patientAppointments?.length || 0} appointment(s)
            </span>
          </div>
          
          <div className="space-y-4">
            {patientAppointments && patientAppointments.length > 0 ? (
              patientAppointments.map((appointment, index) => {
                const { date, time } = formatDateTime(appointment.appointmentTime);
                return (
                  <div key={appointment._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Appointment Details */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900">{date}</p>
                            <p className="text-sm text-gray-600">{time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">Doctor</p>
                            <p className="font-medium text-gray-900">
                              {appointment.doctorId?.userId?.name || appointment.doctorId?.name || 'Dr. Unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="text-sm text-gray-600">Consultation Mode</p>
                            <p className="font-medium text-gray-900 capitalize">
                              {appointment.consultationMode?.replace('-', ' ') || 'Onsite'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status & Clinic Info */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status || 'Scheduled'}
                          </span>
                        </div>

                        {appointment.clinicPatientId?.clinicId && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-sm text-gray-600">Clinic</p>
                              <p className="font-medium text-gray-900">
                                {appointment.clinicPatientId.clinicId.name || 'Clinic Name'}
                              </p>
                            </div>
                          </div>
                        )}

                        {appointment.diagnosis && (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            <div>
                              <p className="text-sm text-gray-600">Diagnosis</p>
                              <p className="font-medium text-gray-900">{appointment.diagnosis}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                   
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No appointments found</p>
                <p className="text-gray-500 text-sm">Your upcoming appointments will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const { stats, recentAppointments, alerts } = analyticsData || {};

  return (
    <div className="space-y-6 sm:p-6 max-w-full overflow-x-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                {user?.data?.roles?.[0] === 'doctor' ? 'Total Patients' : 'Total Patients'}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 whitespace-nowrap">
                {stats.totalPatients.count}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
            {stats.totalPatients.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={stats.totalPatients.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {stats.totalPatients.growth} from last month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                {user?.data?.roles?.[0] === 'doctor' ? 'Today\'s Appointments' : 'Today\'s Appointments'}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 whitespace-nowrap">
                {stats.todaysAppointments.count}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
            {stats.todaysAppointments.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={stats.todaysAppointments.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {stats.todaysAppointments.growth} from yesterday
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Monthly Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 text-nowrap whitespace-nowrap">
                {formatCurrency(stats.monthlyRevenue?.amount || 0)}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
            {stats.monthlyRevenue?.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={stats.monthlyRevenue?.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {stats.monthlyRevenue?.growth || '0%'} from last month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                {user?.data?.roles?.[0] === 'doctor' ? 'Status' : 'Active Staff'}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 whitespace-nowrap">
                {stats.activeStaff.count}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
            <span className="text-gray-500">{stats.activeStaff.status}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 whitespace-nowrap">Recent Appointments</h3>
            <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">View All</button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentAppointments && recentAppointments.length > 0 ? (
              recentAppointments.slice(0, 3).map(appointment => (
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">{appointment.patientName}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{appointment.type} - {appointment.time}</p>
                    </div>
                  </div>
                  <span className={`mt-2 sm:mt-0 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No recent appointments</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 whitespace-nowrap">Quick Actions</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
            <button className="p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center ">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-blue-900 whitespace-nowrap">Add Patient</p>
            </button>
            <button className="p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center ">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-green-900 whitespace-nowrap">Schedule Appointment</p>
            </button>
            <button className="p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center ">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-purple-900 whitespace-nowrap">View Records</p>
            </button>
            <button className="p-3 sm:p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center ">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-orange-900 whitespace-nowrap">Generate Report</p>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 whitespace-nowrap">System Alerts</h3>
          <div className="space-y-2 sm:space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 ${getAlertBgColor(alert.type)} rounded-lg`}>
                {getAlertIcon(alert.icon)}
                <div>
                  <p className={`text-xs sm:text-sm font-medium ${getAlertTextColor(alert.type)} whitespace-nowrap`}>
                    {alert.title}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${getAlertSubTextColor(alert.type)}`}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Demo;