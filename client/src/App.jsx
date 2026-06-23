import Login from "./components/auth/Login";
import Dashboard from "./components/layout/Dashboard";
import { isAuthenticated } from "./utils/authUtils";
import { Routes, Route, Navigate } from "react-router";
import Profile from "./components/profile/Profile";
import DoctorProfile from "./components/profile/DoctorProfile";
import DoctorList from "./components/DoctorList";
import CreateConsentForm from './components/consent/CreateConsentForm';
import DoctorRegisterationForm from "./components/doctor/DoctorRegisterationForm";
import PatientList from "./components/patients/PatientList";
import PatientForm from "./components/patients/PatientForm";
import Appointments from "./components/doctor/Appointments";
import AddAppointment from "./components/appointment/AddAppointment";
import ClinicOnboarding from "./ClinicOnboarding";
import EMRComponent from "./components/Emr";
import EPrescriptionForm from "./components/EPrescription";
import PrescriptionPad from "./components/prescription/PrescriptionPad";
import Demo from "./components/Demo";
import { InvoiceForm } from "./components/billing";
import InvoiceList from "./components/billing/InvoiceList";
import GstClinic from "./components/GST/GstClinic";
import DoctorPayoutList from "./components/doctor/DoctorPayoutList";
import ConsentList from "./components/consent/ConsentList";
import ReferralForm from "./components/Referral Form/ReferralForm";
import ReferralList from './components/Referral Form/ReferralList'
import StaffRegisterationForm from "./components/staff/StaffRegisterationForm";
import StaffList from "./components/staff/StaffList";
import StaffPayoutList from "./components/staff/StaffPayoutList";
import LiverRiskAssessmentCalculator from "./components/riskAssessment/LiverRiskAssessmentCalculator";
import StrokeRiskAssessmentCalculator from "./components/riskAssessment/StrokeRiskAssessmentCalculator";
import DiabeticRiskCalculator from "./components/riskAssessment/DiabeticRiskCalculator";
import CoronaryHeartDiseaseRiskCalculator from "./components/riskAssessment/CoronaryHeartDiseaseRiskCalculator";
import TeleConsultation from "./components/teleConsultation/TeleConsultation";
import PatientTeleConsultation from "./components/teleConsultation/PatientTeleConsultation";
import Account from './components/Account'
import DoctorTeleConsultation from "./components/teleConsultation/TeleConsultation copy";
import Inventory from "./components/inventory/Inventory";
import ServicesList from "./components/services/ServicesList";
import ServiceForm from "./components/services/ServiceForm";
import DoctorDailyEarnings from "./components/doctor/DoctorDailyEarnings";
import ClinicDailyEarnings from "./components/doctor/ClinicDailyEarnings";
import TestEarningsCalculation from "./components/doctor/TestEarningsCalculation";
import { CertificateList } from "./components/CertificateForm";
import CertificateForm from "./components/CertificateForm/CertificateForm";
import CertificateFormPage from "./components/CertificateForm/CertificateFormPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};


const DashboardHome = () => {
  return (
    <div className="p-6">
      {/* <Appointments  /> */}
      <Demo  />
      
    </div>
  );
};

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/" replace />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Default Dashboard Route */}
          <Route index element={<DashboardHome />} />
          <Route path="doctor-list" element={<DoctorList />} />
          <Route path="patient-list" element={<PatientList />} />
          <Route path="add-doctor" element={<DoctorRegisterationForm />} />
          <Route path="add-patient" element={<PatientForm />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="create-appointment/:patientId" element={<AddAppointment />} />
          <Route path="create-emr/:patientId" element={<EMRComponent />} />
          <Route path="create-prescription/:patientId" element={<EPrescriptionForm />} />
          <Route path="clinics" element={<ClinicOnboarding />} />
          <Route path="invoice-list" element={<InvoiceList />} />
          <Route path="payout-list" element={<DoctorPayoutList />} />
          <Route path="staff-payout-list" element={<StaffPayoutList />} />
          <Route path="profile/patient/:id" element={<Profile />} />
          <Route path="profile/doctor/:id" element={<DoctorProfile />} />
          <Route path="prescription/:id" element={<EPrescriptionForm />} />
          <Route path="prescription-pad/:id" element={<PrescriptionPad />} />
          <Route path="emr/:id" element={<EMRComponent />} />
          <Route path="gst-clinics" element={<GstClinic />} />
          <Route path="clinics" element={<ClinicOnboarding />} />
          <Route path="consent/create" element={<CreateConsentForm />} />
          <Route path="form/referral" element={<ReferralForm />} />
          <Route path="form/referral-list" element={<ReferralList />} />
          <Route path="form/consent-list" element={<ConsentList />} />
          <Route path="form/certificates" element={<CertificateList />} />
          <Route path="form/create-certificate" element={<CertificateFormPage />} />
          <Route path="staffs" element={<StaffRegisterationForm />} /> 
          <Route path="list/staffs" element={<StaffList />} />
          <Route path="liver" element={<LiverRiskAssessmentCalculator />} />
          <Route path="stroke" element={<StrokeRiskAssessmentCalculator />} />
          <Route path="diabetic" element={<DiabeticRiskCalculator />} />
          <Route path="coronary" element={<CoronaryHeartDiseaseRiskCalculator />} />
          <Route path="tele-consultation" element={<TeleConsultation />} />
          <Route path="teleconsultation/patient/:appointmentId" element={<PatientTeleConsultation />} />
          <Route path="teleconsultation/doctor" element={<DoctorTeleConsultation />} />
          <Route path="account" element={<Account />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="services-list" element={<ServicesList />} />
          <Route path="add-service" element={<ServiceForm />} />
          <Route path="edit-service/:id" element={<ServiceForm />} />
          <Route path="doctor-earnings/:doctorId/:clinicId" element={<DoctorDailyEarnings />} />
          <Route path="clinic-earnings/:clinicId" element={<ClinicDailyEarnings />} />
          <Route path="test-earnings" element={<TestEarningsCalculation />} />
          <Route path="certificate" element={<CertificateForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
 
        {/* Standalone InvoiceForm route without Dashboard layout */}
        <Route path="/add-invoice" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;