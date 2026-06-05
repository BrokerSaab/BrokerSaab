import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role, DocumentType, VerificationStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { kycUpload } from '../middlewares/upload';
import { validateAadhaar, maskAadhaar, hashAadhaar } from '../utils/aadhaar';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'brokersaab_secret_access_token_12345_dev_super_secret';

// Optional auth — attaches user to req if valid token present, but does not block if missing/invalid
const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(h.split(' ')[1], JWT_ACCESS_SECRET) as any; } catch { /* ignore */ }
  }
  next();
};

const router = Router();

// Validation Schemas
const searchAdvisorsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    specialization: z.string().optional(),
    location: z.string().optional(),
    state: z.string().optional(),
    minFee: z.string().optional(),
    maxFee: z.string().optional(),
    minExperience: z.string().optional(),
    minRating: z.string().optional(),
    dealerOnly: z.string().optional(),
    limit: z.string().optional(),
    page: z.string().optional()
  })
});

const setAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday, 6=Saturday
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM')
    }))
  })
});

const VALID_DOC_TYPES = Object.values(DocumentType);

const setCategoriesSchema = z.object({
  body: z.object({
    categorySlugs: z.array(z.string()).min(1)
  })
});

const setSpecializationsSchema = z.object({
  body: z.object({
    specializations: z.array(z.object({
      slug: z.string().min(1),
      name: z.string().min(1)
    })).min(1)
  })
});

/**
 * 1. GET /advisors
 * Search & Filter Advisors catalog
 */
router.get('/', validateRequest(searchAdvisorsQuerySchema), async (req: Request, res: Response): Promise<void> => {
  const {
    search,
    category,
    categories: categoriesParam,  // comma-separated: m1,m2,m17
    specialization,
    location,
    state,
    minFee,
    maxFee,
    minExperience,
    minRating,
    dealerOnly
  } = req.query;

  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;
  const skip = (page - 1) * limit;

  // Build standard filters
  const whereConditions: any = {
    verificationStatus: VerificationStatus.APPROVED
  };

  if (dealerOnly === 'true') {
    whereConditions.isAuthorizedDealer = true;
  }

  if (state && state !== 'All India') {
    // Match on state field OR location field (location often contains "City, State")
    whereConditions.OR = [
      { state: { contains: state as string, mode: 'insensitive' } },
      { location: { contains: state as string, mode: 'insensitive' } },
    ];
  }

  if (location) {
    whereConditions.location = { contains: location as string, mode: 'insensitive' };
  }

  if (minFee || maxFee) {
    whereConditions.consultationFee = {};
    if (minFee) whereConditions.consultationFee.gte = parseFloat(minFee as string);
    if (maxFee) whereConditions.consultationFee.lte = parseFloat(maxFee as string);
  }

  if (minExperience) {
    whereConditions.experienceYears = { gte: parseInt(minExperience as string) };
  }

  // Category filter — supports single ?category=m1 or multi ?categories=m1,m2,m17 (OR logic)
  if (categoriesParam) {
    const slugs = (categoriesParam as string).split(',').map(s => s.trim()).filter(Boolean);
    if (slugs.length === 1) {
      whereConditions.categories = { some: { category: { slug: slugs[0] } } };
    } else if (slugs.length > 1) {
      whereConditions.categories = { some: { category: { slug: { in: slugs } } } };
    }
  } else if (category) {
    whereConditions.categories = {
      some: { category: { slug: category as string } }
    };
  }

  // Specialization filter
  if (specialization) {
    whereConditions.specializations = {
      some: {
        specialization: {
          slug: specialization as string
        }
      }
    };
  }

  // Full-text search (uses OR on separate fields, safe since category now uses direct key)
  if (search) {
    whereConditions.OR = [
      { fullName: { contains: search as string, mode: 'insensitive' } },
      { bio: { contains: search as string, mode: 'insensitive' } },
      { businessName: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  try {
    const list = await prisma.advisor.findMany({
      where: whereConditions,
      include: {
        categories: { include: { category: true } },
        specializations: { include: { specialization: true } },
        bookings: {
          include: {
            rating: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Compute average ratings
    const formattedAdvisors = list.map((adv) => {
      const ratings = adv.bookings
        .map((b) => b.rating?.score)
        .filter((score): score is number => typeof score === 'number');

      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      const { bookings, ...rest } = adv;
      return {
        ...rest,
        averageRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: ratings.length
      };
    });

    // Rating filter execution in memory (due to nested aggregate score)
    let filteredList = formattedAdvisors;
    if (minRating) {
      const minVal = parseFloat(minRating as string);
      filteredList = formattedAdvisors.filter((adv) => adv.averageRating >= minVal);
    }

    res.status(200).json({
      success: true,
      data: filteredList,
      page,
      limit
    });
  } catch (error) {
    console.error('Advisor search failed:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve advisors catalog' });
  }
});

/**
 * POST /advisors/categories
 * Sets service categories for the authenticated advisor.
 */
router.post(
  '/categories',
  authenticateJWT,
  requireRole([Role.ADVISOR]),
  validateRequest(setCategoriesSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { categorySlugs } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: user!.phoneNumber } });
      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor not found' });
        return;
      }

      const categories = await prisma.category.findMany({ where: { slug: { in: categorySlugs } } });
      if (categories.length === 0) {
        res.status(400).json({ success: false, message: 'No valid categories found for provided slugs' });
        return;
      }

      await prisma.$transaction([
        prisma.advisorCategory.deleteMany({ where: { advisorId: advisor.id } }),
        prisma.advisorCategory.createMany({
          data: categories.map(c => ({ advisorId: advisor.id, categoryId: c.id }))
        })
      ]);

      res.status(200).json({ success: true, message: 'Service categories updated successfully' });
    } catch (err) {
      console.error('Failed to update advisor categories:', err);
      res.status(500).json({ success: false, message: 'Failed to update categories' });
    }
  }
);

/**
 * POST /advisors/specializations
 * Sets specializations (sub-modules) for the authenticated advisor.
 */
router.post(
  '/specializations',
  authenticateJWT,
  requireRole([Role.ADVISOR]),
  validateRequest(setSpecializationsSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { specializations } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: user!.phoneNumber } });
      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor not found' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // 1. Delete existing associations
        await tx.advisorSpecialization.deleteMany({ where: { advisorId: advisor.id } });

        // 2. Upsert each specialization dynamically and collect IDs
        const specIds = [];
        for (const spec of specializations) {
          const dbSpec = await tx.specialization.upsert({
            where: { slug: spec.slug },
            update: { name: spec.name },
            create: { slug: spec.slug, name: spec.name }
          });
          specIds.push(dbSpec.id);
        }

        // 3. Create new associations
        await tx.advisorSpecialization.createMany({
          data: specIds.map(id => ({ advisorId: advisor.id, specializationId: id }))
        });
      });

      res.status(200).json({ success: true, message: 'Specialisations updated successfully' });
    } catch (err) {
      console.error('Failed to update advisor specializations:', err);
      res.status(500).json({ success: false, message: 'Failed to update specialisations' });
    }
  }
);

