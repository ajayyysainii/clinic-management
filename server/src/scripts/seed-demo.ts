import path from 'path'
import dotenv from 'dotenv'
import mongoose, { Model } from 'mongoose'
import { hashPassword } from '../utils/password'
import Clinic from '../modules/clinic/models/clinic.model'
import User from '../modules/user/models/user.model'
import DoctorMeta from '../modules/doctor/models/doctor.model'
import StaffMeta from '../modules/staff/models/staffMeta.model'
import { ClinicPatient } from '../modules/patient/models/clinicPatient.model'
import { PatientVisitDoctors } from '../modules/patient/models/patientVisitDoctor'
import { Service } from '../modules/services/models/services.model'
import { Inventory } from '../modules/inventory/models/inventory.model'
import Invoice from '../modules/billing/patient/models/invoice.model'
import { InvoiceItem } from '../modules/billing/patient/models/invoiceItem.model'
import InvoicePayment from '../modules/billing/patient/models/invoicePayment.model'
import { EPrescription } from '../modules/eprescription/models/eprescription.model'
import EMR from '../modules/emr/models/emr.model'
import { ConsentForm } from '../modules/consent/models/consent.model'
import { ReferralForm } from '../modules/form/models/referral.model'
import { Certificate } from '../modules/form/models/certificate.model'
import { Notification } from '../modules/notification/models/notification.model'
import { DoctorPayoutConfig } from '../modules/billing/doctor/models/doctorPayoutConfig.model'
import { DoctorDailyEarning } from '../modules/billing/doctor/models/doctorDailyEarning.model'
import { StaffPayoutConfig } from '../modules/billing/staff/models/staffPayoutConfig.model'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const DEMO_PASSWORD = 'Demo@123'
const DEMO_EMAIL = 'admin@demo.prevacare.in'

const at = (daysFromToday: number, hour = 10, minute = 0): Date => {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  date.setDate(date.getDate() + daysFromToday)
  return date
}

const yearsAgo = (years: number, month: number, day: number): Date => {
  const now = new Date()
  return new Date(now.getFullYear() - years, month, day)
}

async function upsert<T>(model: Model<T>, filter: Record<string, unknown>, data: Record<string, unknown>): Promise<any> {
  return model.findOneAndUpdate(filter, { $set: data }, { upsert: true, new: true, runValidators: true })
}

