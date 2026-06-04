import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, VerificationStatus } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, requireRole, logAuditEvent, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { exportToExcel } from '../utils/excelExport';

const router = Router();

const verifyAdvisorSchema = z.object({
  body: z.object({
    status: z.nativeEnum(VerificationStatus),
    reason: z.string().optional()
  })
});

/**
 * 1. GET /admin/dashboard
 * Aggregates core platform metrics for dashboard widgets. Restricted to ADMIN roles.
 */
router.get(
  '/dashboard',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const [
        totalUsers,
        totalAdvisors,
        pendingAdvisors,
        completedConsultations,
        revenueSum,
        recentLogs
      ] = await prisma.$transaction([
        prisma.user.count({ where: { role: Role.CLIENT } }),
        prisma.advisor.count(),
        prisma.advisor.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.transaction.aggregate({
          where: { status: 'SUCCESS', bookingId: { not: null } },
          _sum: {
            amount: true,
            commission: true
          }
        }),
        prisma.auditLog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true, role: true } }
          }
        })
      ]);

      const formattedLogs = recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actor: log.user?.fullName || 'SYSTEM',
        role: log.user?.role || 'SYSTEM',
        details: log.details,
        date: log.createdAt
      }));

      const [authorizedAdvisors, regularAdvisors, activeSubscriptions, subRevenue, abandonedFunnels, completedOnboardings] =
        await prisma.$transaction([
          prisma.advisor.count({ where: { advisorType: 'AUTHORIZED' } }),
          prisma.advisor.count({ where: { advisorType: 'REGULAR' } }),
          prisma.advisorSubscription.count({ where: { status: 'SUCCESS', expiresAt: { gt: new Date() } } }),
          prisma.advisorSubscription.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
          prisma.onboardingSession.count({ where: { currentStep: { lt: 8 } } }),
          prisma.onboardingSession.count({ where: { currentStep: 8 } }),
        ]);

      res.status(200).json({
        success: true,
        metrics: {
          totalClients: totalUsers,
          totalAdvisors,
          authorizedAdvisors,
          regularAdvisors,
          pendingVerification: pendingAdvisors,
          consultationsCompleted: completedConsultations,
          grossRevenue: Number(revenueSum._sum.amount || 0).toFixed(2),
          platformCommission: Number(revenueSum._sum.commission || 0).toFixed(2),
          activeSubscriptions,
          subscriptionRevenue: Number(subRevenue._sum.amount || 0).toFixed(2),
          abandonedFunnels,
          completedOnboardings,
        },
        recentActivity: formattedLogs
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to aggregate dashboard metrics' });
    }
  }
);

/**
 * 2. GET /admin/advisors/pending
 * Retrieve list of advisors awaiting credentials verification.
 */
router.get(
  '/advisors/pending',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await prisma.advisor.findMany({
        where: { verificationStatus: VerificationStatus.PENDING },
        include: {
          documents: true
        },
        orderBy: { createdAt: 'asc' }
      });

      res.status(200).json({
        success: true,
        data: list
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to query pending advisors' });
    }
  }
);

/**
 * 3. POST /admin/advisors/:id/verify
 * Approve, Reject, or Suspend advisor platform licenses.
 */
router.post(
  '/advisors/:id/verify',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN]),
  validateRequest(verifyAdvisorSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user!.id;

    try {
      const advisor = await prisma.advisor.findUnique({ where: { id } });

      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor profile not found' });
        return;
      }

      // Update advisor status
      const updatedAdvisor = await prisma.advisor.update({
        where: { id },
        data: {
          verificationStatus: status
        }
      });

      // Audit logs registration
      await logAuditEvent(
        'KYC_VERIFICATION',
        adminId,
        {
          advisorId: id,
          advisorName: advisor.fullName,
          statusChange: `${advisor.verificationStatus} -> ${status}`,
          reason: reason || 'N/A'
        },
        id,
        req
      );

      res.status(200).json({
        success: true,
        message: `Advisor status updated to ${status} successfully.`,
        data: updatedAdvisor
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to verify advisor credentials.' });
    }
  }
);

/**
 * POST /admin/advisors/:id/dealer
 * Grant or revoke the Authorised Dealer status for an advisor.
 */
