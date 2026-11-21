import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { requireUser } from '../../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './auth.validator.js';

const router = Router();

// Public Auth Endpoints
router.post('/signup', validateRequest(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/register', validateRequest(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', validateRequest(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/resend-verification', validateRequest(resendVerificationSchema), (req, res, next) =>
  authController.resendVerification(req, res, next)
);

router.post('/forgot-password', validateRequest(forgotPasswordSchema), (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

router.post('/reset-password', validateRequest(resetPasswordSchema), (req, res, next) =>
  authController.resetPassword(req, res, next)
);

router.get('/google', (req, res, next) =>
  authController.googleAuthUrl(req, res, next)
);

// Protected Auth Endpoints (Requires valid JWT)
router.get('/me', requireUser, (req, res, next) =>
  authController.getMe(req, res, next)
);

router.patch('/me', requireUser, validateRequest(updateProfileSchema), (req, res, next) =>
  authController.updateProfile(req, res, next)
);

router.patch('/profile', requireUser, validateRequest(updateProfileSchema), (req, res, next) =>
  authController.updateProfile(req, res, next)
);

router.post('/logout', requireUser, (req, res, next) =>
  authController.logout(req, res, next)
);

export const authRoutes = router;
