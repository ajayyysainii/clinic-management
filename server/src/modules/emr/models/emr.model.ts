import { Schema, model, Document, Types } from 'mongoose'

// Interface for Address
interface Address {
  name: string
  street: string
  city: string
  state: string
  zipCode: string
}

// Schema for Address
const AddressSchema = new Schema<Address>({
  name: { type: String },
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
})

// Interface for BP
interface BP {
  sys: number
  dia: number
}

// Interface for General Physical Examination
interface GeneralPhysicalExamination {
  PR?: number
  BP?: BP
  volume?: string
  regularity?: string
  character?: string
  temperature?: string
  temperatureVal?: number
  RR?: number
  SPO2?: number
  radioFemoralDelay?: string
  height?: number
  weight?: number
  BMI?: number
  pallor?: string
  icterus?: string
  cyanosis?: string
  clubbing?: string
  lymphadenopathy?: string
  edema?: string
  JVP?: string
  doctorNotes?: string
  showInEPrescription?: boolean
}

// Schema for General Physical Examination
const GeneralPhysicalExaminationSchema = new Schema<GeneralPhysicalExamination>({
  PR: { type: Number },
  BP: {
    sys: Number,
    dia: Number,
  },
  volume: { type: String },
  regularity: { type: String },
  character: { type: String },
  temperature: { type: String },
  temperatureVal: { type: Number },
  RR: { type: Number },
  SPO2: { type: Number },
  radioFemoralDelay: { type: String },
  height: { type: Number },
  weight: { type: Number },
  BMI: { type: Number },
  pallor: { type: String },
  icterus: { type: String },
  cyanosis: { type: String },
  clubbing: { type: String },
  lymphadenopathy: { type: String },
  edema: { type: String },
  JVP: { type: String },
  doctorNotes: { type: String },
  showInEPrescription: {
    type: Boolean,
    default: true,
  },
})

// Interface for Systemic Examination
interface SystemicExamination {
  respiratorySystem?: string
  CVS?: string
  CNS?: string
  PA?: string
  otherSystemicFindings?: string
}

// Schema for Systemic Examination
const SystemicExaminationSchema = new Schema<SystemicExamination>({
  respiratorySystem: { type: String },
  CVS: { type: String },
  CNS: { type: String },
  PA: { type: String },
  otherSystemicFindings: { type: String },
})

// Interface for Medication in Surgical History
interface SurgicalHistoryMedication {
  medicationName: string
  dosage: string
  duration: string
  adverseEffects: string
  isContinued: boolean
  discontinuedDays: string
}

// Interface for Blood Transfusion in Surgical History
interface BloodTransfusion {
  required: boolean
  units?: number
  details: string
  patientBloodGroup: string
  transfusedBloodGroup: string
}

// Interface for Surgeon in Surgical History
interface Surgeon {
  name: string
  specialization: string
  contact: string
}

// Interface for Hospital in Surgical History
interface Hospital {
  name: string
  location: string
}

// Interface for Insurance in Surgical History
interface Insurance {
  covered: boolean
  providerName?: string
  claimFiled: boolean
  claimAmount?: string
  policyNumber?: string
}

// Interface for Surgical History
interface SurgicalHistory {
  surgeryName?: string
  indication?: string
  year?: number
  procedureType?: string
  recoveryTime?: string
  complications?: string
  onMedication: 'Yes' | 'No' | 'Diet controlled'
  medications?: SurgicalHistoryMedication[]
  bloodTransfusion: BloodTransfusion
  surgeon?: Surgeon
  hospital?: Hospital
  insurance?: Insurance
  notes?: string
  isActive: boolean
}

// Schema for Surgical History
const SurgicalHistorySchema = new Schema<SurgicalHistory>({
  surgeryName: { type: String },
  indication: { type: String },
  year: { type: Number },
  procedureType: { type: String },
  recoveryTime: { type: String },
  complications: { type: String },
  onMedication: {
    type: String,
    enum: ['Yes', 'No', 'Diet controlled'],
    default: 'No',
  },
  medications: [
    {
      medicationName: { type: String },
      dosage: { type: String },
      duration: { type: String },
      adverseEffects: { type: String },
      isContinued: { type: Boolean, default: true },
      discontinuedDays: { type: String },
    },
  ],
  bloodTransfusion: {
    required: { type: Boolean, default: false },
    units: { type: Number },
    details: { type: String, default: '' },
    patientBloodGroup: {
      type: String,
      enum: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-', 'not known', ''],
      default: '',
    },
    transfusedBloodGroup: {
      type: String,
      enum: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-', 'not known', ''],
      default: '',
    },
  },
  surgeon: {
    name: { type: String },
    specialization: { type: String },
    contact: { type: String },
  },
  hospital: {
    name: { type: String },
    location: { type: String },
  },
  insurance: {
    covered: { type: Boolean, default: false },
    providerName: { type: String },
    claimFiled: { type: Boolean, default: false },
    claimAmount: { type: String },
    policyNumber: { type: String },
  },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
})

