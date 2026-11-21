import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { requireUser } from '../../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import crypto from 'crypto';

const router = Router();

const ALLOWED_EXTENSIONS = ['.png', '.pdf', '.svg', '.ai'];
const ALLOWED_MIME_TYPES = [
  'image/png',
  'application/pdf',
  'image/svg+xml',
  'application/postscript',
  'application/illustrator',
  'application/vnd.adobe.illustrator',
];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type '${ext}' not allowed. Allowed formats: PNG, PDF, SVG, AI.`));
    }
    cb(null, true);
  },
});

router.post(
  '/',
  requireUser,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('artwork')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 413, 'File size exceeds maximum allowed limit of 25 MB.', 'FILE_TOO_LARGE');
        }
        return sendError(res, 400, err.message || 'File upload validation failed', 'INVALID_FILE_TYPE');
      }

      if (!req.file) {
        return sendError(res, 400, 'No file uploaded in form field "artwork".', 'FILE_REQUIRED');
      }

      const userId = req.user?.id || 'anonymous';
      const cleanOriginal = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const sanitizedFilename = `${Date.now()}_${cleanOriginal}`;
      const storagePath = `uploads/${userId}/${sanitizedFilename}`;

      // Generate signed URL with 3600s expiration
      const token = crypto.randomBytes(16).toString('hex');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const signedUrl = `https://storage.digitalheroes.print/${storagePath}?token=${token}&expires=${expiresAt}`;

      sendSuccess(
        res,
        {
          filename: sanitizedFilename,
          storage_path: storagePath,
          size_bytes: req.file.size,
          mimetype: req.file.mimetype,
          signed_url: signedUrl,
          expires_at: expiresAt,
        },
        201
      );
    });
  }
);

export const uploadRoutes = router;
