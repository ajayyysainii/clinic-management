import mongoose from 'mongoose'
import { Clinic } from '../models'
import { sendEmail } from '../../../utils/emailClient'
import { User } from '../../user/models'
import DoctorMeta from '../../doctor/models/doctor.model'
import {Types} from 'mongoose'
import { hashPassword, randomPassword } from '../../../utils/password'

export class ClinicService {
  async registerClinic(clinicData: any, files: any) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const tempPassword = randomPassword()
      const hashedPassword = await hashPassword(tempPassword)

      // Prepare clinic data
      const clinicDataToSave = {
        ...clinicData,
        logo: (files.logo?.[0] as Express.Multer.File & { location?: string })?.location || null,
        eSign: (files.eSign?.[0] as Express.Multer.File & { location?: string })?.location || null,
        availableLocations: clinicData.locations || [],
        type: clinicData.type || null,
        panNumber: clinicData.panNumber ? clinicData.panNumber.trim() : null,
        gstNumber: clinicData.gstNumber ? clinicData.gstNumber.trim() : null,
      }

      // Create clinic
      const clinic = new Clinic(clinicDataToSave)
      await clinic.save({ session })

      // Generate Google Form link with clinic ID
      const googleFormLink = `https://docs.google.com/forms/d/e/1FAIpQLSe9wVorPyJZydQXd55PZPZ5a5NSltvYfShIgn3gu4oB-9iuSA/viewform?usp=pp_url&entry.9166166=${clinic._id}`

      // Update clinic with Google Form link
      await Clinic.findByIdAndUpdate(
        clinic._id,
        { googleFormLink },
        { session }
      )

      // Create user for clinic owner
      const user = new User({
        name: clinicData.ownerName,
        email: clinicData.email,
        phone: clinicData.phone,
        password: hashedPassword,
        roles: clinicData.type === 'individual' ? ['hybrid'] : ['admin'],
        clinic: clinic._id,
      })
      await user.save({ session })

      // Handle doctor registration for individual clinics
      let doctor = null;
      if (clinicData.type === 'individual' && clinicData.doctor) {
        try {
          // Parse JSON strings
          let parsedSpecializations = [];
          let parsedAvailability = [];
          let parsedDegreeTitles = [];
          let parsedCertificateTitles = [];

          try {
            if (clinicData.doctor.specializations) {
              parsedSpecializations = typeof clinicData.doctor.specializations === 'string'
                ? JSON.parse(clinicData.doctor.specializations)
                : clinicData.doctor.specializations;
            }
            if (clinicData.doctor.availability) {
              parsedAvailability = typeof clinicData.doctor.availability === 'string'
                ? JSON.parse(clinicData.doctor.availability)
                : clinicData.doctor.availability;
            }
            if (clinicData.doctor.degreeTitles) {
              parsedDegreeTitles = typeof clinicData.doctor.degreeTitles === 'string'
                ? JSON.parse(clinicData.doctor.degreeTitles)
                : clinicData.doctor.degreeTitles;
            }
            if (clinicData.doctor.certificateTitles) {
              parsedCertificateTitles = typeof clinicData.doctor.certificateTitles === 'string'
                ? JSON.parse(clinicData.doctor.certificateTitles)
                : clinicData.doctor.certificateTitles;
            }
          } catch (parseError) {
            console.error('Error parsing doctor JSON data:', parseError);
          }

          // Handle doctor file uploads
          let doctorESignUrl = '';
          let degreesData: any[] = [];
          let certificatesData: any[] = [];
          let profileImageUrl = '';

          if (files) {
            const doctorFiles = files as any;

            // Handle doctor eSign
            if (doctorFiles['doctor[eSign]'] && doctorFiles['doctor[eSign]'][0]) {
              doctorESignUrl = doctorFiles['doctor[eSign]'][0].location;
            }

            // Handle profile image
            if (doctorFiles['doctor[profileImageUrl]'] && doctorFiles['doctor[profileImageUrl]'][0]) {
              profileImageUrl = doctorFiles['doctor[profileImageUrl]'][0].location;
            }

            // Handle degrees
            if (doctorFiles['doctor[degrees]'] && doctorFiles['doctor[degrees]'].length > 0) {
              degreesData = doctorFiles['doctor[degrees]'].map((file: any, index: number) => ({
                title: parsedDegreeTitles[index] || `Degree ${index + 1}`,
                degrees_image_url: file.location,
              }));
            }

            // Handle certificates
            if (doctorFiles['doctor[certificates]'] && doctorFiles['doctor[certificates]'].length > 0) {
              certificatesData = doctorFiles['doctor[certificates]'].map((file: any, index: number) => ({
                title: parsedCertificateTitles[index] || `Certificate ${index + 1}`,
                certificates_image_url: file.location,
              }));
            }
          }

          // Create doctor meta data
          const doctorMeta = new DoctorMeta({
            user_id: user._id,
            bio: clinicData.doctor.bio || '',
            yearsOfExperience: clinicData.doctor.yearsOfExperience ? Number(clinicData.doctor.yearsOfExperience) : 0,
            eSign: doctorESignUrl,
            profileImageUrl: profileImageUrl,
            degrees: degreesData,
            certificates: certificatesData,
            specializations: parsedSpecializations,
            availability: parsedAvailability,
          });

          doctor = await doctorMeta.save({ session });
        } catch (doctorError) {
          console.error('Error registering doctor:', doctorError);
          // Don't throw here, just log the error and continue with clinic registration
        }
      }

      // Send email with credentials
      const subject = 'Welcome to PrevaCare - Your Clinic Account'
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Clinic Registration Success</title></head><body><p>Welcome to PrevaCare!<br><br>Your clinic has been registered successfully.<br><br>Login credentials:<br>Email: ${clinicData.email}<br>Password: ${tempPassword}<br><br>Please change your password after first login.</p></body></html>`

      await sendEmail(process.env.ADMIN_EMAIL!, clinicData.email, subject, html)

      await session.commitTransaction()
      return { clinic, user, doctor, password: tempPassword }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  async getClinicById(clinicId: string) {
    return await Clinic.findById(clinicId);
  }

  async updateClinic(clinicId: Types.ObjectId, updateData: any, files?: { logo?: Express.Multer.File[]; eSign?: Express.Multer.File[] }) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // Prepare update data
      const updateDataToSave = {
        ...updateData,
        logo: (files?.logo?.[0] as Express.Multer.File & { location?: string })?.location || updateData.logo,
        eSign: (files?.eSign?.[0] as Express.Multer.File & { location?: string })?.location || updateData.eSign,
        availableLocations: updateData.locations || updateData.availableLocations,
        panNumber: updateData.panNumber ? updateData.panNumber.trim() : updateData.panNumber,
        gstNumber: updateData.gstNumber ? updateData.gstNumber.trim() : updateData.gstNumber,
      }

      // Remove undefined values
      Object.keys(updateDataToSave).forEach(key => {
        if (updateDataToSave[key] === undefined) {
          delete updateDataToSave[key]
        }
      })

      const clinic = await Clinic.findByIdAndUpdate(
        clinicId,
        updateDataToSave,
        { new: true, session }
      )

      if (!clinic) {
        throw new Error('Clinic not found')
      }

      await session.commitTransaction()
      return clinic
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }
}