// Interface for Family Member Medication
interface FamilyMemberMedication {
  medicationName: string
  duration: string
  frequency: string
  adverseEffects: string
}

// Interface for Family Member Surgical History
interface FamilyMemberSurgicalHistory {
  procedureName: string
  indication: string
  doctorName: string
  hospital: string
  year: number
  insuranceCovered: boolean
  insuranceProvider: string
  claimFiled: boolean
  claimAmount: string
  policyNumber: string
  onMedication: 'Yes' | 'No' | 'Diet controlled'
  medications: {
    medicationName: string
    duration: string
    frequency: string
  }[]
}

// Interface for Family Member
interface FamilyMember {
  isAlive: boolean
  condition?: string
  diagnosisTimeframe?: string
  onMedication: 'Yes' | 'No' | 'Diet controlled'
  medications: FamilyMemberMedication[]
  surgicalHistory: FamilyMemberSurgicalHistory[]
  reasonOfDeath?: string
  yearOfDeath?: number
}

// Interface for Family Conditions
interface FamilyConditions {
  suddenCardiacDeath: boolean
  diabetes: boolean
  hypertension: boolean
  alzheimers: boolean
  parkinsonsDisease: boolean
  liverCirrhosis: boolean
  cancer: boolean
  notes?: string
}

// Interface for Family History
interface FamilyHistory {
  father: FamilyMember
  mother: FamilyMember
  familyConditions: FamilyConditions
}

// Schema for Family History
const FamilyHistorySchema = new Schema<FamilyHistory>({
  father: {
    isAlive: { type: Boolean, default: true },
    condition: { type: String },
    diagnosisTimeframe: { type: String },
    onMedication: {
      type: String,
      enum: ['Yes', 'No', 'Diet controlled'],
      default: 'No',
    },
    medications: [
      {
        medicationName: { type: String },
        duration: { type: String },
        frequency: { type: String },
        adverseEffects: { type: String },
      },
    ],
    surgicalHistory: [
      {
        procedureName: { type: String },
        indication: { type: String },
        doctorName: { type: String },
        hospital: { type: String },
        year: { type: Number },
        insuranceCovered: { type: Boolean, default: false },
        insuranceProvider: { type: String },
        claimFiled: { type: Boolean, default: false },
        claimAmount: { type: String },
        policyNumber: { type: String },
        onMedication: {
          type: String,
          enum: ['Yes', 'No', 'Diet controlled'],
          default: 'No',
        },
        medications: [
          {
            medicationName: { type: String },
            duration: { type: String },
            frequency: { type: String },
          },
        ],
      },
    ],
    reasonOfDeath: { type: String },
    yearOfDeath: { type: Number },
  },
  mother: {
    isAlive: { type: Boolean, default: true },
    condition: { type: String },
    diagnosisTimeframe: { type: String },
    onMedication: {
      type: String,
      enum: ['Yes', 'No', 'Diet controlled'],
      default: 'No',
    },
    medications: [
      {
        medicationName: { type: String },
        duration: { type: String },
        frequency: { type: String },
        adverseEffects: { type: String },
      },
    ],
    surgicalHistory: [
      {
        procedureName: { type: String },
        indication: { type: String },
        doctorName: { type: String },
        hospital: { type: String },
        year: { type: Number },
        insuranceCovered: { type: Boolean, default: false },
        insuranceProvider: { type: String },
        claimFiled: { type: Boolean, default: false },
        claimAmount: { type: String },
        policyNumber: { type: String },
        onMedication: {
          type: String,
          enum: ['Yes', 'No', 'Diet controlled'],
          default: 'No',
        },
        medications: [
          {
            medicationName: { type: String },
            duration: { type: String },
            frequency: { type: String },
          },
        ],
      },
    ],
    reasonOfDeath: { type: String },
    yearOfDeath: { type: Number },
  },
  familyConditions: {
    suddenCardiacDeath: { type: Boolean, default: false },
    diabetes: { type: Boolean, default: false },
    hypertension: { type: Boolean, default: false },
    alzheimers: { type: Boolean, default: false },
    parkinsonsDisease: { type: Boolean, default: false },
    liverCirrhosis: { type: Boolean, default: false },
    cancer: { type: Boolean, default: false },
    notes: { type: String },
  },
})

