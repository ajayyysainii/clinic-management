import { Router } from 'express'
import { ClinicRouter } from './clinic/routes'
import { UserRouter } from './user/routes'
import { DoctorRouter } from './doctor/routes'
import { PatientRouter } from './patient/routes'
import { NotificationRouter } from './notification/routes'
import { AppointmentRouter } from './appointment/routes'
import { EmrRouter } from './emr/routes'
import { EprescriptionRouter } from './eprescription/routes'
import { InvoiceRouter } from './billing';
import { FormRouter } from './form/routes'
import { doctorDailyEarningsRoute } from './billing/doctor/routes'
import { staffBillingRoutes } from './billing/staff'
import { ConsentRouter } from './consent/routes'
import { StaffRouter } from './staff/routes'
import { InventoryRouter } from './inventory/routes'
import { servicesRoutes } from './services/routes'
import { analyticsRoutes } from './analytics'
import { liverRiskCalculatorRouter, coronaryHeartDiseaseRouter, depressionRiskCalculatorRouter, diabeticRiskCalculatorRouter, stressRiskCalculatorRouter, strokeRiskCalculatorRouter, customRiskAssessmentRouter } from './riskAssesments'
import { paymentRoutes } from './payment'
import { uploadRoutes } from './upload/routes'
// Import billing models to ensure they are registered with Mongoose
import './billing/models'
// import teleconsultationRoutes from '../modules/teleconsultation/routes/teleconsultation.route'

interface IModuleRoutesMapping {
  prefix: string
  router: Router
}

const MODULE_ROUTES_MAPPINGS: IModuleRoutesMapping[] = [
  {
    prefix: '/clinic',
    router: ClinicRouter,
  },
  {
    prefix: '/users',
    router: UserRouter,
  },
  {
    prefix: '/doctors',
    router: DoctorRouter,
  },
  {
    prefix: '/patients',
    router: PatientRouter,
  },
  {
    prefix: '/notifications',
    router: NotificationRouter,
  },
  {
    prefix: '/appointments',
    router: AppointmentRouter,
  },
  {
    prefix: '/emr',
    router: EmrRouter,
  },
  {
    prefix: '/prescription',
    router: EprescriptionRouter,
  },
  {
    prefix: '/patient/billing',
    router: InvoiceRouter,
  },
  {
    prefix: '/doctor/billing',
    router: doctorDailyEarningsRoute,
  },
  {
    prefix: '/staff/billing',
    router: staffBillingRoutes,
  },
  {
    prefix: '/forms',
    router: FormRouter,
  },
  {
    prefix: '/consent',
    router: ConsentRouter,
  },
  {
    prefix: '/staff',
    router: StaffRouter,
  },
  {
    prefix: '/liver',
    router: liverRiskCalculatorRouter,
  },
  {
    prefix: '/coronary',
    router: coronaryHeartDiseaseRouter,
  },
  {
    prefix: '/depression',
    router: depressionRiskCalculatorRouter,
  },
  {
    prefix: '/diabetic',
    router: diabeticRiskCalculatorRouter,
  },
  {
    prefix: '/stress',
    router: stressRiskCalculatorRouter,
  },
  {
    prefix: '/stroke',
    router: strokeRiskCalculatorRouter,
  },
  {
    prefix: '/custom-risk-assessment',
    router: customRiskAssessmentRouter,
  },
  {
    prefix: '/inventory',
    router: InventoryRouter,
  },
  {
    prefix: '/services',
    router: servicesRoutes,
  },
  {
    prefix: '/analytics',
    router: analyticsRoutes,
  },
  {
    prefix: '/payment',
    router: paymentRoutes,
  },
  {
    prefix: '/upload',
    router: uploadRoutes,
  },
  // {
  //   prefix: '/teleconsultation',
  //   router: teleconsultationRoutes,
  // },
]

export default MODULE_ROUTES_MAPPINGS