/**
 * 2. GET /advisors/:id
 * Retrieve single advisor portfolio profile details, active availability slots, and reviews.
 */
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const advisor = await prisma.advisor.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        specializations: { include: { specialization: true } },
        availabilitySlots: {
          where: { isBooked: false }
        },
        bookings: {
          where: { status: 'COMPLETED' },
          include: {
            client: { select: { id: true, fullName: true, avatarUrl: true } },
            review: true,
            rating: true
          }
        }
      }
    });

    if (!advisor) {
      res.status(404).json({ success: false, message: 'Advisor profile not found' });
      return;
    }

    // Process review aggregation
    const reviewsList = advisor.bookings
      .filter((b) => b.review || b.rating)
      .map((b) => ({
        id: b.review?.id || b.id,
        clientName: b.client?.fullName || 'Anonymous',
        avatarUrl: b.client?.avatarUrl,
        rating: b.rating?.score || 5,
        comment: b.review?.comment || 'Highly professional consultation.',
        date: b.review?.createdAt || b.createdAt
      }));

    const ratingsCount = reviewsList.length;
    const avgRating = ratingsCount > 0 ? reviewsList.reduce((a, b) => a + b.rating, 0) / ratingsCount : 5.0;

    // If authenticated user has unlocked this advisor, include contact info
    let contactInfo: { phoneNumber?: string; email?: string } = {};
    if (req.user?.id) {
      const unlock = await prisma.contactUnlock.findUnique({
        where: { userId_advisorId: { userId: req.user.id, advisorId: id } },
      });
      if (unlock) contactInfo = { phoneNumber: advisor.phoneNumber, email: advisor.email };
    }

    res.status(200).json({
      success: true,
      data: {
        id: advisor.id,
        fullName: advisor.fullName,
        businessName: advisor.businessName,
        avatarUrl: advisor.avatarUrl,
        bio: advisor.bio,
        experienceYears: advisor.experienceYears,
        licenseNumber: advisor.licenseNumber,
        verificationStatus: advisor.verificationStatus,
        isAuthorizedDealer: advisor.isAuthorizedDealer,
        dealerAuthorizedAt: advisor.dealerAuthorizedAt,
        state: advisor.state,
        consultationFee: advisor.consultationFee,
        languages: advisor.languages,
        location: advisor.location,
        categories: advisor.categories.map((c) => c.category.name),
        specializations: advisor.specializations.map((s) => s.specialization.name),
        availability: advisor.availabilitySlots,
        reviews: reviewsList,
        ratingsCount,
        averageRating: parseFloat(avgRating.toFixed(1)),
        ...contactInfo,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving advisor details' });
  }
});

