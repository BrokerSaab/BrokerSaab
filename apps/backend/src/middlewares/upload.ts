import multer from 'multer';
import path from 'path';
import fs from 'fs';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const useCloudinary = !!(CLOUD_NAME && API_KEY && API_SECRET);

let storage: multer.StorageEngine;

if (useCloudinary) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cloudinary = require('cloudinary').v2;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'brokersaab/kyc',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: 'auto',
    },
  });
} else {
  fs.mkdirSync('uploads/kyc', { recursive: true });
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/kyc'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WebP images and PDF files are allowed'));
};

export const kycUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/** Returns the public URL for an uploaded file (works for both Cloudinary and local disk). */
export function fileUrl(file: Express.Multer.File): string {
  // Cloudinary storage sets file.path to the full HTTPS URL
  if (useCloudinary) return file.path;
  // Disk storage: construct relative URL served by express.static
  return `/uploads/kyc/${file.filename}`;
}