async function seed(): Promise<void> {
  const dbUri = process.env.DB_URI
  if (!dbUri) throw new Error('DB_URI is missing. Add it to server/.env before running the demo seed.')

  await mongoose.connect(dbUri)
  console.log('Connected to MongoDB')

  const password = await hashPassword(DEMO_PASSWORD)
  const targetAccountEmail = process.env.SEED_TARGET_EMAIL?.trim().toLowerCase()
  const targetAccount = targetAccountEmail
    ? await User.findOne({ email: targetAccountEmail, deletedAt: null })
    : null

  if (targetAccountEmail && !targetAccount) {
    throw new Error(`No active account found for ${targetAccountEmail}`)
  }

  const seedNamespace = targetAccount?._id.toString().slice(-6)
  const accountScopedEmail = (email: string): string => seedNamespace
    ? email.replace('@demo.prevacare.in', `.${seedNamespace}@demo.prevacare.in`)
    : email
  const recordNamespace = seedNamespace ? `${seedNamespace.toUpperCase()}-` : ''
  const clinicEmail = seedNamespace
    ? `clinic.${seedNamespace}@demo.prevacare.in`
    : 'hello@demo.prevacare.in'

  let clinic = targetAccount?.clinic ? await Clinic.findById(targetAccount.clinic) : null
  if (!clinic) clinic = await upsert(Clinic, { email: clinicEmail }, {
    name: targetAccount ? 'Sanjeevani Health Centre (Demo)' : 'Aarogya Family Clinic (Demo)',
    email: clinicEmail,
    phone: '+91 90000 00001',
    ownerName: targetAccount?.name || 'Dr. Ananya Sharma',
    website: 'https://demo.prevacare.in',
    status: 'active',
    type: 'organization',
    membership: 'Demo Plus',
    haveCustomMembership: false,
    panNumber: 'ABCDE1234F',
    gstNumber: '27ABCDE1234F1Z5',
    availableLocations: [{
      place: targetAccount ? 'Sanjeevani Health Centre' : 'Aarogya Family Clinic',
      street: '18, Baner Road, near Orchid School',
      city: 'Pune',
      state: 'Maharashtra',
      zipCode: '411045',
      status: 'active',
      membership: 'Demo Plus',
    }],
  })

  if (!clinic) throw new Error('Unable to find or create a clinic for the demo data')

  const admin = targetAccount
    ? await User.findByIdAndUpdate(targetAccount._id, { $set: { clinic: clinic._id } }, { new: true })
    : await upsert(User, { email: DEMO_EMAIL }, {
        name: 'Ananya Sharma',
        email: DEMO_EMAIL,
        phone: '+91 90000 00002',
        password,
        roles: ['clinic-admin'],
        clinic: clinic._id,
        gender: 'Female',
        bloodGroup: 'O+',
        deletedAt: null,
      })

  if (!admin) throw new Error('Unable to attach the target account to the demo clinic')

  const doctorData = [
    {
      name: 'Dr. Arjun Mehta', email: accountScopedEmail('arjun.mehta@demo.prevacare.in'), phone: '+91 90000 00011',
      gender: 'Male', bloodGroup: 'B+', experience: 12,
      bio: 'Consultant physician focused on diabetes, hypertension, and preventive medicine.',
      specializations: ['General Medicine', 'Diabetology'], degrees: ['MBBS', 'MD (Medicine)'],
    },
    {
      name: 'Dr. Kavya Iyer', email: accountScopedEmail('kavya.iyer@demo.prevacare.in'), phone: '+91 90000 00012',
      gender: 'Female', bloodGroup: 'A+', experience: 9,
      bio: 'Paediatrician providing newborn, child health, and vaccination care.',
      specializations: ['Paediatrics'], degrees: ['MBBS', 'DCH', 'DNB (Paediatrics)'],
    },
    {
      name: 'Dr. Rohan Kulkarni', email: accountScopedEmail('rohan.kulkarni@demo.prevacare.in'), phone: '+91 90000 00013',
      gender: 'Male', bloodGroup: 'AB+', experience: 15,
      bio: 'Orthopaedic consultant specialising in sports injuries and joint care.',
      specializations: ['Orthopaedics', 'Sports Medicine'], degrees: ['MBBS', 'MS (Orthopaedics)'],
    },
  ]

  const doctors: any[] = []
  for (const item of doctorData) {
    const doctor = await upsert(User, { email: item.email }, {
      name: item.name, email: item.email, phone: item.phone, password,
      roles: ['doctor'], clinic: clinic._id, gender: item.gender, bloodGroup: item.bloodGroup, deletedAt: null,
    })
    const meta = await upsert(DoctorMeta, { user_id: doctor._id }, {
      user_id: doctor._id,
      bio: item.bio,
      yearsOfExperience: item.experience,
      specializations: item.specializations,
      degrees: item.degrees.map((title) => ({ title, degrees_image_url: '' })),
      certificates: [],
      availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => ({
        day, slots: [{ startTime: '09:30', endTime: '13:00' }, { startTime: '17:00', endTime: '20:00' }],
      })),
    })
    doctors.push({ user: doctor, meta })
  }

  const staffData = [
    { name: 'Neha Patil', email: accountScopedEmail('neha.patil@demo.prevacare.in'), phone: '+91 90000 00021', gender: 'Female', degree: 'B.Sc Nursing' },
    { name: 'Vikram Singh', email: accountScopedEmail('vikram.singh@demo.prevacare.in'), phone: '+91 90000 00022', gender: 'Male', degree: 'Diploma in Medical Laboratory Technology' },
  ]
  const staff: any[] = []
  for (const item of staffData) {
    const user = await upsert(User, { email: item.email }, {
      name: item.name, email: item.email, phone: item.phone, password,
      roles: ['staff'], clinic: clinic._id, gender: item.gender, bloodGroup: 'Not Known', deletedAt: null,
    })
    const meta = await upsert(StaffMeta, { user_id: user._id }, {
      user_id: user._id, degrees: [{ name: item.degree, image_url: '' }],
    })
    staff.push({ user, meta })
  }

  const patientData = [
    { name: 'Aarav Deshmukh', email: accountScopedEmail('aarav.deshmukh@demo.prevacare.in'), phone: '+91 90000 00101', gender: 'Male', bloodGroup: 'B+', age: 38, triage: 'follow-up', bp: '138/88', weight: 82, height: 176, pulse: 78, temp: 98.4, hba1c: 7.1, glucose: 146, spo2: 98, note: 'Type 2 diabetes; quarterly HbA1c review.' },
    { name: 'Meera Nair', email: accountScopedEmail('meera.nair@demo.prevacare.in'), phone: '+91 90000 00102', gender: 'Female', bloodGroup: 'O+', age: 45, triage: 'normal', bp: '126/82', weight: 64, height: 162, pulse: 74, temp: 98.2, hba1c: 5.6, glucose: 101, spo2: 99, note: 'Annual preventive health check.' },
    { name: 'Ishaan Verma', email: accountScopedEmail('ishaan.verma@demo.prevacare.in'), phone: '+91 90000 00103', gender: 'Male', bloodGroup: 'A+', age: 8, triage: 'normal', bp: '104/68', weight: 27, height: 130, pulse: 88, temp: 99.1, hba1c: 5.2, glucose: 92, spo2: 99, note: 'Seasonal allergy and vaccination review.' },
    { name: 'Sanya Gupta', email: accountScopedEmail('sanya.gupta@demo.prevacare.in'), phone: '+91 90000 00104', gender: 'Female', bloodGroup: 'AB+', age: 29, triage: 'follow-up', bp: '118/76', weight: 58, height: 165, pulse: 72, temp: 98.3, hba1c: 5.4, glucose: 96, spo2: 99, note: 'Follow-up after ankle sprain.' },
    { name: 'Rajesh Yadav', email: accountScopedEmail('rajesh.yadav@demo.prevacare.in'), phone: '+91 90000 00105', gender: 'Male', bloodGroup: 'O-', age: 56, triage: 'follow-up', bp: '152/94', weight: 86, height: 171, pulse: 82, temp: 98.6, hba1c: 6.2, glucose: 118, spo2: 97, note: 'Hypertension; monitor home BP readings.' },
    { name: 'Fatima Khan', email: accountScopedEmail('fatima.khan@demo.prevacare.in'), phone: '+91 90000 00106', gender: 'Female', bloodGroup: 'B-', age: 34, triage: 'normal', bp: '112/74', weight: 61, height: 160, pulse: 76, temp: 98.8, hba1c: 5.3, glucose: 94, spo2: 98, note: 'Recurrent migraine evaluation.' },
    { name: 'Aditya Joshi', email: accountScopedEmail('aditya.joshi@demo.prevacare.in'), phone: '+91 90000 00107', gender: 'Male', bloodGroup: 'A-', age: 42, triage: 'emergency', bp: '146/90', weight: 79, height: 174, pulse: 96, temp: 100.2, hba1c: 5.8, glucose: 109, spo2: 96, note: 'Acute fever with dehydration; same-day review.' },
    { name: 'Lakshmi Reddy', email: accountScopedEmail('lakshmi.reddy@demo.prevacare.in'), phone: '+91 90000 00108', gender: 'Female', bloodGroup: 'O+', age: 67, triage: 'follow-up', bp: '134/84', weight: 68, height: 156, pulse: 80, temp: 98.5, hba1c: 6.6, glucose: 128, spo2: 97, note: 'Osteoarthritis and pre-diabetes follow-up.' },
  ]

  const patients: any[] = []
  for (let index = 0; index < patientData.length; index += 1) {
    const item = patientData[index]
    const user = await upsert(User, { email: item.email }, {
      name: item.name, email: item.email, phone: item.phone, password,
      roles: ['patient'], clinic: clinic._id, gender: item.gender, bloodGroup: item.bloodGroup, deletedAt: null,
    })
    const clinicPatient = await upsert(ClinicPatient, { clinicId: clinic._id, userId: user._id, relationship: 'self' }, {
      clinicId: clinic._id,
      userId: user._id,
      DOB: yearsAgo(item.age, (index * 2) % 12, 4 + index),
      triage: item.triage,
      visitDates: [at(-45 + index * 3), at(index % 3 - 1)],
      assignedDoctors: [doctors[index % doctors.length].user._id.toString()],
      bloodPressure: item.bp,
      weight: item.weight,
      height: item.height,
      heartRate: item.pulse,
      temperature: item.temp,
      hba1c: item.hba1c,
      bloodGlucose: item.glucose,
      spO2: item.spo2,
      notes: item.note,
      relationship: 'self',
      deletedAt: null,
    })
    patients.push({ user, clinicPatient, ...item })
  }

  const services = [
    ['General Physician Consultation', 'Comprehensive consultation with a physician.', 'consultation', 700, 600, 30],
    ['Paediatric Consultation', 'Child health consultation and growth assessment.', 'consultation', 800, 700, 30],
    ['Orthopaedic Consultation', 'Bone, joint, and sports injury assessment.', 'consultation', 1000, 850, 30],
    ['Complete Blood Count', 'CBC laboratory test with digital report.', 'test', 450, 400, 15],
    ['HbA1c Test', 'Three-month average blood glucose assessment.', 'test', 650, 550, 15],
    ['ECG', '12-lead resting electrocardiogram.', 'procedure', 700, 600, 20],
    ['Wound Dressing', 'Sterile wound cleaning and dressing.', 'treatment', 500, 400, 25],
  ]
  for (const [serviceName, description, category, basePrice, sellingPrice, duration] of services) {
    await upsert(Service, { clinicId: clinic._id, serviceName }, {
      clinicId: clinic._id, serviceName, description, category, basePrice, sellingPrice, duration,
      isActive: true, deletedAt: null,
    })
  }

  const inventoryData = [
    ['Paracetamol 500 mg', 'medicine', 240, 'pieces', 80, 'MedPlus Distribution', 1.2, 2.0, 300, 'Rack A1'],
    ['Metformin 500 mg', 'medicine', 120, 'pieces', 50, 'HealthKart Pharma', 1.8, 3.0, 540, 'Rack A2'],
    ['Disposable Syringe 5 ml', 'consumables', 38, 'pieces', 40, 'Pune Surgical House', 4, 7, 720, 'Rack B1'],
    ['Nitrile Examination Gloves', 'supplies', 16, 'boxes', 10, 'CarePro Medicals', 310, 400, 900, 'Store S1'],
    ['Digital Thermometer', 'equipment', 8, 'pieces', 5, 'CarePro Medicals', 180, 275, 1080, 'Cabinet E1'],
    ['Sterile Gauze Pack', 'consumables', 12, 'packs', 15, 'Pune Surgical House', 42, 65, 240, 'Rack B2'],
  ]
  for (let index = 0; index < inventoryData.length; index += 1) {
    const [itemName, category, quantity, unit, minQuantity, supplier, costPrice, sellingPrice, expiryDays, location] = inventoryData[index]
    await upsert(Inventory, { clinicId: clinic._id, itemName }, {
      clinicId: clinic._id, itemName, category, quantity, unit, minQuantity, supplier,
      supplierContact: `+91 90000 0020${index + 1}`, costPrice, sellingPrice,
      expiryDate: at(Number(expiryDays)), location, sku: `DEMO-${String(index + 1).padStart(3, '0')}`,
      barcode: `89000000000${index + 1}`, isActive: true, deletedAt: null,
    })
  }

  const appointmentSpecs = [
    [0, 0, 0, 10, 0, 'onsite', 'Pending', 'Diabetes follow-up'],
    [1, 0, 0, 11, 15, 'tele-consultation', 'Pending', 'Preventive health review'],
    [2, 1, 0, 12, 0, 'onsite', 'Pending', 'Allergic rhinitis'],
    [3, 2, 1, 17, 30, 'onsite', 'Pending', 'Ankle sprain follow-up'],
    [4, 0, -2, 9, 45, 'onsite', 'Completed', 'Essential hypertension'],
    [5, 0, -5, 18, 0, 'tele-consultation', 'Completed', 'Migraine without aura'],
    [6, 0, -1, 14, 30, 'onsite', 'Completed', 'Viral fever with dehydration'],
    [7, 2, -10, 11, 0, 'home-visit', 'Completed', 'Knee osteoarthritis'],
    [0, 0, 7, 10, 30, 'tele-consultation', 'Follow Up', 'Diabetes medication review'],
    [2, 1, 14, 12, 30, 'onsite', 'Follow Up', 'Paediatric allergy review'],
  ] as const

  const appointments: any[] = []
  for (let index = 0; index < appointmentSpecs.length; index += 1) {
    const [patientIndex, doctorIndex, dayOffset, hour, minute, consultationMode, status, diagnosis] = appointmentSpecs[index]
    const appointmentTime = at(dayOffset, hour, minute)
    const appointment = await upsert(PatientVisitDoctors, {
      clinicPatientId: patients[patientIndex].clinicPatient._id,
      doctorId: doctors[doctorIndex].user._id,
      appointmentTime,
    }, {
      clinicPatientId: patients[patientIndex].clinicPatient._id,
      doctorId: doctors[doctorIndex].user._id,
      appointmentTime,
      consultationMode,
      status,
      diagnosis,
      ...(consultationMode === 'tele-consultation' ? {
        teleconsultationSession: {
          channelName: `demo_consultation_${index + 1}`,
          doctorUid: 1100000 + index,
          patientUid: 2100000 + index,
          status: status === 'Completed' ? 'completed' : 'pending',
        },
      } : {}),
    })
    appointments.push(appointment)
  }

  const completed = appointments.filter((appointment) => appointment.status === 'Completed')
  const invoiceAmounts = [950, 700, 1450, 850]
  const invoices: any[] = []
  for (let index = 0; index < completed.length; index += 1) {
    const appointment = completed[index]
    const patient = patients[Number(appointmentSpecs[4 + index][0])]
    const total = invoiceAmounts[index]
    const paid = index === 2 ? 1000 : total
    const invoiceId = `DEMO-${recordNamespace}INV-${String(index + 1).padStart(4, '0')}`
    const invoice = await upsert(Invoice, { appointment_id: appointment._id }, {
      invoice_id: invoiceId,
      appointment_id: appointment._id,
      patient_id: patient.user._id,
      clinic_id: clinic._id,
      subtotal: total,
      discount: 0,
      tax_amount: 0,
      total_amount: total,
      amount_word: `${total} rupees only`,
      amount_paid: paid,
      amount_due: total - paid,
      status: paid === total ? 'PAID' : 'PARTIAL',
    })
    await upsert(InvoiceItem, { invoice_id: invoice._id, name: appointment.diagnosis }, {
      invoice_id: invoice._id, type: 'SERVICE', name: appointment.diagnosis,
      quantity: 1, unit_price: total, discount: 0, gst_rate: 0, gst_amount: 0, total_amount: total,
    })
    await upsert(InvoicePayment, { invoice_id: invoice._id }, {
      invoice_id: invoice._id, mode: index % 2 === 0 ? 'UPI' : 'CASH', amount: paid,
      paid_on: appointment.appointmentTime, reference_id: `DEMO-${recordNamespace}PAY-${index + 1}`,
      notes: 'Synthetic demo payment',
    })
    invoices.push(invoice)
  }

  for (let index = 0; index < 3; index += 1) {
    const appointment = completed[index]
    const patientIndex = Number(appointmentSpecs[4 + index][0])
    const doctorIndex = Number(appointmentSpecs[4 + index][1])
    const patient = patients[patientIndex]
    const doctor = doctors[doctorIndex]
    const prescriptionId = `DEMO-${recordNamespace}RX-${String(index + 1).padStart(3, '0')}`
    await upsert(EPrescription, { prescriptionID: prescriptionId }, {
      patient: patient.user._id,
      doctor: doctor.user._id,
      clinic: clinic._id,
      date: appointment.appointmentTime,
      prescriptionID: prescriptionId,
      sx: index === 0 ? 'Headache and elevated home blood pressure readings' : index === 1 ? 'Throbbing headache with nausea' : 'Fever, fatigue, and reduced oral intake',
      vitals: { BP: patient.bp, PR: String(patient.pulse), SpO2: String(patient.spo2) },
      dx: [{ diagnosisName: appointment.diagnosis, dateOfDiagnosis: appointment.appointmentTime }],
      labTest: index === 0 ? ['Lipid profile', 'Serum creatinine'] : index === 2 ? ['Complete Blood Count'] : [],
      rx: index === 0
        ? [{ drugName: 'Telmisartan 40 mg', freequency: 'Once daily', duration: '30 days', quantity: '30 tablets' }]
        : index === 1
          ? [{ drugName: 'Naproxen 250 mg', freequency: 'After food when required', duration: '5 days', quantity: '10 tablets' }]
          : [{ drugName: 'Paracetamol 500 mg', freequency: 'Three times daily after food', duration: '3 days', quantity: '9 tablets' }],
      advice: ['Adequate hydration', 'Return earlier if symptoms worsen'],
      originatedFromEmr: true,
      followUpSchedule: 'Review after 7 days',
      consultationMode: appointment.consultationMode === 'tele-consultation' ? 'online' : 'on site',
      createdBy: doctor.user._id,
    })

    await upsert(EMR, { user: patient.user._id, clinic: clinic._id, doctor: doctor.user._id }, {
      user: patient.user._id,
      clinic: clinic._id,
      doctor: doctor.user._id,
      basicInfo: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender === 'Female' ? 'F' : 'M',
        phoneNumber: patient.phone,
        maritalStatus: patient.age > 25,
        bloodGroup: patient.bloodGroup,
        address: { name: patient.name, street: 'Demo residential address', city: 'Pune', state: 'Maharashtra', zipCode: '411045' },
      },
      generalPhysicalExamination: {
        PR: patient.pulse,
        BP: { sys: Number(patient.bp.split('/')[0]), dia: Number(patient.bp.split('/')[1]) },
        temperature: 'Oral', temperatureVal: patient.temp, RR: 18, SPO2: patient.spo2,
        height: patient.height, weight: patient.weight,
        BMI: Number((patient.weight / ((patient.height / 100) ** 2)).toFixed(1)),
        doctorNotes: 'Patient is stable. Findings documented for demonstration.', showInEPrescription: true,
      },
      systemicExamination: { respiratorySystem: 'Clear bilateral air entry', CVS: 'S1 S2 normal', CNS: 'Alert and oriented', PA: 'Soft, non-tender' },
      diagnosis: [{ diagnosisName: appointment.diagnosis, dateOfDiagnosis: appointment.appointmentTime }],
      advice: 'Take medicines as advised, maintain hydration, and keep the scheduled follow-up.',
      followUpSchedule: '7 days',
      doctorNotes: 'Synthetic demonstration EMR; not for clinical use.',
      consultationMode: appointment.consultationMode === 'tele-consultation' ? 'online' : 'on site',
    })
  }

  await upsert(ConsentForm, { clinicId: clinic._id, patientId: patients[3].user._id, procedureName: 'Ankle joint examination and support application' }, {
    patientId: patients[3].user._id, clinicId: clinic._id, doctorId: doctors[2].user._id,
    procedureName: 'Ankle joint examination and support application',
    description: 'Clinical examination followed by application of an ankle support if indicated.',
    benefits: 'Pain relief, improved stability, and support during recovery.',
    risks: ['Temporary discomfort', 'Skin irritation from support'],
    alternatives: ['Rest and physiotherapy', 'Imaging before support application'],
    additionalNotes: 'Synthetic demonstration consent record.', consentDate: at(-7),
    patientSignature: { signed: true, signedAt: at(-7) },
    doctorSignature: { signed: true, signedAt: at(-7) },
    witnessSignature: { signed: true, signedAt: at(-7), name: 'Neha Patil' },
  })

  await upsert(ReferralForm, { clinicId: clinic._id, patientId: patients[4].user._id, reasonForReferral: 'Cardiology opinion for uncontrolled hypertension' }, {
    patientId: patients[4].user._id, clinicId: clinic._id, referredBy: doctors[0].user._id,
    referredTo: { name: 'Dr. Nikhil Rao', department: 'Cardiology', hospital: 'Sahyadri Multispeciality Hospital, Pune', contact: '+91 90000 00301' },
    reasonForReferral: 'Cardiology opinion for uncontrolled hypertension',
    provisionalDiagnosis: 'Stage 2 hypertension',
    medicalHistory: 'Hypertension for six years; inconsistent home readings.',
    investigationsDone: ['ECG', 'Lipid profile', 'Serum creatinine'],
    instructions: 'Carry previous prescriptions and seven-day home BP log.', referralDate: at(-1),
  })

  const certificatePatientId = `DEMO-${recordNamespace}PAT-007`
  await upsert(Certificate, { clinicId: clinic._id, patientId: patients[6].user._id, patientIdString: certificatePatientId }, {
    patientId: patients[6].user._id, clinicId: clinic._id, doctorId: doctors[0].user._id,
    certificateType: 'sickness', patientName: patients[6].name, patientAge: patients[6].age,
    patientGender: patients[6].gender, patientIdString: certificatePatientId,
    doctorName: doctors[0].user.name, doctorQualification: 'MBBS, MD (Medicine)', doctorRegNumber: 'MMC-DEMO-10234',
    clinicName: clinic.name, clinicAddress: '18, Baner Road, Pune, Maharashtra 411045',
    clinicPhone: clinic.phone, clinicEmail: clinic.email,
    diagnosis: 'Acute viral fever', startDate: at(-1), endDate: at(2), numberOfDays: 4,
    isUnfit: true, remarks: 'Rest and adequate oral hydration advised.', issuedDate: at(-1), place: 'Pune',
  })

  for (let index = 0; index < doctors.length; index += 1) {
    const config = await upsert(DoctorPayoutConfig, { doctor_id: doctors[index].user._id, clinic_id: clinic._id }, {
      doctor_id: doctors[index].user._id, clinic_id: clinic._id,
      model: 'PER_VISIT', per_visit_percent: 30, effective_from: at(-90),
      invoice_ids: invoices.map((invoice) => invoice._id), amountEarned: 0,
    })
    if (invoices[index]) {
      await upsert(DoctorDailyEarning, { doctor_id: doctors[index].user._id, invoice_id: invoices[index]._id }, {
        doctor_id: doctors[index].user._id, clinic_id: clinic._id, doctor_payout_config_id: config._id,
        invoice_id: invoices[index]._id, invoice_date: completed[index].appointmentTime,
        invoice_amount: invoiceAmounts[index], commission_percentage: 30,
        commission_amount: invoiceAmounts[index] * 0.3, payout_model: 'PER_VISIT', effective_from: at(-90),
      })
    }
  }

  for (const member of staff) {
    await upsert(StaffPayoutConfig, { staff_id: member.meta._id, clinic_id: clinic._id }, {
      staff_id: member.meta._id, clinic_id: clinic._id, model: 'SALARIED', fixed_salary: 28000, effective_from: at(-90),
    })
  }

  const notificationData = [
    ['Today\'s appointments', 'Three patient appointments are scheduled for today.', 'appointment', false],
    ['Low stock alert', 'Disposable Syringe 5 ml and Sterile Gauze Pack need restocking.', 'inventory', false],
    ['Payment received', `A UPI payment of ₹950 was recorded for DEMO-${recordNamespace}INV-0001.`, 'billing', true],
    ['Referral created', 'Rajesh Yadav has been referred for a cardiology opinion.', 'referral', true],
  ] as const
  for (const [title, message, type, isRead] of notificationData) {
    await upsert(Notification, { userId: admin._id, clinicId: clinic._id, title }, {
      userId: admin._id, clinicId: clinic._id, title, message, type, isRead,
      metadata: { demo: true },
    })
  }

  console.log('\nDemo data is ready.')
  console.log(`Clinic: ${clinic.name}`)
  console.log(`Login:  ${targetAccountEmail || DEMO_EMAIL}`)
  console.log(targetAccount ? 'Existing account password was not changed.' : `Password: ${DEMO_PASSWORD}`)
  console.log(`Created/updated: ${doctors.length} doctors, ${staff.length} staff, ${patients.length} patients, ${appointments.length} appointments, ${invoices.length} invoices.`)
}

seed()
  .catch((error) => {
    console.error('Demo seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
