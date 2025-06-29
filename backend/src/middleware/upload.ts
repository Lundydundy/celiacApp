import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import { AuthenticatedRequest } from '../types'

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
const receiptsDir = path.join(uploadsDir, 'receipts')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true })
}

// Configure storage for receipt images
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, receiptsDir)
  },
  filename: (req: AuthenticatedRequest, file, cb) => {
    // Generate unique filename with user ID and timestamp
    const userId = req.user?.id || 'anonymous'
    const timestamp = Date.now()
    const randomId = Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `receipt-${userId}-${timestamp}-${randomId}${ext}`)
  }
})

// File filter for receipt images
const receiptFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic', // iPhone photos
    'image/heif'  // iPhone photos
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and HEIC files are allowed.'))
  }
}

// Receipt image upload configuration
export const receiptUpload = multer({
  storage: receiptStorage,
  fileFilter: receiptFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for receipts
    files: 1 // Only one receipt image per upload
  }
})

// Middleware for single receipt image upload
export const uploadReceiptImage = receiptUpload.single('receiptImage')

// Keep legacy upload for backward compatibility
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP files are allowed.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
})

// Legacy exports
export const uploadSingle = upload.single('image')
export const uploadMultiple = upload.array('images', 5)

export default upload