// Interface for Past History Item
interface PastHistoryItem {
  sufferingFrom: string
  diagnosedIn: string
  onMedication: 'Yes' | 'No' | 'Diet controlled'
  drugName: string[]
  frequency: string[]
  fetchedFromEMR: boolean
  prescribedBy: string
  isActive: boolean[]
  referringDoctorName?: string
  pastHistoryNotes?: string
  anyAdverseReactions?: string
}

// Interface for Allergy Drug
interface AllergyDrug {
  drugName: string
  isContinued: boolean
  frequency: string
  duration: string
  fetchedFromEMR: boolean
}

// Interface for Allergy Prescription
interface AllergyPrescription {
  allergyName: string
  symptoms: string[]
  diagnosedBy: string
  triggers: string[]
  pastAllergyNotes: string
  pastAllergyPrescriptionBy: 'Doctor' | 'Patient'
  drugs: AllergyDrug[]
}

// Interface for Habits
interface Habits {
  smoking: boolean
  packYears?: number
  alcohol: boolean
  alcoholDetails?: string
  qntPerWeek?: number
  substanceAbuse?: string
}

// Interface for Stress Screening
interface StressScreening {
  desc: string
  recomendation: string
  score: number
}

// Interface for Depression Screening
interface DepressionScreening {
  desc: string
  recomendation: string
  score: number
}

// Interface for History
interface History {
  chiefComplaint?: string
  historyOfPresentingIllness?: string
  complaints: string[]
  pastHistory: PastHistoryItem[]
  surgicalHistory: SurgicalHistory[]
  familyHistory: FamilyHistory
  allergies: {
    pastAllergyPrescription: AllergyPrescription[]
    newAllergyPrescription: AllergyPrescription[]
  }
  previousSurgeries?: string
  habits: Habits
  bowelAndBladder?: string
  appetite?: string
  sleep?: number
  stressScreening?: StressScreening
  depressionScreening?: DepressionScreening
  mentalHealthAssessment?: string
}

// Schema for History
const HistorySchema = new Schema<History>({
  chiefComplaint: { type: String },
  historyOfPresentingIllness: { type: String },
  complaints: {
    type: [String],
    default: [],
  },
  pastHistory: [
    {
      sufferingFrom: { type: String },
      diagnosedIn: { type: String },
      onMedication: {
        type: String,
        enum: ['Yes', 'No', 'Diet controlled'],
        default: 'No',
      },
      drugName: [String],
      frequency: [String],
      fetchedFromEMR: { type: Boolean, default: true },
      prescribedBy: { type: String, default: 'Doctor' },
      isActive: [Boolean],
      referringDoctorName: { type: String },
      pastHistoryNotes: { type: String },
      anyAdverseReactions: { type: String },
    },
  ],
  surgicalHistory: [SurgicalHistorySchema],
  familyHistory: FamilyHistorySchema,
  allergies: {
    pastAllergyPrescription: [
      {
        allergyName: String,
        symptoms: [String],
        diagnosedBy: String,
        triggers: [String],
        pastAllergyNotes: String,
        pastAllergyPrescriptionBy: {
          type: String,
          enum: ['Doctor', 'Patient'],
          required: false,
          default: 'Doctor',
        },
        drugs: [
          {
            drugName: String,
            isContinued: { type: Boolean, default: true },
            frequency: String,
            duration: String,
            fetchedFromEMR: { type: Boolean, default: true },
          },
        ],
      },
    ],
    newAllergyPrescription: [
      {
        allergyName: String,
        symptoms: [String],
        diagnosedBy: String,
        triggers: [String],
        pastAllergyNotes: String,
        pastAllergyPrescriptionBy: {
          type: String,
          enum: ['Doctor', 'Patient'],
          required: false,
          default: 'Doctor',
        },
        drugs: [
          {
            drugName: String,
            isContinued: { type: Boolean, default: true },
            frequency: String,
            duration: String,
            fetchedFromEMR: { type: Boolean, default: true },
          },
        ],
      },
    ],
  },
  previousSurgeries: { type: String },
  habits: {
    smoking: { type: Boolean, default: false },
    packYears: { type: Number },
    alcohol: { type: Boolean, default: false },
    alcoholDetails: { type: String },
    qntPerWeek: { type: Number },
    substanceAbuse: { type: String },
  },
  bowelAndBladder: { type: String },
  appetite: { type: String },
  sleep: { type: Number },
  stressScreening: {
    desc: { type: String },
    recomendation: { type: String },
    score: { type: Number },
  },
  depressionScreening: {
    desc: { type: String },
    recomendation: { type: String },
    score: { type: Number },
  },
  mentalHealthAssessment: { type: String },
})

