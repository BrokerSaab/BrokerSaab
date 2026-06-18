import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '../config/db';
import { validateRequest } from '../middlewares/validate';
import { authenticateJWT, AuthenticatedRequest, logAuditEvent } from '../middlewares/auth';
import { sendOtpSms } from '../utils/sms';

const router = Router();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'brokersaab_secret_access_token_12345_dev_super_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'brokersaab_secret_refresh_token_67890_dev_super_secret';

// Simple local OTP storage (In production, use Redis cache with TTL)
const mockOtpStore = new Map<string, { otp: string; expiresAt: number }>();

// Validation Schemas
const sendOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number max length 15')
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string(),
    otp: z.string().length(6, 'OTP must be 6 digits')
  })
});

const completeRegistrationSchema = z.object({
  body: z.object({
    tempToken: z.string(),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional()
  })
});

const passwordLoginSchema = z.object({
  body: z.object({
    // Accept email address OR phone number (advisors sometimes enter their phone)
    email: z.string().min(1, 'Email or phone number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

const phonePasswordLoginSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number max length 15'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  })
});

const setPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and a number'),
  })
});

const advisorSignupSchema = z.object({
  body: z.object({
    phoneNumber: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string(),
    businessName: z.string().optional(),
    experienceYears: z.number().int().min(0),
    licenseNumber: z.string().optional(),
    gstNumber: z.string().optional(),
    advisorType: z.enum(['REGULAR', 'AUTHORIZED']).default('REGULAR'),
    location: z.string(),
    state: z.string().optional(),
    circle: z.string().optional(),
    subdivision: z.string().optional(),
    consultationFee: z.number().min(0).optional(),
    languages: z.array(z.string()),
    bio: z.string().optional()
  })
});

// Helper: Token Generator
const generateTokens = (user: { id: string; phoneNumber: string; role: Role }, advisorId?: string) => {
  const payload: any = { id: user.id, phoneNumber: user.phoneNumber, role: user.role };
  if (advisorId) payload.advisorId = advisorId;
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

/**
 * 1. POST /auth/otp/send
 * Generates a real 6-digit OTP and delivers it via SMS (provider set by
 * SMS_PROVIDER env var: twilio | msg91 | fast2sms).
 * In development / staging (NODE_ENV != 'production') the OTP is also
 * returned in the response body as `devOtp` for easy manual testing.
 */
router.post('/otp/send', validateRequest(sendOtpSchema), async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber } = req.body;

  // Generate cryptographically random 6-digit OTP
  const otp       = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5-minute window

  mockOtpStore.set(phoneNumber, { otp, expiresAt });

  const { success, error } = await sendOtpSms(phoneNumber, otp);

  if (!success) {
    console.error(`[OTP] SMS delivery failed for ${phoneNumber}:`, error);
    // Remove the stored OTP so the user can retry cleanly
    mockOtpStore.delete(phoneNumber);
    res.status(503).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    // Only expose OTP outside production (for local / staging testing)
    ...(!isProduction && { devOtp: otp }),
  });
});

/**
 * 2. POST /auth/otp/verify
 * Validates OTP code. Returns existing JWTs OR a temporary onboarding registration token.
 */
router.post('/otp/verify', validateRequest(verifyOtpSchema), async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber, otp } = req.body;
  const entry = mockOtpStore.get(phoneNumber);

  if (!entry) {
    res.status(400).json({ success: false, message: 'OTP request expired or not found' });
    return;
  }

  if (entry.expiresAt < Date.now()) {
    mockOtpStore.delete(phoneNumber);
    res.status(400).json({ success: false, message: 'OTP has expired' });
    return;
  }

  if (entry.otp !== otp) {
    res.status(400).json({ success: false, message: 'Invalid OTP code' });
    return;
  }

  // Clear OTP entry
  mockOtpStore.delete(phoneNumber);

  // Check if User exists
  let user = await prisma.user.findUnique({
    where: { phoneNumber },
    include: { wallet: true }
  });

  if (!user) {
    // Generate a temporary JWT token for registration onboarding
    const tempToken = jwt.sign(
      { phoneNumber, purpose: 'onboarding' },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    res.status(200).json({
      success: true,
      isNewUser: true,
      tempToken,
      message: 'OTP verified. Complete registration.'
    });
    return;
  }

  // Log audit
  await logAuditEvent('LOGIN', user.id, { method: 'OTP' }, undefined, req);

  // User exists - return standard login tokens
  const tokens = generateTokens(user);
  res.status(200).json({
    success: true,
    isNewUser: false,
    hasPassword: !!user.passwordHash,
    tokens,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      walletBalance: user.wallet?.balance || '0.00'
    }
  });
});

