import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS, // use the app password generated in step 3
  },
})

export const sendEmail = (
  from: string | undefined,
  to: string | undefined,
  subject: string,
  html: string,
  attachments: object[] = [],
  cc: string = '',
): Promise<void> => {
  if (!from || !to || !subject || !html) {
    throw new Error('Invalid parameters!')
  }

  let mailOptions: any = { from, to, subject, html }

  if (attachments?.length) {
    mailOptions.attachments = attachments
  }
  if (cc) {
    mailOptions.cc = cc
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error)
        reject(error)
      } else {
        console.log('Email sent:', info.response)
        resolve()
      }
    })
  })
}