router.post(
  '/advisors/:id/dealer',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN]),
  validateRequest(z.object({ body: z.object({ action: z.enum(['GRANT', 'REVOKE']) }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { action } = req.body;
    const adminId = req.user!.id;

    try {
      const advisor = await prisma.advisor.findUnique({ where: { id } });
      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor not found' });
        return;
      }

      const updatedAdvisor = await prisma.advisor.update({
        where: { id },
        data: {
          isAuthorizedDealer: action === 'GRANT',
          dealerAuthorizedAt: action === 'GRANT' ? new Date() : null
        }
      });

      await logAuditEvent(
        'DEALER_STATUS_CHANGE',
        adminId,
        { advisorId: id, advisorName: advisor.fullName, action },
        id,
        req
      );

      res.status(200).json({
        success: true,
        message: `Dealer status ${action === 'GRANT' ? 'granted' : 'revoked'} for ${advisor.fullName}.`,
        data: { isAuthorizedDealer: updatedAdvisor.isAuthorizedDealer, dealerAuthorizedAt: updatedAdvisor.dealerAuthorizedAt }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update dealer status.' });
    }
  }
);

/**
 * GET /admin/bookings
 * Returns all bookings across the platform for admin oversight.
 */
router.get(
  '/bookings',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const where = status ? { status: status as any } : {};

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          client: { select: { id: true, fullName: true, phoneNumber: true, avatarUrl: true } },
          advisor: { select: { id: true, fullName: true, businessName: true, location: true } },
          transaction: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      res.status(200).json({ success: true, data: bookings });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
    }
  }
);

const ADMIN_GUARD = [authenticateJWT, requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN])];

/**
 * GET /admin/advisors — all advisors with filters
 */
