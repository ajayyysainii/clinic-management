import mongoose from 'mongoose'
import { sendEmail } from '../../../utils/emailClient'
import { User } from '../../user/models'
import { hashPassword, randomPassword } from '../../../utils/password'
import { Response, Request } from 'express'
import { DoctorMeta } from '../models'
import { AuthenticatedRequest } from '../../../types'

export class DoctorService {
  async registerDoctor(req: AuthenticatedRequest, res: Response) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const { name, email, phone } = req.body

      if (!name || !email || !phone) {
        await session.abortTransaction()
        session.endSession()
        return res.status(400).json({ message: 'Name, email, and phone are required.' })
      }

      const tempPassword = randomPassword()
      const hashedPassword = await hashPassword(tempPassword)

      let profileImageUrl = null

      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }
        profileImageUrl = (files.profileImageUrl?.[0] as any)?.location
      }

      const user = new User({
        name,
        email,
        phone,
        profileImageUrl: profileImageUrl,
        password: hashedPassword,
        roles: ['doctor'],
        clinic: req.currentUser?.clinic,
      })

      const userSuccess = await user.save({ session })

      // Debug: Log all request data
      console.log('=== DEBUG REQUEST DATA ===')
      console.log('req.body:', req.body)
      console.log('req.files:', req.files)
      console.log('req.files type:', typeof req.files)
      console.log('=========================')

      // File upload handling
      let eSignUrl = null
      let certificatesData: any[] = []
      let degreesData: any[] = []

      if (req.files) {
        // Case 1: Using .fields() - files is an object with field names as keys
        if (typeof req.files === 'object' && !Array.isArray(req.files)) {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] }
          console.log('Files object keys:', Object.keys(files))

          // Handle eSign
          if (files.eSign && files.eSign[0]) {
            const eSignFile = files.eSign[0] as any
            eSignUrl = eSignFile.location
            console.log('eSign S3 Location:', eSignUrl)
          }

          // Handle certificates
          if (files.certificates && files.certificates.length > 0) {
            console.log('Certificate files found:', files.certificates.length)
            console.log('certificateTitles from body:', req.body.certificateTitles)

            let certificateTitles = []
            try {
              if (req.body.certificateTitles) {
                certificateTitles =
                  typeof req.body.certificateTitles === 'string'
                    ? JSON.parse(req.body.certificateTitles)
                    : req.body.certificateTitles
              }
            } catch (e) {
              console.log('Error parsing certificateTitles:', e)
            }

            certificatesData = files.certificates.map((file: any, index: number) => ({
              title: certificateTitles[index] || `Certificate ${index + 1}`,
              certificates_image_url: file.location,
            }))
            console.log('Certificates Data:', certificatesData)
          }

          // Handle degrees
          if (files.degrees && files.degrees.length > 0) {
            console.log('Degree files found:', files.degrees.length)
            console.log('degreeTitles from body:', req.body.degreeTitles)

            let degreeTitles = []
            try {
              if (req.body.degreeTitles) {
                degreeTitles =
                  typeof req.body.degreeTitles === 'string' ? JSON.parse(req.body.degreeTitles) : req.body.degreeTitles
              }
            } catch (e) {
              console.log('Error parsing degreeTitles:', e)
            }

            degreesData = files.degrees.map((file: any, index: number) => ({
              title: degreeTitles[index] || `Degree ${index + 1}`,
              degrees_image_url: file.location,
            }))
            console.log('Degrees Data:', degreesData)
          }
        }
        // Case 2: Using .array() or .single() - files is an array
        else if (Array.isArray(req.files)) {
          const filesArray = req.files as any[]
          console.log('Files array length:', filesArray.length)
          console.log(
            'File fieldnames:',
            filesArray.map((f) => f.fieldname),
          )

          // Handle eSign
          const eSignFile = filesArray.find((file) => file.fieldname === 'eSign')
          if (eSignFile) {
            eSignUrl = eSignFile.location
            console.log('eSign S3 Location:', eSignUrl)
          }

          // Handle certificates
          const certificateFiles = filesArray.filter((file) => file.fieldname === 'certificates')
          if (certificateFiles.length > 0) {
            console.log('Certificate files found:', certificateFiles.length)

            let certificateTitles = []
            try {
              if (req.body.certificateTitles) {
                certificateTitles =
                  typeof req.body.certificateTitles === 'string'
                    ? JSON.parse(req.body.certificateTitles)
                    : req.body.certificateTitles
              }
            } catch (e) {
              console.log('Error parsing certificateTitles:', e)
            }

            certificatesData = certificateFiles.map((file: any, index: number) => ({
              title: certificateTitles[index] || `Certificate ${index + 1}`,
              certificates_image_url: file.location,
            }))
            console.log('Certificates Data:', certificatesData)
          }

          // Handle degrees
          const degreeFiles = filesArray.filter((file) => file.fieldname === 'degrees')
          if (degreeFiles.length > 0) {
            console.log('Degree files found:', degreeFiles.length)

            let degreeTitles = []
            try {
              if (req.body.degreeTitles) {
                degreeTitles =
                  typeof req.body.degreeTitles === 'string' ? JSON.parse(req.body.degreeTitles) : req.body.degreeTitles
              }
            } catch (e) {
              console.log('Error parsing degreeTitles:', e)
            }

            degreesData = degreeFiles.map((file: any, index: number) => ({
              title: degreeTitles[index] || `Degree ${index + 1}`,
              degrees_image_url: file.location,
            }))
            console.log('Degrees Data:', degreesData)
          }
        }
      }

      if (userSuccess) {
        let specializations = []
        try {
          if (req.body.specializations) {
            specializations =
              typeof req.body.specializations === 'string'
                ? JSON.parse(req.body.specializations)
                : req.body.specializations
          }
        } catch (e) {
          console.log('Error parsing specializations:', e)
        }

        let availability = []
        try {
          if (req.body.availability) {
            availability =
              typeof req.body.availability === 'string' ? JSON.parse(req.body.availability) : req.body.availability
          }
        } catch (e) {
          console.log('Error parsing availability:', e)
        }

        console.log('=== FINAL DATA FOR MONGODB ===')
        console.log('specializations:', specializations)
        console.log('certificatesData:', certificatesData)
        console.log('degreesData:', degreesData)
        console.log('eSignUrl:', eSignUrl)
        console.log('==============================')

        const doctorMeta = new DoctorMeta({
          user_id: user._id,
          bio: req.body.bio,
          yearsOfExperience: req.body.yearsOfExperience,
          eSign: eSignUrl,
          degrees: degreesData.length > 0 ? degreesData : [],
          certificates: certificatesData.length > 0 ? certificatesData : [],
          specializations: specializations,
          availability: availability,
        })

        console.log('DoctorMeta before save:', doctorMeta)
        await doctorMeta.save({ session })

        const subject = 'Welcome to PrevaCare - Your Clinic Account'
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Clinic Registration Success</title></head>
        <body>
          <p>Welcome to PrevaCare!<br><br>
          Your clinic has been registered successfully.<br><br>
          Login credentials:<br>
          Email: ${user.email}<br>
          Password: ${tempPassword}<br><br>
          Please change your password after first login.</p>
        </body>
        </html>`

        await sendEmail(process.env.ADMIN_EMAIL!, user.email, subject, html)

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
          message: 'Doctor registered successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
        })
      }
    } catch (error: any) {
      await session.abortTransaction()
      session.endSession()
      console.error('Doctor registration failed:', error)
      return res.status(500).json({ message: 'Failed to register doctor', error: error.message })
    }
  }
}