/**
 * 3. POST /advisors/availability
 * Configures weekly availability time slots. Exclusively for ADVISOR role.
 */
router.post(
  '/availability',
  authenticateJWT,
  requireRole([Role.ADVISOR]),
  validateRequest(setAvailabilitySchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { slots } = req.body;

    try {
      // Find companion advisor details
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      const advisor = await prisma.advisor.findUnique({
        where: { phoneNumber: user!.phoneNumber }
      });

      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor mapping record not found' });
        return;
      }

      // Atomically overwrite previous slots that are not booked
      await prisma.$transaction([
        prisma.availabilitySlot.deleteMany({
          where: { advisorId: advisor.id, isBooked: false }
        }),
        prisma.availabilitySlot.createMany({
          data: slots.map((s: any) => ({
            advisorId: advisor.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime
          }))
        })
      ]);

      res.status(200).json({
        success: true,
        message: 'Availability calendar slots configured successfully'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to update schedule slots' });
    }
  }
);

/**
 * 4. POST /advisors/documents
 * Upload KYC files (Aadhaar, photo, license, GST) via multipart/form-data.
 */
router.post(
  '/documents',
  authenticateJWT,
  requireRole([Role.ADVISOR]),
  kycUpload.single('file'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const { documentType, aadhaarNumber } = req.body;
      if (!documentType || !VALID_DOC_TYPES.includes(documentType)) {
        res.status(400).json({ success: false, message: `documentType must be one of: ${VALID_DOC_TYPES.join(', ')}` });
        return;
      }

      const advisorId = (req as any).user.advisorId as string | undefined;
      if (!advisorId) {
        res.status(403).json({ success: false, message: 'Advisor profile required' });
        return;
      }

      const documentUrl = `/uploads/kyc/${req.file.filename}`;

      // Handle Aadhaar-specific logic
      if (documentType === DocumentType.AADHAAR_CARD) {
        if (!aadhaarNumber) {
          res.status(400).json({ success: false, message: 'aadhaarNumber is required for Aadhaar upload' });
          return;
        }
        if (!validateAadhaar(aadhaarNumber)) {
          res.status(400).json({ success: false, message: 'Invalid Aadhaar number (must be 12 digits, not starting with 0 or 1)' });
          return;
        }
        await prisma.advisor.update({
          where: { id: advisorId },
          data: {
            aadhaarLast4: maskAadhaar(aadhaarNumber),
            aadhaarHash: hashAadhaar(aadhaarNumber),
          },
        });
      }

      const doc = await prisma.advisorDocument.create({
        data: { advisorId, documentType: documentType as DocumentType, documentUrl },
      });

      // Save profile photo URL into advisor.avatarUrl for display on profiles
      if (documentType === 'PASSPORT_PHOTO') {
        await prisma.advisor.update({
          where: { id: advisorId },
          data: { avatarUrl: documentUrl },
        });
      }

      res.status(201).json({ success: true, message: 'Document uploaded successfully', data: doc });
    } catch (error) {
      console.error('[documents upload]', error);
      res.status(500).json({ success: false, message: 'Error uploading document' });
    }
  }
);

/**
 * 5. POST /advisors/onboarding-progress
 * Tracks funnel progress (unauthenticated — called before account creation).
 */
router.post('/onboarding-progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, currentStep, stepLabel, formSnapshot, advisorId } = req.body;
    if (!phoneNumber) { res.status(400).json({ success: false, message: 'phoneNumber required' }); return; }

    await prisma.onboardingSession.upsert({
      where: { phoneNumber },
      update: { currentStep: currentStep ?? 1, stepLabel: stepLabel ?? 'unknown', formSnapshot: formSnapshot ?? undefined, advisorId: advisorId ?? undefined },
      create: { phoneNumber, currentStep: currentStep ?? 1, stepLabel: stepLabel ?? 'started', formSnapshot: formSnapshot ?? undefined, advisorId: advisorId ?? undefined },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[onboarding-progress]', err);
    res.status(500).json({ success: false, message: 'Failed to save progress' });
  }
});

/**
 * 6. GET /advisors/onboarding-progress/:phoneNumber
 * Retrieve saved funnel progress for resume.
 */
router.get('/onboarding-progress/:phoneNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await prisma.onboardingSession.findUnique({
      where: { phoneNumber: req.params.phoneNumber },
    });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch progress' });
  }
});

export default router;
