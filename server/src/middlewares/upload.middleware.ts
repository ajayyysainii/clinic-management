import { RequestHandler } from 'express'
import multer from 'multer'
import multerS3 from 'multer-s3'
import s3Client from '../utils/s3Client'

const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET!,
  key: (req, file, cb) => {
    // You can customize the path based on your needs
    const folder = req.uploadFolder || 'uploads' // Default folder
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, `${folder}/${uniqueName}`)
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
})

// File filter configuration
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF, and PDF are allowed.'))
  }
}

// Limits configuration
const limits = {
  fileSize: 10485760, // 10MB
}

/**
 * Creates a multer middleware configured for S3 uploads
 * @param fields Array of field configurations (name and maxCount)
 * @param singleField If you want to handle a single field (alternative to fields)
 * @returns Express middleware handler
 */
export const createS3UploadMiddleware = (options: {
  fields?: multer.Field[]
  singleField?: string
  folder?: string
}): RequestHandler => {
  const upload = multer({
    storage: s3Storage,
    limits,
    fileFilter,
  })

  return (req, res, next) => {
    // Set upload folder if provided
    if (options.folder) {
      req.uploadFolder = options.folder
    }

    if (options.fields) {
      return upload.fields(options.fields)(req, res, next)
    } else if (options.singleField) {
      return upload.single(options.singleField)(req, res, next)
    } else {
      return upload.any()(req, res, next)
    }
  }
}