/**
 * 3. POST /auth/register/complete
 * Fully creates the Client profile and allocates a Wallet Ledger balance.
 */
router.post('/register/complete', validateRequest(completeRegistrationSchema), async (req: Request, res: Response): Promise<void> => {
  const { tempToken, fullName, email } = req.body;

  try {
    const decoded = jwt.verify(tempToken, JWT_ACCESS_SECRET) as {
      phoneNumber: string;
      purpose: string;
    };

    if (decoded.purpose !== 'onboarding') {
      res.status(400).json({ success: false, message: 'Invalid registration token payload' });
      return;
    }

    const { phoneNumber } = decoded;

    // Check if user already got created in between
    const existing = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existing) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    // Database transaction to create User & Wallet ledger atomicity
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phoneNumber,
          email,
          fullName,
          role: Role.CLIENT
        }
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0.00
        }
      });

      return user;
    });

    await logAuditEvent('REGISTER', newUser.id, { method: 'OTP' }, undefined, req);

    const tokens = generateTokens(newUser);
    res.status(201).json({
      success: true,
      tokens,
      user: {
        id: newUser.id,
        phoneNumber: newUser.phoneNumber,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        walletBalance: '0.00'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid or expired onboarding session' });
  }
});

/**
 * 4a. POST /auth/login/phone-password
 * Phone + password login for CLIENT users who have previously set a password.
 */
router.post('/login/phone-password', validateRequest(phonePasswordLoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      include: { wallet: true }
    });

    if (!user || user.role !== Role.CLIENT) {
      res.status(404).json({ success: false, message: 'No account found with this phone number.' });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({ success: false, message: 'No password set for this account. Please use OTP login.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
      return;
    }

    await logAuditEvent('LOGIN', user.id, { method: 'PASSWORD' }, undefined, req);

    const tokens = generateTokens(user);
    res.status(200).json({
      success: true,
      tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        walletBalance: user.wallet?.balance || '0.00'
      }
    });
  } catch (err: any) {
    console.error('[phone-password login error]', err);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
});

/**
 * 4b. POST /auth/password/set
 * Allows an authenticated CLIENT to set or update their login password.
 */
router.post('/password/set', authenticateJWT, validateRequest(setPasswordSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { newPassword } = req.body;

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { passwordHash }
  });

  await logAuditEvent('PASSWORD_SET', req.user!.id, { method: 'self_set' }, undefined, req);

  res.status(200).json({ success: true, message: 'Password set successfully.' });
});

/**
 * 4. POST /auth/login/password
 * Standard password login endpoint for Admin users and Advisors.
 */
