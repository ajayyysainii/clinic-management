import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';
import { useAuth } from '../../hooks/useAuth';
import {
  User, Activity, Stethoscope, Search, Plus, Minus, Pill,
  FileText, TestTube, MessageCircle, Heart, Calendar,
  CheckCircle, Loader2, X, ArrowLeft, Trash2, ClipboardCheck,
  Thermometer, Ruler, Weight, Wind
} from 'lucide-react';

const PrescriptionPad = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');
  const userId = id;
  const { user } = useAuth();
  const doctorId = user?.data?._id;

  // Patient info
  const [patientInfo, setPatientInfo] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  // Form state
  const [vitals, setVitals] = useState({
    systolicBP: '', diastolicBP: '', temperature: '',
    spO2: '', pulse: '', respiratoryRate: '',
    height: '', weight: '',
  });
  const [bmi, setBmi] = useState('');

  // Medical history toggles
  const [medicalHistory, setMedicalHistory] = useState({
    diabetes: false, hypertension: false, hypothyroidism: false,
    alcohol: false, tobacco: false, smoke: false,
  });

  // Symptoms
  const [symptoms, setSymptoms] = useState('');

  // Diagnosis
  const [diagnoses, setDiagnoses] = useState([{ diagnosisName: '', dateOfDiagnosis: '' }]);

  // Medications
  const [medications, setMedications] = useState([{ drugName: '', freequency: '', duration: '', quantity: '' }]);

  // Lab tests
  const [labTests, setLabTests] = useState([{ name: '' }]);

  // Other
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [consultationMode, setConsultationMode] = useState('on site');

  // Images
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageRemarks, setImageRemarks] = useState([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Past prescriptions
  const [pastPrescriptions, setPastPrescriptions] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Fetch patient info
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem('authtoken');
        const res = await axios.get(`${BACKEND_URL}/patients/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.data?.length > 0) {
          setPatientInfo(res.data.data[0]);
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
      } finally {
        setLoadingPatient(false);
      }
    };
    fetchPatient();
  }, [userId]);

  // Fetch past prescriptions
  useEffect(() => {
    const fetchPast = async () => {
      setLoadingPast(true);
      try {
        const token = localStorage.getItem('authtoken');
        const res = await axios.get(`${BACKEND_URL}/prescription/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.data) {
          setPastPrescriptions(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching past prescriptions:', err);
      } finally {
        setLoadingPast(false);
      }
    };
    fetchPast();
  }, [userId]);

  // Auto-calculate BMI
  useEffect(() => {
    const h = parseFloat(vitals.height);
    const w = parseFloat(vitals.weight);
    if (h > 0 && w > 0) {
      const heightM = h / 100;
      setBmi((w / (heightM * heightM)).toFixed(1));
    } else {
      setBmi('');
    }
  }, [vitals.height, vitals.weight]);

  // Handlers
  const handleVitalChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const toggleHistory = (field) => {
    setMedicalHistory(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Diagnosis handlers
  const addDiagnosis = () => setDiagnoses(prev => [...prev, { diagnosisName: '', dateOfDiagnosis: '' }]);
  const removeDiagnosis = (i) => setDiagnoses(prev => prev.filter((_, idx) => idx !== i));
  const updateDiagnosis = (i, field, value) => {
    setDiagnoses(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  };

  // Medication handlers
  const addMedication = () => setMedications(prev => [...prev, { drugName: '', freequency: '', duration: '', quantity: '' }]);
  const removeMedication = (i) => setMedications(prev => prev.filter((_, idx) => idx !== i));
  const updateMedication = (i, field, value) => {
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  // Lab test handlers
  const addLabTest = () => setLabTests(prev => [...prev, { name: '' }]);
  const removeLabTest = (i) => setLabTests(prev => prev.filter((_, idx) => idx !== i));
  const updateLabTest = (i, value) => {
    setLabTests(prev => prev.map((t, idx) => idx === i ? { name: value } : t));
  };

  // Image handlers
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
    setImageRemarks(Array(files.length).fill(''));
  };

  const handleRemarkChange = (idx, value) => {
    setImageRemarks(prev => { const u = [...prev]; u[idx] = value; return u; });
  };

  // Clear form
  const clearForm = () => {
    setVitals({ systolicBP: '', diastolicBP: '', temperature: '', spO2: '', pulse: '', respiratoryRate: '', height: '', weight: '' });
    setMedicalHistory({ diabetes: false, hypertension: false, hypothyroidism: false, alcohol: false, tobacco: false, smoke: false });
    setSymptoms('');
    setDiagnoses([{ diagnosisName: '', dateOfDiagnosis: '' }]);
    setMedications([{ drugName: '', freequency: '', duration: '', quantity: '' }]);
    setLabTests([{ name: '' }]);
    setAdvice('');
    setFollowUp('');
    setConsultationMode('on site');
    setSelectedImages([]);
    setImagePreviews([]);
    setImageRemarks([]);
    setError('');
  };

  // Submit
  const handleFinishPrescription = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('authtoken');

      // Build BP string
      const bpString = vitals.systolicBP && vitals.diastolicBP
        ? `${vitals.systolicBP}/${vitals.diastolicBP}`
        : vitals.systolicBP || vitals.diastolicBP || '';

      // Auto-generate prescription ID
      const prescriptionID = `P-${Math.floor(1000 + Math.random() * 9000)}`;

      const formData = new FormData();
      formData.append('patient', userId);
      formData.append('doctor', doctorId);
      formData.append('date', new Date().toISOString());
      formData.append('prescriptionID', prescriptionID);
      formData.append('sx', symptoms);
      formData.append('vitals', JSON.stringify({ BP: bpString, PR: vitals.pulse, SpO2: vitals.spO2 }));
      formData.append('dx', JSON.stringify(diagnoses.filter(d => d.diagnosisName.trim())));
      formData.append('labTest', JSON.stringify(labTests.map(t => t.name).filter(n => n.trim())));
      formData.append('rx', JSON.stringify(medications.filter(m => m.drugName.trim())));
      formData.append('advice', advice);
      formData.append('followUpSchedule', followUp);
      formData.append('consultationMode', consultationMode);
      formData.append('originatedFromEmr', 'true');

      // Append images
      selectedImages.forEach(file => formData.append('images', file));
      formData.append('imageRemarks', JSON.stringify(imageRemarks));

      const response = await fetch(`${BACKEND_URL}/prescription/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      // Mark appointment as Completed if opened from appointments
      if (appointmentId) {
        try {
          await axios.put(`${BACKEND_URL}/appointments/update/${appointmentId}`, {
            status: 'Completed',
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error('Failed to update appointment status:', err);
        }
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Error submitting prescription:', err);
      setError('Failed to submit prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessContinue = () => {
    setShowSuccess(false);
    if (appointmentId) {
      navigate('/appointments');
    } else {
      navigate(-1);
    }
  };

  // Patient details
  const patientName = patientInfo?.userId?.name || 'Patient';
  const patientGender = patientInfo?.userId?.gender || '';
  const patientPhone = patientInfo?.userId?.phone || '';
  const patientDOB = patientInfo?.DOB;
  const patientAge = patientDOB
    ? Math.floor((Date.now() - new Date(patientDOB).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : '';
  const patientProfileImage = patientInfo?.userId?.profileImageUrl || '';

  const genderLabel = patientGender === 'male' ? 'M' : patientGender === 'female' ? 'F' : patientGender ? patientGender.charAt(0).toUpperCase() : '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prescription Saved!</h3>
              <p className="text-gray-600 mb-6">
                {appointmentId
                  ? 'Prescription saved and appointment marked as completed.'
                  : 'Your prescription has been created successfully.'}
              </p>
              <button onClick={handleSuccessContinue}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOP: Patient Header ─── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Go back">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            {loadingPatient ? (
              <div className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
            ) : (
              <div className="flex items-center gap-3">
                {patientProfileImage ? (
                  <img src={patientProfileImage} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-blue-100" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{patientName}</span>
                    {(patientAge || genderLabel) && (
                      <span className="text-sm text-gray-500">
                        {[patientAge ? `${patientAge}y` : '', genderLabel].filter(Boolean).join(' | ')}
                      </span>
                    )}
                  </div>
                  {patientPhone && <div className="text-xs text-gray-400">{patientPhone}</div>}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Prescription Pad</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full flex gap-6 p-6 pb-24">
        {/* ─── LEFT: Prescription Form ─── */}
        <div className="flex-1 space-y-5">

          {/* ── Section: Vitals ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="p-1.5 bg-blue-100 rounded-lg"><Activity className="w-4 h-4 text-blue-600" /></div>
              <h2 className="font-semibold text-gray-800">Vitals</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Systolic BP */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Systolic BP
                  </label>
                  <div className="relative">
                    <input type="number" value={vitals.systolicBP} onChange={e => handleVitalChange('systolicBP', e.target.value)}
                      placeholder="120" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-14" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">mmHg</span>
                  </div>
                </div>
                {/* Diastolic BP */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Diastolic BP
                  </label>
                  <div className="relative">
                    <input type="number" value={vitals.diastolicBP} onChange={e => handleVitalChange('diastolicBP', e.target.value)}
                      placeholder="80" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-14" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">mmHg</span>
                  </div>
                </div>
                {/* Temperature */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Thermometer className="w-3 h-3" /> Temperature
                  </label>
                  <div className="relative">
                    <input type="number" step="0.1" value={vitals.temperature} onChange={e => handleVitalChange('temperature', e.target.value)}
                      placeholder="98.6" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">°F</span>
                  </div>
                </div>
                {/* SpO2 */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Wind className="w-3 h-3" /> SpO2
                  </label>
                  <div className="relative">
                    <input type="number" value={vitals.spO2} onChange={e => handleVitalChange('spO2', e.target.value)}
                      placeholder="98" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                </div>
                {/* Pulse */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Pulse
                  </label>
                  <div className="relative">
                    <input type="number" value={vitals.pulse} onChange={e => handleVitalChange('pulse', e.target.value)}
                      placeholder="72" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/min</span>
                  </div>
                </div>
                {/* Respiratory Rate */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Wind className="w-3 h-3" /> Respiratory Rate
                  </label>
                  <div className="relative">
                    <input type="number" value={vitals.respiratoryRate} onChange={e => handleVitalChange('respiratoryRate', e.target.value)}
                      placeholder="16" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-12" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/min</span>
                  </div>
                </div>
                {/* Height */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> Height
                  </label>
                  <div className="relative">
                    <input type="number" value={vitals.height} onChange={e => handleVitalChange('height', e.target.value)}
                      placeholder="170" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Cms</span>
                  </div>
                </div>
                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Weight className="w-3 h-3" /> Weight
                  </label>
                  <div className="relative">
                    <input type="number" value={vitals.weight} onChange={e => handleVitalChange('weight', e.target.value)}
                      placeholder="70" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Kgs</span>
                  </div>
                </div>
                {/* BMI (auto) */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">BMI</label>
                  <div className="relative">
                    <input type="text" value={bmi} readOnly placeholder="—"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 pr-14" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kg/m²</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section: Patient Medical History ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => setHistoryExpanded(!historyExpanded)}
              className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg"><ClipboardCheck className="w-4 h-4 text-red-600" /></div>
                <h2 className="font-semibold text-gray-800">Patient Medical History</h2>
              </div>
              <span className="text-gray-400 text-sm">{historyExpanded ? '▲' : '▼'}</span>
            </button>
            {historyExpanded && (
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries({
                    diabetes: 'Diabetes mellitus', hypertension: 'Hypertension', hypothyroidism: 'Hypothyroidism',
                    alcohol: 'Alcohol', tobacco: 'Tobacco', smoke: 'Smoke',
                  }).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => toggleHistory(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        medicalHistory[key]
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${medicalHistory[key] ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Section: Symptoms (Sx) ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="p-1.5 bg-blue-100 rounded-lg"><Stethoscope className="w-4 h-4 text-blue-600" /></div>
              <h2 className="font-semibold text-gray-800">Symptoms</h2>
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Sx</span>
            </div>
            <div className="p-5">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea rows={2} value={symptoms} onChange={e => setSymptoms(e.target.value)}
                  placeholder="Start typing Symptoms / Chief Complaints"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" />
              </div>
            </div>
          </section>

          {/* ── Section: Diagnosis (Dx) ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg"><ClipboardCheck className="w-4 h-4 text-green-600" /></div>
                <h2 className="font-semibold text-gray-800">Diagnosis</h2>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Dx</span>
              </div>
              <button type="button" onClick={addDiagnosis}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="p-5 space-y-3">
              {diagnoses.map((dx, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-1">
                    <input type="text" value={dx.diagnosisName} onChange={e => updateDiagnosis(i, 'diagnosisName', e.target.value)}
                      placeholder="Start typing Diagnosis"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  </div>
                  <input type="date" value={dx.dateOfDiagnosis} onChange={e => updateDiagnosis(i, 'dateOfDiagnosis', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-40" />
                  {diagnoses.length > 1 && (
                    <button type="button" onClick={() => removeDiagnosis(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Section: Medicines (Rx) ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg"><Pill className="w-4 h-4 text-purple-600" /></div>
                <h2 className="font-semibold text-gray-800">Medicines</h2>
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Rx</span>
              </div>
              <button type="button" onClick={addMedication}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="p-5 space-y-3">
              {medications.map((med, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-start">
                  <input type="text" value={med.drugName} onChange={e => updateMedication(i, 'drugName', e.target.value)}
                    placeholder="Medicine name"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  <input type="text" value={med.freequency} onChange={e => updateMedication(i, 'freequency', e.target.value)}
                    placeholder="e.g. 1-0-1"
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  <input type="text" value={med.duration} onChange={e => updateMedication(i, 'duration', e.target.value)}
                    placeholder="e.g. 7 days"
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  <input type="text" value={med.quantity} onChange={e => updateMedication(i, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  {medications.length > 1 && (
                    <button type="button" onClick={() => removeMedication(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Section: Lab Tests ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg"><TestTube className="w-4 h-4 text-amber-600" /></div>
                <h2 className="font-semibold text-gray-800">Lab Tests</h2>
              </div>
              <button type="button" onClick={addLabTest}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="p-5 space-y-3">
              {labTests.map((test, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={test.name} onChange={e => updateLabTest(i, e.target.value)}
                    placeholder="Enter lab test name"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  {labTests.length > 1 && (
                    <button type="button" onClick={() => removeLabTest(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Section: Advice ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="p-1.5 bg-teal-100 rounded-lg"><MessageCircle className="w-4 h-4 text-teal-600" /></div>
              <h2 className="font-semibold text-gray-800">Advice</h2>
            </div>
            <div className="p-5">
              <textarea rows={3} value={advice} onChange={e => setAdvice(e.target.value)}
                placeholder="Enter medical advice or instructions"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" />
            </div>
          </section>

          {/* ── Section: Follow-up & Mode ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="p-1.5 bg-indigo-100 rounded-lg"><Calendar className="w-4 h-4 text-indigo-600" /></div>
              <h2 className="font-semibold text-gray-800">Follow-up & Mode</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Follow-up Schedule</label>
                <input type="text" value={followUp} onChange={e => setFollowUp(e.target.value)}
                  placeholder="e.g. After 1 week"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Consultation Mode</label>
                <div className="flex gap-2">
                  {[{ value: 'on site', label: 'On-site' }, { value: 'online', label: 'Online' }].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setConsultationMode(opt.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        consultationMode === opt.value
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section: Images ── */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="p-1.5 bg-pink-100 rounded-lg"><FileText className="w-4 h-4 text-pink-600" /></div>
              <h2 className="font-semibold text-gray-800">Upload Images</h2>
            </div>
            <div className="p-5 space-y-3">
              <input type="file" accept="image/*" multiple onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-2">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="flex flex-col items-center w-28">
                      <div className="w-20 h-20 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 mb-1">
                        <img src={src} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                      </div>
                      <input type="text" placeholder="Remark" value={imageRemarks[idx] || ''} onChange={e => handleRemarkChange(idx, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ─── RIGHT: Past Visits Sidebar ─── */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 sticky top-20">
            <div className="px-4 py-3 bg-blue-600 rounded-t-xl">
              <h3 className="text-sm font-semibold text-white">Past Visits</h3>
            </div>
            <div className="px-4 py-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {loadingPast ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                </div>
              ) : pastPrescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No past visits found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastPrescriptions.slice(0, 10).map((rx, i) => (
                    <div key={rx._id || i} className="border-l-2 border-blue-400 pl-3 pb-3">
                      <div className="text-xs font-semibold text-blue-600 mb-1">
                        {rx.date ? new Date(rx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A'}
                      </div>
                      {rx.sx && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-gray-500">Symptoms</span>
                          <p className="text-xs text-gray-700 truncate">{rx.sx}</p>
                        </div>
                      )}
                      {rx.dx?.length > 0 && rx.dx[0].diagnosisName && (
                        <div className="mb-1">
                          <span className="text-xs font-medium text-gray-500">Diagnosis</span>
                          <p className="text-xs text-gray-700 truncate">{rx.dx.map(d => d.diagnosisName).filter(Boolean).join(', ')}</p>
                        </div>
                      )}
                      {rx.rx?.length > 0 && rx.rx[0].drugName && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Medicines</span>
                          <p className="text-xs text-gray-700 truncate">{rx.rx.map(m => m.drugName).filter(Boolean).join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM: Sticky Toolbar ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={clearForm}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              Clear
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <X className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" disabled={isSubmitting} onClick={handleFinishPrescription}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              }`}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><ArrowLeft className="w-4 h-4 rotate-180" /> Finish Prescription</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPad;