router.get('/advisors', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, state, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status && status !== 'ALL') where.verificationStatus = status;
    if (type && type !== 'ALL') where.advisorType = type;
    if (state) where.state = { contains: state, mode: 'insensitive' };

    const [advisors, total] = await prisma.$transaction([
      prisma.advisor.findMany({
        where,
        include: { documents: true, subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.advisor.count({ where }),
    ]);

    res.json({ success: true, data: advisors, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch advisors' });
  }
});

/**
 * GET /admin/users — all client users
 */
router.get('/users', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const { state, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = { role: Role.CLIENT };
    if (state) where.state = { contains: state, mode: 'insensitive' };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          _count: { select: { bookings: true } },
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 1, where: { action: 'LOGIN' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

/**
 * GET /admin/funnel — onboarding drop-off analytics
 */
router.get('/funnel', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.onboardingSession.findMany({ orderBy: { createdAt: 'desc' } });

    const STEP_LABELS: Record<number, string> = {
      1: 'Phone OTP',
      2: 'Advisor Type',
      3: 'Account',
      4: 'Profile',
      5: 'KYC Upload',
      6: 'Services',
      7: 'Availability',
      8: 'Submitted',
    };

    const stepCounts: Record<number, number> = {};
    for (let i = 1; i <= 8; i++) stepCounts[i] = 0;
    sessions.forEach((s) => {
      for (let i = 1; i <= s.currentStep; i++) stepCounts[i] = (stepCounts[i] || 0) + 1;
    });

    const funnel = Object.entries(stepCounts).map(([step, count]) => ({
      step: parseInt(step),
      label: STEP_LABELS[parseInt(step)],
      count,
    }));

    res.json({ success: true, funnel, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch funnel data' });
  }
});

/**
 * GET /admin/subscriptions — all advisor subscriptions
 */
router.get('/subscriptions', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const [subs, total] = await prisma.$transaction([
      prisma.advisorSubscription.findMany({
        where,
        include: { advisor: { select: { id: true, fullName: true, email: true, phoneNumber: true, advisorType: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.advisorSubscription.count({ where }),
    ]);

    res.json({ success: true, data: subs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

/**
 * GET /admin/export/:entity — download XLSX for advisors | users | funnel | subscriptions | bookings
 */
router.get('/export/:entity', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  const { entity } = req.params;
  try {
    if (entity === 'advisors') {
      const advisors = await prisma.advisor.findMany({ include: { subscriptions: { take: 1, orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } });
      await exportToExcel(res, 'advisors', 'Advisors', [
        { header: 'Name', key: 'fullName', width: 22 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Phone', key: 'phoneNumber', width: 16 },
        { header: 'Type', key: 'advisorType', width: 14 },
        { header: 'Status', key: 'verificationStatus', width: 14 },
        { header: 'State', key: 'state', width: 16 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Experience (yrs)', key: 'experienceYears', width: 16 },
        { header: 'Fee (₹)', key: 'consultationFee', width: 12 },
        { header: 'License No.', key: 'licenseNumber', width: 18 },
        { header: 'GST No.', key: 'gstNumber', width: 18 },
        { header: 'Aadhaar (masked)', key: 'aadhaarLast4', width: 18 },
        { header: 'Authorized Dealer', key: 'isAuthorizedDealer', width: 16 },
        { header: 'Joined', key: 'createdAt', width: 20 },
      ], advisors.map((a) => ({ ...a, createdAt: a.createdAt.toISOString().slice(0, 10), consultationFee: Number(a.consultationFee) })));

    } else if (entity === 'users') {
      const users = await prisma.user.findMany({ where: { role: Role.CLIENT }, include: { _count: { select: { bookings: true } } }, orderBy: { createdAt: 'desc' } });
      await exportToExcel(res, 'users', 'Users', [
        { header: 'Name', key: 'fullName', width: 22 },
        { header: 'Phone', key: 'phoneNumber', width: 16 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'State', key: 'state', width: 16 },
        { header: 'Bookings', key: 'bookingCount', width: 12 },
        { header: 'Joined', key: 'createdAt', width: 20 },
      ], users.map((u) => ({ ...u, bookingCount: (u as any)._count.bookings, createdAt: u.createdAt.toISOString().slice(0, 10) })));

    } else if (entity === 'funnel') {
      const sessions = await prisma.onboardingSession.findMany({ orderBy: { createdAt: 'desc' } });
      await exportToExcel(res, 'funnel', 'Onboarding Funnel', [
        { header: 'Phone', key: 'phoneNumber', width: 16 },
        { header: 'Step Reached', key: 'currentStep', width: 14 },
        { header: 'Step Label', key: 'stepLabel', width: 18 },
        { header: 'Last Active', key: 'lastActiveAt', width: 22 },
        { header: 'Advisor Created', key: 'advisorId', width: 14 },
        { header: 'Started', key: 'createdAt', width: 22 },
      ], sessions.map((s) => ({ ...s, advisorId: s.advisorId ? 'Yes' : 'No', lastActiveAt: s.lastActiveAt.toISOString().slice(0, 19).replace('T', ' '), createdAt: s.createdAt.toISOString().slice(0, 19).replace('T', ' ') })));

    } else if (entity === 'subscriptions') {
      const subs = await prisma.advisorSubscription.findMany({ include: { advisor: true }, orderBy: { createdAt: 'desc' } });
      await exportToExcel(res, 'subscriptions', 'Subscriptions', [
        { header: 'Advisor Name', key: 'advisorName', width: 22 },
        { header: 'Email', key: 'advisorEmail', width: 28 },
        { header: 'Type', key: 'advisorType', width: 14 },
        { header: 'Razorpay Order ID', key: 'razorpayOrderId', width: 28 },
        { header: 'Razorpay Payment ID', key: 'razorpayPaymentId', width: 28 },
        { header: 'Amount (₹)', key: 'amount', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Subscribed At', key: 'subscribedAt', width: 22 },
        { header: 'Expires At', key: 'expiresAt', width: 22 },
      ], subs.map((s) => ({ ...s, advisorName: s.advisor.fullName, advisorEmail: s.advisor.email, advisorType: s.advisor.advisorType, amount: Number(s.amount), subscribedAt: s.subscribedAt?.toISOString().slice(0, 10) || '', expiresAt: s.expiresAt?.toISOString().slice(0, 10) || '' })));

    } else if (entity === 'bookings') {
      const bookings = await prisma.booking.findMany({ include: { client: { select: { fullName: true, phoneNumber: true } }, advisor: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } });
      await exportToExcel(res, 'bookings', 'Bookings', [
        { header: 'Booking #', key: 'bookingNumber', width: 20 },
        { header: 'Client', key: 'clientName', width: 22 },
        { header: 'Client Phone', key: 'clientPhone', width: 16 },
        { header: 'Advisor', key: 'advisorName', width: 22 },
        { header: 'Mode', key: 'mode', width: 12 },
        { header: 'Date', key: 'scheduledDate', width: 14 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Fee (₹)', key: 'totalFee', width: 12 },
        { header: 'Created', key: 'createdAt', width: 20 },
      ], bookings.map((b) => ({ ...b, clientName: b.client.fullName, clientPhone: b.client.phoneNumber, advisorName: b.advisor.fullName, totalFee: Number(b.totalFee), scheduledDate: b.scheduledDate.toISOString().slice(0, 10), createdAt: b.createdAt.toISOString().slice(0, 10) })));

    } else {
      res.status(400).json({ success: false, message: 'Unknown export entity' });
    }
  } catch (err) {
    console.error('[export]', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

export default router;
