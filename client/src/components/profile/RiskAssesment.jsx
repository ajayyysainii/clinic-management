import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Stethoscope, Heart, Brain, Activity, ArrowLeft, Calendar, TrendingUp, FileText, Settings, AlertCircle } from 'lucide-react';
import LiverRiskAssessmentCalculator from '../riskAssessment/LiverRiskAssessmentCalculator';
import CoronaryHeartDiseaseRiskCalculator from '../riskAssessment/CoronaryHeartDiseaseRiskCalculator';
import DiabeticRiskCalculator from '../riskAssessment/DiabeticRiskCalculator';
import StrokeRiskAssessmentCalculator from '../riskAssessment/StrokeRiskAssessmentCalculator';
import CustomRiskAssessmentBuilder from '../riskAssessment/CustomRiskAssessmentBuilder';
import CustomRiskAssessmentForms from '../riskAssessment/CustomRiskAssessmentForms';
import CustomRiskAssessmentFiller from '../riskAssessment/CustomRiskAssessmentFiller';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

// const userId = "687eab0a72d7830b9fd47f40";

const RiskAssesment = ({ userId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCalculator, setSelectedCalculator] = useState(null);
  const [depressionList, setDepressionList] = useState([]);
  const [diabeticList, setDiabeticList] = useState([]);
  const [liverList, setLiverList] = useState([]);
  const [strokeList, setStrokeList] = useState([]);
  const [customFormResponses, setCustomFormResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customFormAction, setCustomFormAction] = useState(null);
  const [selectedCustomForm, setSelectedCustomForm] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authtoken");
    if (!token) return;
    setLoading(true);
    Promise.all([
      axios.get(`${BACKEND_URL}/depression/all?patientId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.post(`${BACKEND_URL}/diabetic/get-all`, { patientId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.post(`${BACKEND_URL}/liver/all`, { patientId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.post(`${BACKEND_URL}/stroke/get-all`, { patientId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`${BACKEND_URL}/custom-risk-assessment/patient/${userId}/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])
      .then(([depressionRes, diabeticRes, liverRes, strokeRes, customResponsesRes]) => {
        setDepressionList(Array.isArray(depressionRes.data.data) ? depressionRes.data.data : (depressionRes.data.assessments || []));
        setDiabeticList(Array.isArray(diabeticRes.data.data) ? diabeticRes.data.data : (diabeticRes.data.assessments || []));
        setLiverList(Array.isArray(liverRes.data.data) ? liverRes.data.data : (liverRes.data.assessments || []));
        setStrokeList(Array.isArray(strokeRes.data.data) ? strokeRes.data.data : (strokeRes.data.assessments || []));
        setCustomFormResponses(Array.isArray(customResponsesRes.data.data) ? customResponsesRes.data.data : (customResponsesRes.data.responses || []));
      })
      .catch(() => {
        // handle error
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Add validation for userId after hooks
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">User ID Required</h2>
            <p className="text-gray-600">Please ensure you are logged in and have a valid user ID.</p>
          </div>
        </div>
      </div>
    );
  }

  const specializations = [
    {
      id: 'gastroenterology',
      name: 'Gastroenterology',
      icon: Stethoscope,
      calculator: 'liver',
      description: 'Liver Risk Assessment',
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      id: 'cardiology',
      name: 'Cardiology',
      icon: Heart,
      calculator: 'coronary',
      description: 'Coronary Heart Disease Risk Assessment',
      color: 'from-red-400 to-pink-500',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      id: 'neurology',
      name: 'Neurology',
      icon: Brain,
      calculator: 'stroke',
      description: 'Stroke Risk Assessment',
      color: 'from-purple-400 to-indigo-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      id: 'endocrinology',
      name: 'Endocrinology',
      icon: Activity,
      calculator: 'diabetes',
      description: 'Diabetes Risk Assessment',
      color: 'from-green-400 to-blue-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      id: 'custom',
      name: 'Custom Forms',
      icon: Settings,
      calculator: 'custom',
      description: 'Custom Risk Assessment Forms',
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  const assessmentData = [
    {
      title: 'Depression Risk',
      list: depressionList,
      icon: Brain,
      color: 'purple',
      renderItem: (item) => `PHQ Score: ${item.phqScore}, Level: ${item.depressionLevel}`
    },
    {
      title: 'Diabetic Risk',
      list: diabeticList,
      icon: Activity,
      color: 'green',
      renderItem: (item) => `Total Score: ${item.totalScore}, Level: ${item.riskLevel}`
    },
    {
      title: 'Liver Risk',
      list: liverList,
      icon: Stethoscope,
      color: 'orange',
      renderItem: (item) => `Score: ${item.riskScore}, Level: ${item.riskLevel}`
    },
    {
      title: 'Stroke Risk',
      list: strokeList,
      icon: Heart,
      color: 'red',
      renderItem: (item) => `Lower: ${item.lowerRiskScore}, Higher: ${item.higherRiskScore}, Level: ${item.riskLevel}`
    },
    {
      title: 'Custom Forms',
      list: customFormResponses,
      icon: FileText,
      color: 'purple',
      renderItem: (item) => `${item.formId?.name || 'Custom Form'} - Score: ${item.calculatedScore || 'N/A'}, Level: ${item.riskLevel || 'N/A'}`
    }
  ];

  const handleSpecializationClick = (specialization) => {
    setSelectedCalculator(specialization.calculator);
    setShowDropdown(false);
  };

  const handleBackToMain = () => {
    setSelectedCalculator(null);
  };

  const renderCalculator = () => {
    switch (selectedCalculator) {
      case 'liver':
        return <LiverRiskAssessmentCalculator userId={userId} />;
      case 'coronary':
        return <CoronaryHeartDiseaseRiskCalculator userId={userId} />;
      case 'stroke':
        return <StrokeRiskAssessmentCalculator userId={userId} />;
      case 'diabetes':
        return <DiabeticRiskCalculator userId={userId} />;
      case 'custom':
        if (customFormAction === 'create') {
          return (
            <CustomRiskAssessmentBuilder
              onFormCreated={() => {
                setCustomFormAction(null);
              }}
              onClose={() => setCustomFormAction(null)}
            />
          );
        } else if (customFormAction === 'list') {
          return (
            <CustomRiskAssessmentForms
              onFormSelected={(action, form) => {
                if (action === 'create') {
                  setCustomFormAction('create');
                } else if (action === 'use' && form) {
                  setSelectedCustomForm(form);
                  setCustomFormAction('fill');
                }
              }}
              onClose={() => setCustomFormAction(null)}
            />
          );
        } else if (customFormAction === 'fill' && selectedCustomForm) {
          return (
            <CustomRiskAssessmentFiller
              form={selectedCustomForm}
              patientId={userId}
              onClose={() => {
                setCustomFormAction(null);
                setSelectedCustomForm(null);
              }}
              onSubmitted={() => {
                setCustomFormAction(null);
                setSelectedCustomForm(null);
              }}
            />
          );
        } else {
          return (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="h-8 w-8 text-purple-500" />
                <h2 className="text-2xl font-bold text-gray-800">Custom Risk Assessment Forms</h2>
              </div>
              <p className="text-gray-600 mb-6">Create and manage your own custom risk assessment forms</p>
              <div className="space-y-4">
                <button
                  onClick={() => setCustomFormAction('create')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Create New Form
                </button>
                <button
                  onClick={() => setCustomFormAction('list')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Manage Existing Forms
                </button>
              </div>
            </div>
          );
        }
      default:
        return null;
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (selectedCalculator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBackToMain}
              className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Risk Assessments
            </button>
          </div>
          
          {/* Calculator Content */}
          {renderCalculator()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 ">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white">
            <div className="flex items-center sm:flex-row flex-col justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Risk Assessment Center</h1>
                <p className="text-blue-100 text-lg">Comprehensive health risk evaluation tools</p>
              </div>
              
              {/* Add Assessment Button */}
              <div className="">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="group relative px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium shadow-lg hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  New Assessment
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment History */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assessment history...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assessmentData.map((assessment, index) => {
              const IconComponent = assessment.icon;
              const colorClasses = {
                purple: 'from-blue-500 to-blue-600',
                green: 'from-blue-500 to-blue-600',
                orange: 'from-blue-500 to-blue-600',
                red: 'from-blue-500 to-blue-600'
              };
              
              return (
                <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className={`bg-gradient-to-r ${colorClasses[assessment.color]} p-6 text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{assessment.title} Assessments</h3>
                        <p className="text-white/80">{assessment.list.length} total assessments</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {assessment.list.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No assessments yet</p>
                        <p className="text-sm text-gray-400">Start by creating your first assessment</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {assessment.list.slice(0, 5).map((item, itemIndex) => (
                          <div key={item._id || itemIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                {new Date(item.createdAt).toLocaleDateString()}
                              </div>
                              {item.riskLevel && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(item.riskLevel)}`}>
                                  {item.riskLevel}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{assessment.renderItem(item)}</p>
                          </div>
                        ))}
                        {assessment.list.length > 5 && (
                          <div className="text-center pt-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View all {assessment.list.length} assessments
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enhanced Dropdown Menu */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm" 
          onClick={() => setShowDropdown(false)}
        >
          <div 
            className="absolute top-2 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">Select Assessment Type</h3>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  aria-label="Close dropdown"
                >
                  <svg className="w-5 h-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {specializations.map((spec) => {
                  const IconComponent = spec.icon;
                  return (
                    <button
                      key={spec.id}
                      onClick={() => handleSpecializationClick(spec)}
                      className="w-full group relative overflow-hidden rounded-xl border border-gray-200 hover:border-transparent transition-all duration-300 hover:shadow-lg"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${spec.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      <div className="relative p-4 flex items-center gap-4">
                        <div className={`flex-shrink-0 p-3 ${spec.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className={`h-6 w-6 ${spec.iconColor}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                            {spec.name}
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                            {spec.description}
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssesment;