// Interface for Prescription
interface Prescription {
  investigations?: string
  drugName?: string
  frequency?: string
  duration?: string
  quantity?: string
  advice?: string
  routeOfAdministration?: string
  howToTake?: string
}

// Schema for prescription
const prescriptionSchema = new Schema<Prescription>({
  investigations: { type: String, trim: true },
  drugName: { type: String, trim: true },
  frequency: { type: String, trim: true },
  duration: { type: String, trim: true },
  quantity: { type: String, trim: true },
  advice: { type: String, trim: true },
  routeOfAdministration: { type: String, trim: true },
  howToTake: { type: String, trim: true },
})

// Interface for Diagnosis
interface Diagnosis {
  dateOfDiagnosis?: string
  diagnosisName?: string
  prescription: Prescription[]
}

// Schema for diagnosis
const diagnosisSchema = new Schema<Diagnosis>({
  dateOfDiagnosis: { type: String, trim: true },
  diagnosisName: { type: String, trim: true },
  prescription: [prescriptionSchema],
})

// Interface for Immunization Dose
interface ImmunizationDose {
  date: Date
  status: 'due' | 'completed'
}

// Interface for Immunization
interface Immunization {
  immunizationType: 'up to date' | 'adding' | 'recommended'
  vaccinationName: string
  totalDose: number
  doseDates: ImmunizationDose[]
  doctorName: string
  sideEffects: string
  immunizationNotes: string
}

// Schema for immunizations
const ImmunizationSchema = new Schema<Immunization>({
  immunizationType: {
    type: String,
    enum: ['up to date', 'adding', 'recommended'],
  },
  vaccinationName: { type: String, trim: true },
  totalDose: { type: Number, default: 1 },
  doseDates: [
    {
      date: { type: Date },
      status: { type: String, enum: ['due', 'completed'] },
    },
  ],
  doctorName: { type: String, trim: true },
  sideEffects: { type: String, trim: true },
  immunizationNotes: { type: String, trim: true },
})

// Interface for Basic Info
interface BasicInfo {
  name: string
  age?: number
  children?: number
  gender: 'M' | 'F'
  phoneNumber: string
  maritalStatus?: boolean
  bloodGroup?: 'A+' | 'B+' | 'AB+' | 'O+' | 'A-' | 'B-' | 'AB-' | 'O-' | 'not known'
  address: Address
}

// Interface for EMR Document
interface EMRDocument extends Document {
  user: Types.ObjectId
  clinic: Types.ObjectId
  link?: string
  doctor: Types.ObjectId
  basicInfo: BasicInfo
  history: History
  immunization: Immunization[]
  generalPhysicalExamination: GeneralPhysicalExamination
  systemicExamination: SystemicExamination
  diagnosis: Diagnosis[]
  advice?: string
  referrals?: string
  followUpSchedule?: string
  doctorNotes?: string
  consultationMode?: 'on site' | 'online' | 'home'
  emrPdfFileUrl?: string
  createdAt: Date
  updatedAt: Date
  images?: { url: string; remark: string }[]
}

// Schema for EMR
const EMRSchema = new Schema<EMRDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    clinic: { type: Schema.Types.ObjectId, ref: 'Clinic', required: false },
    link: { type: String },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    basicInfo: {
      name: { type: String, required: false },
      age: { type: Number },
      children: { type: Number },
      gender: {
        type: String,
        enum: ['M', 'F'],
        required: false,
      },
      phoneNumber: { type: String, required: false },
      maritalStatus: { type: Boolean },
      bloodGroup: {
        type: String,
        enum: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-', 'not known'],
      },
      address: AddressSchema,
    },
    history: HistorySchema,
    immunization: [ImmunizationSchema],
    generalPhysicalExamination: GeneralPhysicalExaminationSchema,
    systemicExamination: SystemicExaminationSchema,
    diagnosis: {
      type: [diagnosisSchema],
    },
    advice: { type: String },
    referrals: { type: String },
    followUpSchedule: { type: String },
    doctorNotes: { type: String },
    consultationMode: { type: String, enum: ['on site', 'online', 'home'] },
    emrPdfFileUrl: { type: String },
    images: [{
      url: { type: String },
      remark: { type: String }
    }],
  },
  { timestamps: true },
)

// Model for EMR
const EMR = model<EMRDocument>('EMR', EMRSchema)
export default EMR