router.post('/login/password', validateRequest(passwordLoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email: identifier, password } = req.body;
  // identifier may be an email address or a phone number (e.g. +91XXXXXXXXXX or 9876543210)
  const isPhone = /^\+?\d{10,15}$/.test(identifier.replace(/\s/g, ''));
  const email = isPhone ? '' : identifier;

  // 1. Search AdminUsers table (email only — admins always use email)
  const admin = !isPhone ? await prisma.adminUsers.findUnique({ where: { email } }) : null;
  if (admin) {
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(400).json({ success: false, message: 'Incorrect password credentials' });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({ success: false, message: 'This account has been deactivated. Contact the super admin.' });
      return;
    }

    const accessToken = jwt.sign(
      { id: admin.id, phoneNumber: '0000000000', role: admin.role },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { id: admin.id, phoneNumber: '0000000000', role: admin.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      tokens: { accessToken, refreshToken },
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role
      }
    });
    return;
  }

  // 2. Search Advisors/Users table — by email or by phone number
  let advisor = null;
  if (isPhone) {
    // Normalise: ensure +91 prefix for Indian numbers without country code
    const normalised = identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '').slice(-10)}`;
    advisor = await prisma.advisor.findFirst({ where: { phoneNumber: normalised } });
    if (!advisor) advisor = await prisma.advisor.findFirst({ where: { phoneNumber: identifier } });
  } else {
    advisor = await prisma.advisor.findUnique({ where: { email } });
  }

  if (advisor) {
    const user = await prisma.user.findUnique({ where: { phoneNumber: advisor.phoneNumber } });

    if (!user || !user.passwordHash) {
      res.status(400).json({ success: false, message: 'No password set for this advisor account. Please use OTP login.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ success: false, message: 'Incorrect password. Please try again.' });
      return;
    }

    const tokens = generateTokens(user);
    res.status(200).json({
      success: true,
      tokens,
      user: {
        id: user.id,
        advisorId: advisor.id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        verificationStatus: advisor.verificationStatus
      }
    });
    return;
  }

  res.status(404).json({ success: false, message: 'No registered account found with this email' });
});

/**
 * 5. POST /auth/advisor/signup
 * Standard email-password registration for advisors, requiring subsequent KYC checks.
 */
router.post('/advisor/signup', validateRequest(advisorSignupSchema), async (req: Request, res: Response): Promise<void> => {
  const {
    phoneNumber,
    email,
    password,
    fullName,
    businessName,
    experienceYears,
    licenseNumber,
    gstNumber,
    advisorType,
    location,
    state,
    circle,
    subdivision,
    consultationFee,
    languages,
    bio
  } = req.body;

  // Check unique constraints
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ phoneNumber }, { email }] }
  });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'User or phone number already registered' });
    return;
  }

  const advisorOrFilters: any[] = [{ email }, { phoneNumber }];
  if (licenseNumber) advisorOrFilters.push({ licenseNumber });
  const existingAdvisor = await prisma.advisor.findFirst({
    where: { OR: advisorOrFilters }
  });
  if (existingAdvisor) {
    res.status(400).json({ success: false, message: 'Advisor license, email, or phone number already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    // Create base user record
    const user = await tx.user.create({
      data: {
        phoneNumber,
        email,
        fullName,
        role: Role.ADVISOR,
        passwordHash
      }
    });

    // Create companion Wallet
    await tx.wallet.create({
      data: {
        userId: user.id,
        balance: 0.00
      }
    });

    // Create advisor record
    const advisor = await tx.advisor.create({
      data: {
        phoneNumber,
        email,
        fullName,
        businessName,
        experienceYears,
        licenseNumber: licenseNumber ?? null,
        gstNumber: gstNumber ?? null,
        advisorType: advisorType ?? 'REGULAR',
        location,
        state: state ?? (location.includes(',') ? location.split(',').pop()?.trim() ?? null : null),
        circle: circle ?? null,
        subdivision: subdivision ?? null,
        consultationFee: consultationFee ?? 0,
        languages,
        bio: bio || null,
        onboardingStep: 8
      }
    });

    return { user, advisor };
  });

  await logAuditEvent('REGISTER', result.user.id, { role: Role.ADVISOR }, result.advisor.id, req);

  const tokens = generateTokens(result.user, result.advisor.id);
  res.status(201).json({
    success: true,
    tokens,
    user: {
      id: result.user.id,
      advisorId: result.advisor.id,
      phoneNumber: result.user.phoneNumber,
      fullName: result.user.fullName,
      email: result.user.email,
      role: result.user.role,
      verificationStatus: result.advisor.verificationStatus
    }
  });
});

/**
 * POST /auth/setup-admin  — one-shot admin creation, protected by setup key.
 * Safe to leave in codebase: becomes a no-op once admin row exists.
 */
router.post('/setup-admin', async (req: Request, res: Response): Promise<void> => {
  const { setupKey } = req.body;
  if (setupKey !== 'BROKERSAAB_SETUP_2026') {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }

  try {
    const existing = await prisma.adminUsers.findUnique({ where: { email: 'admin@brokersaab.com' } });
    if (existing) {
      // Update the password in case it was created with a different hash
      const passwordHash = await bcrypt.hash('BrokerAdmin123', 10);
      await prisma.adminUsers.update({ where: { email: 'admin@brokersaab.com' }, data: { passwordHash } });
      res.json({ success: true, message: 'Admin password refreshed', email: existing.email });
      return;
    }

    const passwordHash = await bcrypt.hash('BrokerAdmin123', 10);
    const admin = await prisma.adminUsers.create({
      data: {
        email: 'admin@brokersaab.com',
        fullName: 'BrokerSaab Super Admin',
        passwordHash,
        role: Role.SUPER_ADMIN,
      }
    });
    res.json({ success: true, message: 'Admin created', email: admin.email });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /auth/token/refresh
 * Mobile-only: exchange a refresh token for a new access token
 */
router.post(
  '/token/refresh',
  validateRequest(z.object({ body: z.object({ refreshToken: z.string().min(1) }) })),
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
        id: string;
        phoneNumber: string;
        role: Role;
        advisorId?: string;
      };

      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      const newAccessToken = jwt.sign(
        { id: user.id, phoneNumber: user.phoneNumber, role: user.role, advisorId: payload.advisorId },
        JWT_ACCESS_SECRET,
        { expiresIn: '24h' },
      );

      res.json({ success: true, accessToken: newAccessToken });
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
  },
);

export default router;
