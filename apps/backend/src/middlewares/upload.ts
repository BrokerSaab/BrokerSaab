import multer from 'multer';
import path from 'path';
import fs from 'fs';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const useCloudinary = !!(CLOUD_NAME && API_KEY && API_SECRET);

// Initialise Cloudinary once if credentials are available
let cloudinaryInstance: any = null;
let CloudinaryStorageClass: any = null;
if (useCloudinary) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  cloudinaryInstance = require('cloudinary').v2;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CloudinaryStorageClass = require('multer-storage-cloudinary').CloudinaryStorage;
  cloudinaryInstance.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
}

function makeCloudinaryStorage(folder: string): multer.StorageEngine {
  return new CloudinaryStorageClass({
    cloudinary: cloudinaryInstance,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: 'auto',
    },
  });
}

function makeDiskStorage(subdir: string): multer.StorageEngine {
  fs.mkdirSync(`uploads/${subdir}`, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, `uploads/${subdir}`),
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
  storage: useCloudinary ? makeCloudinaryStorage('brokersaab/kyc') : makeDiskStorage('kyc'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const ticketUpload = multer({
  storage: useCloudinary ? makeCloudinaryStorage('brokersaab/tickets') : makeDiskStorage('tickets'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
});

/** Returns the public URL for an uploaded file (works for both Cloudinary and local disk). */
export function fileUrl(file: Express.Multer.File): string {
  if (useCloudinary) return file.path;
  // file.destination is set by disk storage (e.g. 'uploads/kyc' or 'uploads/tickets')
  return `/${file.destination}/${file.filename}`;
}
