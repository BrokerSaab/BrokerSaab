import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { authenticateJWT, requireRole, logAuditEvent, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { exportToExcel } from '../utils/excelExport';

const router = Router();

// ── Period → date range helper ────────────────────────────────────────────────
function periodToRange(
  period: string,
  from?: string,
  to?: string,
  month?: string
): { gte?: Date; lte?: Date } | null {
  const now = new Date();
  if (period === 'TODAY') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (period === 'THIS_WEEK') {
    const start = new Date(now);
    const day = now.getDay();
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
    return { gte: start };
  }
  if (period === 'THIS_MONTH') {
    return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  }
  if (period === 'THIS_QUARTER') {
    const q = Math.floor(now.getMonth() / 3);
    return { gte: new Date(now.getFullYear(), q * 3, 1) };
  }
  if (period === 'THIS_YEAR') {
    return { gte: new Date(now.getFullYear(), 0, 1) };
  }
  if (period === 'LAST_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: start, lte: end };
  }
  if (period === 'CUSTOM' && from) {
    const result: { gte?: Date; lte?: Date } = { gte: new Date(from) };
    if (to) result.lte = new Date(to + 'T23:59:59.999Z');
    return result;
  }
  if (month) {
    const [y, m] = month.split('-').map(Number);
    return { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 1) };
  }
  return null;
}

const SUPER_ADMIN_ONLY = [authenticateJWT, requireRole([Role.SUPER_ADMIN])];
const ADMIN_GUARD      = [authenticateJWT, requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN])];

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

      const [authorizedAdvisors, regularAdvisors, approvedAdvisors, activeSubscriptions, subRevenue, abandonedFunnels, completedOnboardings] =
        await prisma.$transaction([
          prisma.advisor.count({ where: { advisorType: 'AUTHORIZED' } }),
          prisma.advisor.count({ where: { advisorType: 'REGULAR' } }),
          prisma.advisor.count({ where: { verificationStatus: VerificationStatus.APPROVED } }),
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
          approvedAdvisors,
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
 * SUPER_ADMIN: returns SUBMITTED_FOR_APPROVAL queue (ready to go live).
 * SUB_ADMIN: returns their own UNDER_REVIEW assigned queue.
 */
router.get(
  '/advisors/pending',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN]),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const isSuperAdmin = req.user!.role === Role.SUPER_ADMIN;
      const where = isSuperAdmin
        ? { verificationStatus: VerificationStatus.SUBMITTED_FOR_APPROVAL }
        : { verificationStatus: VerificationStatus.UNDER_REVIEW, assignedSubAdminId: req.user!.id };

      const list = await prisma.advisor.findMany({
        where,
        include: {
          documents: true,
          assignedSubAdmin: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.status(200).json({ success: true, data: list });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to query pending advisors' });
    }
  }
);

/**
 * 3. POST /admin/advisors/:id/verify
 * Approve, Reject, or Suspend advisor.
 * - REJECTED requires a reason (persisted as rejectionComment).
 * - SUB_ADMIN may only reject UNDER_REVIEW advisors assigned to them.
 * - SUPER_ADMIN may act on any advisor at any stage.
 */
router.post(
  '/advisors/:id/verify',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SUB_ADMIN]),
  validateRequest(verifyAdvisorSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId  = req.user!.id;
    const isSuperAdmin = req.user!.role === Role.SUPER_ADMIN;

    if (status === VerificationStatus.REJECTED && (!reason || reason.trim().length < 5)) {
      res.status(400).json({ success: false, message: 'A rejection reason (min 5 chars) is required.' });
      return;
    }

    try {
      const advisor = await prisma.advisor.findUnique({ where: { id } });
      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor profile not found' });
        return;
      }

      if (!isSuperAdmin) {
        if (status !== VerificationStatus.REJECTED) {
          res.status(403).json({ success: false, message: 'Sub-admins may only reject advisors. Use submit-for-approval to forward for final approval.' });
          return;
        }
        if (advisor.verificationStatus !== VerificationStatus.UNDER_REVIEW || advisor.assignedSubAdminId !== adminId) {
          res.status(403).json({ success: false, message: 'You can only reject advisors assigned to you that are under review.' });
          return;
        }
      }

      const updateData: any = { verificationStatus: status };
      if (status === VerificationStatus.REJECTED) updateData.rejectionComment = reason.trim();
      if (status === VerificationStatus.APPROVED) updateData.rejectionComment = null;

      const updatedAdvisor = await prisma.advisor.update({ where: { id }, data: updateData });

      await logAuditEvent(
        'KYC_VERIFICATION',
        adminId,
        { advisorId: id, advisorName: advisor.fullName, statusChange: `${advisor.verificationStatus} -> ${status}`, reason: reason || 'N/A' },
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

/**
 * GET /admin/advisors — all advisors with filters
 */
router.get('/advisors', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, state, search, page = '1', limit = '50',
            minReceived = '', joinPeriod = '', joinFrom = '', joinTo = '', joinMonth = '' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status && status !== 'ALL') where.verificationStatus = status;
    if (type && type !== 'ALL') where.advisorType = type;
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (search) {
      const seqMatch = search.match(/BSA-?(\d+)/i);
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        ...(seqMatch ? [{ seqId: parseInt(seqMatch[1]) }] : []),
      ];
    }

    // Join-date period filter
    const joinDateRange = periodToRange(joinPeriod, joinFrom || undefined, joinTo || undefined, joinMonth || undefined);
    if (joinDateRange) where.createdAt = joinDateRange;

    // minReceived: advisors who have been unlocked by >= N users
    if (minReceived && parseInt(minReceived) > 0) {
      const groups = await prisma.contactUnlock.groupBy({
        by: ['advisorId'],
        _count: { advisorId: true },
        having: { advisorId: { _count: { gte: parseInt(minReceived) } } },
      });
      const qualifiedIds = groups.map((g: any) => g.advisorId);
      where.id = { in: qualifiedIds };
    }

    const [advisors, total] = await prisma.$transaction([
      prisma.advisor.findMany({
        where,
        include: {
          documents: true,
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
          assignedSubAdmin: { select: { id: true, fullName: true, email: true } },
          _count: { select: { contactUnlocks: true } },
        },
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
    const { state, search, page = '1', limit = '50',
            minConnections = '', maxConnections = '',
            joinPeriod = '', joinFrom = '', joinTo = '', joinMonth = '' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = { role: Role.CLIENT };
    if (state) where.state = { contains: state, mode: 'insensitive' };

    // Join-date period filter
    const joinDateRange = periodToRange(joinPeriod, joinFrom || undefined, joinTo || undefined, joinMonth || undefined);
    if (joinDateRange) where.createdAt = joinDateRange;

    if (search) {
      const seqMatch = search.match(/BSU-?(\d+)/i);
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        ...(seqMatch ? [{ seqId: parseInt(seqMatch[1]) }] : []),
      ];
    }

    // Connection count filters — users who have unlocked >= minConnections advisors
    const minConn = parseInt(minConnections) || 0;
    const maxConn = parseInt(maxConnections) || 0;
    if (minConn > 0 || maxConn > 0) {
      const groups = await prisma.contactUnlock.groupBy({
        by: ['userId'],
        _count: { userId: true },
        having: {
          userId: {
            _count: {
              ...(minConn > 0 ? { gte: minConn } : {}),
              ...(maxConn > 0 ? { lte: maxConn } : {}),
            },
          },
        },
      });
      const qualifiedIds = groups.map((g: any) => g.userId);
      where.id = { in: qualifiedIds };
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          _count: { select: { bookings: true, contactUnlocks: true } },
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
 * GET /admin/contact-subscriptions — all user contact pack purchases
 */
router.get('/contact-subscriptions', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const [subs, total] = await prisma.$transaction([
      prisma.userContactSubscription.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true, phoneNumber: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.userContactSubscription.count({ where }),
    ]);

    res.json({ success: true, data: subs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch contact subscriptions' });
  }
});

/**
 * GET /admin/contact-unlocks — all individual advisor contact unlocks with user + advisor info
 */
router.get('/contact-unlocks', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search = '', page = '1', limit = '50',
            period = '', from = '', to = '', month = '',
            advisorId = '', isFree = '' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { user:   { fullName:    { contains: search.trim(), mode: 'insensitive' } } },
        { user:   { phoneNumber: { contains: search.trim(), mode: 'insensitive' } } },
        { advisor:{ fullName:    { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }
    if (advisorId) where.advisorId = advisorId;
    if (isFree === 'true')  where.isFree = true;
    if (isFree === 'false') where.isFree = false;

    const dateRange = periodToRange(period, from || undefined, to || undefined, month || undefined);
    if (dateRange) where.createdAt = dateRange;

    const [unlocks, total, freeCount, uniqueUsers, uniqueAdvisors] = await prisma.$transaction([
      prisma.contactUnlock.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
          advisor: {
            select: {
              id: true, fullName: true, businessName: true, phoneNumber: true, email: true,
              location: true, state: true,
              categories: { include: { category: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.contactUnlock.count({ where }),
      prisma.contactUnlock.count({ where: { ...where, isFree: true } }),
      prisma.contactUnlock.findMany({ where, select: { userId: true }, distinct: ['userId'] }),
      prisma.contactUnlock.findMany({ where, select: { advisorId: true }, distinct: ['advisorId'] }),
    ]);

    res.json({
      success: true,
      summary: {
        total,
        uniqueUsers: uniqueUsers.length,
        uniqueAdvisors: uniqueAdvisors.length,
        freeConnections: freeCount,
        paidConnections: total - freeCount,
      },
      data: unlocks.map((u) => ({
        id: u.id,
        unlockedAt: u.createdAt,
        isFree: u.isFree,
        user: u.user,
        advisor: {
          ...u.advisor,
          categories: u.advisor.categories.map((c) => c.category.name),
        },
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('[admin/contact-unlocks]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch contact unlocks' });
  }
});

/**
 * GET /admin/analytics/connections — aggregated connection trend + top advisors/users
 */
router.get('/analytics/connections', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'THIS_YEAR', from = '', to = '', month = '', groupBy = 'MONTH' } = req.query as Record<string, string>;
    const dateRange = periodToRange(period, from || undefined, to || undefined, month || undefined);
    const where: any = {};
    if (dateRange) where.createdAt = dateRange;

    const [allUnlocks, topAdvisorsRaw, topUsersRaw] = await Promise.all([
      prisma.contactUnlock.findMany({ where, select: { createdAt: true }, orderBy: { createdAt: 'asc' } }),
      prisma.contactUnlock.groupBy({
        by: ['advisorId'], where, _count: { advisorId: true },
        orderBy: { _count: { advisorId: 'desc' } }, take: 5,
      }),
      prisma.contactUnlock.groupBy({
        by: ['userId'], where, _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } }, take: 5,
      }),
    ]);

    // Build trend grouped by DAY / WEEK / MONTH
    const trendMap: Record<string, number> = {};
    for (const u of allUnlocks) {
      const d = new Date(u.createdAt);
      let key: string;
      if (groupBy === 'DAY') {
        key = d.toISOString().slice(0, 10);
      } else if (groupBy === 'WEEK') {
        const s = new Date(d);
        s.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
        key = s.toISOString().slice(0, 10);
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      trendMap[key] = (trendMap[key] || 0) + 1;
    }
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => ({ label, count }));

    // Enrich top advisors with names
    const advIds = topAdvisorsRaw.map((a: any) => a.advisorId);
    const advDetails = await prisma.advisor.findMany({
      where: { id: { in: advIds } },
      select: { id: true, fullName: true, location: true, state: true },
    });
    const topAdvisors = topAdvisorsRaw.map((a: any) => {
      const d = advDetails.find((x: any) => x.id === a.advisorId);
      return { advisorId: a.advisorId, fullName: d?.fullName ?? '—', location: d?.location ?? '', connectionCount: a._count.advisorId };
    });

    // Enrich top users with names
    const usrIds = topUsersRaw.map((u: any) => u.userId);
    const usrDetails = await prisma.user.findMany({
      where: { id: { in: usrIds } },
      select: { id: true, fullName: true, phoneNumber: true },
    });
    const topUsers = topUsersRaw.map((u: any) => {
      const d = usrDetails.find((x: any) => x.id === u.userId);
      return { userId: u.userId, fullName: d?.fullName ?? '—', phoneNumber: d?.phoneNumber ?? '', connectionCount: u._count.userId };
    });

    res.json({ success: true, trend, topAdvisors, topUsers });
  } catch (err) {
    console.error('[admin/analytics/connections]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch connection analytics' });
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

    } else if (entity === 'contact-subscriptions') {
      const subs = await prisma.userContactSubscription.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
      await exportToExcel(res, 'contact-subscriptions', 'Contact Packs', [
        { header: 'User Name', key: 'userName', width: 22 },
        { header: 'Phone', key: 'userPhone', width: 16 },
        { header: 'Email', key: 'userEmail', width: 28 },
        { header: 'Razorpay Order ID', key: 'razorpayOrderId', width: 28 },
        { header: 'Razorpay Payment ID', key: 'razorpayPaymentId', width: 28 },
        { header: 'Amount (₹)', key: 'amount', width: 14 },
        { header: 'Credits Total', key: 'creditsTotal', width: 14 },
        { header: 'Credits Used', key: 'creditsUsed', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Subscribed At', key: 'subscribedAt', width: 22 },
        { header: 'Expires At', key: 'expiresAt', width: 22 },
      ], subs.map((s) => ({ ...s, userName: s.user.fullName || '—', userPhone: s.user.phoneNumber, userEmail: s.user.email || '—', amount: Number(s.amount), subscribedAt: s.subscribedAt?.toISOString().slice(0, 10) || '', expiresAt: s.expiresAt?.toISOString().slice(0, 10) || '' })));

    } else {
      res.status(400).json({ success: false, message: 'Unknown export entity' });
    }
  } catch (err) {
    console.error('[export]', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * PATCH /admin/advisors/:id/categories
 * Assign/replace service categories for any advisor (admin action).
 * Useful for fixing advisors whose category assignment failed at onboarding.
 */
router.patch(
  '/advisors/:id/categories',
  ...ADMIN_GUARD,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { categorySlugs } = req.body;

    if (!Array.isArray(categorySlugs) || categorySlugs.length === 0) {
      res.status(400).json({ success: false, message: 'categorySlugs array required' });
      return;
    }

    try {
      const advisor = await prisma.advisor.findUnique({ where: { id } });
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
        prisma.advisorCategory.deleteMany({ where: { advisorId: id } }),
        prisma.advisorCategory.createMany({
          data: categories.map(c => ({ advisorId: id, categoryId: c.id })),
          skipDuplicates: true,
        }),
      ]);

      res.json({
        success: true,
        message: `${categories.length} categories assigned to ${advisor.fullName}`,
        assigned: categories.map(c => c.slug),
      });
    } catch (err) {
      console.error('[admin/categories PATCH]', err);
      res.status(500).json({ success: false, message: 'Failed to assign categories' });
    }
  }
);

const TICKET_ADMIN_INCLUDE = {
  user: { select: { fullName: true, phoneNumber: true, email: true, role: true } },
  assignedToAdmin: { select: { id: true, fullName: true } },
  activities: { orderBy: { createdAt: 'asc' as const } },
} as const;

// ── GET /admin/tickets ────────────────────────────────────────────
router.get('/tickets', ...ADMIN_GUARD, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId   = req.user!.id;
    const adminRole = req.user!.role as string;
    const status = (req.query.status as string) || 'ALL';
    const search = (req.query.search as string) || '';
    const limit  = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const where: any = {};
    // SUB_ADMIN sees only their assigned tickets
    if (adminRole === Role.SUB_ADMIN) where.assignedToAdminId = adminId;
    if (status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { phoneNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTickets.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: TICKET_ADMIN_INCLUDE,
      }),
      prisma.supportTickets.count({ where }),
    ]);

    return res.json({ success: true, tickets, total });
  } catch (err) {
    console.error('[admin/tickets GET]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

// ── PATCH /admin/tickets/:id ──────────────────────────────────────
router.patch('/tickets/:id', ...ADMIN_GUARD, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const { id }  = req.params;
    const { status, closingNotes, note } = req.body;

    const allowed = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }
    if (status === 'CLOSED' && !closingNotes?.trim()) {
      return res.status(400).json({ success: false, message: 'Closing notes are required when closing a ticket.' });
    }

    const existing = await prisma.supportTickets.findUnique({ where: { id }, select: { status: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const admin = await prisma.adminUsers.findUnique({ where: { id: adminId }, select: { fullName: true, role: true } });
    const adminName = admin?.fullName || 'Admin';
    const adminRole = (admin?.role as string) || 'ADMIN';

    const updateData: any = {
      status,
      ...(status === 'CLOSED' && { closingNotes: closingNotes.trim(), closedAt: new Date() }),
      ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      activities: {
        create: {
          action: status === 'CLOSED' ? 'CLOSED' : 'STATUS_CHANGED',
          fromStatus: existing.status,
          toStatus: status,
          note: status === 'CLOSED' ? closingNotes.trim() : (note?.trim() || null),
          performedByName: adminName,
          performedByRole: adminRole,
        },
      },
    };

    const ticket = await prisma.supportTickets.update({
      where: { id },
      data: updateData,
      include: TICKET_ADMIN_INCLUDE,
    });

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('[admin/tickets PATCH]', err);
    return res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
});

// ── POST /admin/tickets/:id/assign ────────────────────────────────
router.post('/tickets/:id/assign', ...SUPER_ADMIN_ONLY, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const superAdminId = req.user!.id;
    const { id }       = req.params;
    const { adminId }  = req.body;

    if (!adminId) {
      return res.status(400).json({ success: false, message: 'adminId is required' });
    }

    const [subAdmin, existing, superAdmin] = await Promise.all([
      prisma.adminUsers.findUnique({ where: { id: adminId }, select: { fullName: true, role: true } }),
      prisma.supportTickets.findUnique({ where: { id }, select: { status: true } }),
      prisma.adminUsers.findUnique({ where: { id: superAdminId }, select: { fullName: true } }),
    ]);

    if (!subAdmin || subAdmin.role !== Role.SUB_ADMIN) {
      return res.status(400).json({ success: false, message: 'Target admin must be a SUB_ADMIN' });
    }
    if (!existing) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const ticket = await prisma.supportTickets.update({
      where: { id },
      data: {
        assignedToAdminId: adminId,
        status: existing.status === 'OPEN' ? 'IN_PROGRESS' : existing.status,
        activities: {
          create: {
            action: 'ASSIGNED',
            fromStatus: existing.status,
            toStatus: existing.status === 'OPEN' ? 'IN_PROGRESS' : existing.status,
            note: `Assigned to ${subAdmin.fullName}`,
            performedByName: superAdmin?.fullName || 'Super Admin',
            performedByRole: Role.SUPER_ADMIN,
          },
        },
      },
      include: TICKET_ADMIN_INCLUDE,
    });

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('[admin/tickets/:id/assign POST]', err);
    return res.status(500).json({ success: false, message: 'Failed to assign ticket' });
  }
});

// ── GET /admin/sub-admins/list ────────────────────────────────────
router.get('/sub-admins/list', ...SUPER_ADMIN_ONLY, async (_req: Request, res: Response) => {
  try {
    const subAdmins = await prisma.adminUsers.findMany({
      where: { role: Role.SUB_ADMIN, isActive: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    });
    return res.json({ success: true, data: subAdmins });
  } catch (err) {
    console.error('[admin/sub-admins/list GET]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch sub-admins' });
  }
});

// ── GET /admin/advisors/my-queue ─────────────────────────────────────
// SUB_ADMIN: returns advisors assigned to them that are UNDER_REVIEW
router.get('/advisors/my-queue', authenticateJWT, requireRole([Role.SUB_ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const advisors = await prisma.advisor.findMany({
      where: {
        assignedSubAdminId: req.user!.id,
        verificationStatus: VerificationStatus.UNDER_REVIEW,
      },
      include: {
        documents: true,
        assignedSubAdmin: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { assignedAt: 'asc' },
    });
    res.json({ success: true, data: advisors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch assigned queue' });
  }
});

// ── POST /admin/advisors/assign-bulk ─────────────────────────────────
// SUPER_ADMIN: bulk-assign advisors to a sub-admin
router.post('/advisors/assign-bulk', ...SUPER_ADMIN_ONLY,
  validateRequest(z.object({ body: z.object({ advisorIds: z.array(z.string()).min(1), subAdminId: z.string() }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { advisorIds, subAdminId } = req.body;
    const adminId = req.user!.id;
    try {
      const subAdmin = await prisma.adminUsers.findUnique({ where: { id: subAdminId } });
      if (!subAdmin || subAdmin.role !== Role.SUB_ADMIN) {
        res.status(400).json({ success: false, message: 'Invalid sub-admin ID' });
        return;
      }

      const result = await prisma.advisor.updateMany({
        where: { id: { in: advisorIds } },
        data: {
          assignedSubAdminId: subAdminId,
          verificationStatus: VerificationStatus.UNDER_REVIEW,
          assignedAt: new Date(),
        },
      });

      await logAuditEvent('BULK_ASSIGN', adminId, { advisorIds, subAdminId, subAdminName: subAdmin.fullName, count: result.count }, undefined, req);

      res.json({ success: true, message: `${result.count} advisor(s) assigned to ${subAdmin.fullName}`, count: result.count });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Bulk assignment failed' });
    }
  }
);

// ── POST /admin/advisors/:id/submit-for-approval ──────────────────────
// SUB_ADMIN: submit a reviewed advisor to super admin for final approval
router.post('/advisors/:id/submit-for-approval', authenticateJWT, requireRole([Role.SUB_ADMIN]),
  validateRequest(z.object({ body: z.object({ note: z.string().optional() }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user!.id;
    try {
      const advisor = await prisma.advisor.findUnique({ where: { id } });
      if (!advisor) { res.status(404).json({ success: false, message: 'Advisor not found' }); return; }
      if (advisor.verificationStatus !== VerificationStatus.UNDER_REVIEW) {
        res.status(400).json({ success: false, message: 'Advisor must be UNDER_REVIEW to submit for approval' });
        return;
      }
      if (advisor.assignedSubAdminId !== adminId) {
        res.status(403).json({ success: false, message: 'This advisor is not assigned to you' });
        return;
      }

      const updated = await prisma.advisor.update({
        where: { id },
        data: { verificationStatus: VerificationStatus.SUBMITTED_FOR_APPROVAL, subAdminNote: note || null },
      });

      await logAuditEvent('SUBMIT_FOR_APPROVAL', adminId, { advisorId: id, advisorName: advisor.fullName, note: note || '' }, id, req);

      res.json({ success: true, message: `${advisor.fullName} submitted for super admin approval.`, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to submit for approval' });
    }
  }
);

// ── PATCH /admin/advisors/:id/documents/:docId ───────────────────────
// Toggle document verified flag
router.patch('/advisors/:id/documents/:docId', ...ADMIN_GUARD,
  validateRequest(z.object({ body: z.object({ verified: z.boolean() }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id, docId } = req.params;
    const { verified } = req.body;
    const adminId = req.user!.id;
    try {
      const doc = await prisma.advisorDocument.findFirst({ where: { id: docId, advisorId: id } });
      if (!doc) { res.status(404).json({ success: false, message: 'Document not found' }); return; }

      const updated = await prisma.advisorDocument.update({
        where: { id: docId },
        data: { verified, verifiedByAdminId: verified ? adminId : null, verifiedAt: verified ? new Date() : null },
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update document verification' });
    }
  }
);

// ── GET /admin/sub-admins ─────────────────────────────────────────────
router.get('/sub-admins', ...SUPER_ADMIN_ONLY, async (_req: Request, res: Response) => {
  try {
    const subAdmins = await prisma.adminUsers.findMany({
      where: { role: Role.SUB_ADMIN },
      select: { id: true, seqId: true, fullName: true, email: true, role: true, isActive: true, createdAt: true, createdByAdminId: true },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch advisor counts grouped by sub-admin and status
    const counts = await prisma.advisor.groupBy({
      by: ['assignedSubAdminId', 'verificationStatus'],
      where: { assignedSubAdminId: { in: subAdmins.map(sa => sa.id) } },
      _count: { id: true },
    });

    // Build per-sub-admin stats map
    const statsMap: Record<string, { assigned: number; underReview: number; submitted: number; processed: number }> = {};
    for (const row of counts) {
      if (!row.assignedSubAdminId) continue;
      if (!statsMap[row.assignedSubAdminId]) {
        statsMap[row.assignedSubAdminId] = { assigned: 0, underReview: 0, submitted: 0, processed: 0 };
      }
      const s = statsMap[row.assignedSubAdminId];
      s.assigned += row._count.id;
      if (row.verificationStatus === VerificationStatus.UNDER_REVIEW) s.underReview += row._count.id;
      else if (row.verificationStatus === VerificationStatus.SUBMITTED_FOR_APPROVAL) s.submitted += row._count.id;
      else if (row.verificationStatus === VerificationStatus.APPROVED || row.verificationStatus === VerificationStatus.REJECTED) s.processed += row._count.id;
    }

    const data = subAdmins.map(sa => ({
      ...sa,
      stats: statsMap[sa.id] ?? { assigned: 0, underReview: 0, submitted: 0, processed: 0 },
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sub-admins' });
  }
});

// ── POST /admin/repair-categories ─────────────────────────────────────
// Auto-assigns categories to approved advisors who have none by inferring
// the parent module (m1-m19) from their specialization slugs (s1-2 → m1).
router.post('/repair-categories', ...SUPER_ADMIN_ONLY, async (_req: Request, res: Response) => {
  try {
    const advisorsWithNoCategories = await prisma.advisor.findMany({
      where: { verificationStatus: VerificationStatus.APPROVED, categories: { none: {} } },
      include: { specializations: { include: { specialization: true } } },
    });

    let repaired = 0;
    const details: string[] = [];

    for (const advisor of advisorsWithNoCategories) {
      // Infer module slugs from specialization slugs (pattern: sN-M → mN)
      const moduleSlugs = [...new Set(
        advisor.specializations
          .map(s => { const m = (s as any).specialization?.slug?.match(/^s(\d+)-/); return m ? `m${m[1]}` : null; })
          .filter((s): s is string => !!s)
      )];

      if (moduleSlugs.length === 0) {
        details.push(`${advisor.fullName}: no specializations to infer from`);
        continue;
      }

      const categories = await prisma.category.findMany({ where: { slug: { in: moduleSlugs } } });
      if (categories.length === 0) {
        details.push(`${advisor.fullName}: no matching categories for ${moduleSlugs.join(', ')}`);
        continue;
      }

      await prisma.advisorCategory.createMany({
        data: categories.map(c => ({ advisorId: advisor.id, categoryId: c.id })),
        skipDuplicates: true,
      });
      repaired++;
      details.push(`${advisor.fullName}: assigned ${categories.map(c => c.slug).join(', ')}`);
    }

    res.json({ success: true, totalFixed: repaired, total: advisorsWithNoCategories.length, details });
  } catch (err) {
    console.error('[repair-categories]', err);
    res.status(500).json({ success: false, message: 'Repair failed' });
  }
});

// ── POST /admin/sub-admins/bulk ───────────────────────────────────────
router.post('/sub-admins/bulk', ...SUPER_ADMIN_ONLY,
  validateRequest(z.object({
    body: z.object({
      entries: z.array(z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      })).min(1).max(10),
    }),
  })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { entries } = req.body;
    const createdByAdminId = req.user!.id;
    const results: { email: string; status: string; message?: string; data?: object }[] = [];
    for (const entry of entries) {
      try {
        const existing = await prisma.adminUsers.findUnique({ where: { email: entry.email } });
        if (existing) { results.push({ email: entry.email, status: 'failed', message: 'Email already exists' }); continue; }
        const passwordHash = await bcrypt.hash(entry.password, 12);
        const sa = await prisma.adminUsers.create({
          data: { fullName: entry.fullName, email: entry.email, passwordHash, role: Role.SUB_ADMIN, createdByAdminId },
          select: { id: true, fullName: true, email: true, role: true, createdAt: true },
        });
        await logAuditEvent('CREATE_SUB_ADMIN', createdByAdminId,
          { subAdminId: sa.id, email: entry.email, fullName: entry.fullName, method: 'bulk' }, undefined, req);
        results.push({ email: entry.email, status: 'created', data: sa });
      } catch { results.push({ email: entry.email, status: 'failed', message: 'Server error' }); }
    }
    const created = results.filter(r => r.status === 'created').length;
    res.status(207).json({ success: true, created, failed: results.length - created, results });
  }
);

// ── POST /admin/sub-admins ────────────────────────────────────────────
router.post('/sub-admins', ...SUPER_ADMIN_ONLY,
  validateRequest(z.object({ body: z.object({ fullName: z.string().min(2), email: z.string().email(), password: z.string().min(8) }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { fullName, email, password } = req.body;
    const createdByAdminId = req.user!.id;
    try {
      const existing = await prisma.adminUsers.findUnique({ where: { email } });
      if (existing) { res.status(409).json({ success: false, message: 'A user with this email already exists' }); return; }

      const passwordHash = await bcrypt.hash(password, 12);
      const subAdmin = await prisma.adminUsers.create({
        data: { fullName, email, passwordHash, role: Role.SUB_ADMIN, createdByAdminId },
        select: { id: true, fullName: true, email: true, role: true, createdAt: true },
      });

      await logAuditEvent('CREATE_SUB_ADMIN', createdByAdminId, { subAdminId: subAdmin.id, email, fullName }, undefined, req);

      res.status(201).json({ success: true, message: `Sub-admin ${fullName} created successfully.`, data: subAdmin });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create sub-admin' });
    }
  }
);

// ── GET /admin/my-stats ───────────────────────────────────────────────
// SUB_ADMIN: returns their own work stats
// SUPER_ADMIN: returns platform-level sub-admin workflow overview
router.get('/my-stats', ...ADMIN_GUARD, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const adminId = req.user!.id;
  const isSuperAdmin = req.user!.role === Role.SUPER_ADMIN;
  try {
    if (!isSuperAdmin) {
      const counts = await prisma.advisor.groupBy({
        by: ['verificationStatus'],
        where: { assignedSubAdminId: adminId },
        _count: { id: true },
      });
      const stats = { assigned: 0, underReview: 0, submitted: 0, processed: 0 };
      for (const row of counts) {
        stats.assigned += row._count.id;
        if (row.verificationStatus === VerificationStatus.UNDER_REVIEW) stats.underReview += row._count.id;
        else if (row.verificationStatus === VerificationStatus.SUBMITTED_FOR_APPROVAL) stats.submitted += row._count.id;
        else if (row.verificationStatus === VerificationStatus.APPROVED || row.verificationStatus === VerificationStatus.REJECTED) stats.processed += row._count.id;
      }
      res.json({ success: true, data: stats });
    } else {
      const [subAdminCount, pendingAdvisors, underReview, submitted] = await Promise.all([
        prisma.adminUsers.count({ where: { role: Role.SUB_ADMIN } }),
        prisma.advisor.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
        prisma.advisor.count({ where: { verificationStatus: VerificationStatus.UNDER_REVIEW } }),
        prisma.advisor.count({ where: { verificationStatus: VerificationStatus.SUBMITTED_FOR_APPROVAL } }),
      ]);
      res.json({ success: true, data: { subAdminCount, pendingAdvisors, underReview, submitted } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ── PATCH /admin/sub-admins/:id/status ────────────────────────────────
router.patch('/sub-admins/:id/status', ...SUPER_ADMIN_ONLY,
  validateRequest(z.object({ body: z.object({ isActive: z.boolean() }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
      const subAdmin = await prisma.adminUsers.findUnique({ where: { id } });
      if (!subAdmin || subAdmin.role !== Role.SUB_ADMIN) {
        res.status(404).json({ success: false, message: 'Sub-admin not found' }); return;
      }
      const updated = await prisma.adminUsers.update({
        where: { id },
        data: { isActive },
        select: { id: true, fullName: true, email: true, isActive: true },
      });
      await logAuditEvent(
        isActive ? 'ACTIVATE_SUB_ADMIN' : 'DEACTIVATE_SUB_ADMIN',
        req.user!.id,
        { subAdminId: id, fullName: subAdmin.fullName, isActive },
        undefined, req
      );
      res.json({ success: true, message: `${subAdmin.fullName} ${isActive ? 'activated' : 'deactivated'}.`, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update sub-admin status' });
    }
  }
);

// ── PATCH /admin/sub-admins/:id/password ──────────────────────────────
router.patch('/sub-admins/:id/password', ...SUPER_ADMIN_ONLY,
  validateRequest(z.object({ body: z.object({ password: z.string().min(8) }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;
    try {
      const subAdmin = await prisma.adminUsers.findUnique({ where: { id } });
      if (!subAdmin || subAdmin.role !== Role.SUB_ADMIN) {
        res.status(404).json({ success: false, message: 'Sub-admin not found' }); return;
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.adminUsers.update({ where: { id }, data: { passwordHash } });
      await logAuditEvent('RESET_SUB_ADMIN_PASSWORD', req.user!.id,
        { subAdminId: id, fullName: subAdmin.fullName }, undefined, req);
      res.json({ success: true, message: `Password reset for ${subAdmin.fullName}.` });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
  }
);

// ── DELETE /admin/sub-admins/:id ──────────────────────────────────────
router.delete('/sub-admins/:id', ...SUPER_ADMIN_ONLY, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const subAdmin = await prisma.adminUsers.findUnique({ where: { id } });
    if (!subAdmin || subAdmin.role !== Role.SUB_ADMIN) {
      res.status(404).json({ success: false, message: 'Sub-admin not found' });
      return;
    }
    // Re-set assigned advisors back to PENDING
    await prisma.advisor.updateMany({
      where: { assignedSubAdminId: id, verificationStatus: VerificationStatus.UNDER_REVIEW },
      data: { assignedSubAdminId: null, verificationStatus: VerificationStatus.PENDING, assignedAt: null },
    });
    await prisma.adminUsers.delete({ where: { id } });
    res.json({ success: true, message: `Sub-admin ${subAdmin.fullName} removed.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete sub-admin' });
  }
});

// ── Change Request endpoints ───────────────────────────────────────────────────

/**
 * GET /admin/change-requests
 * List all advisor change requests (filterable by status / fieldName).
 * SUPER_ADMIN sees all; SUB_ADMIN sees requests for advisors assigned to them.
 */
router.get('/change-requests', ...ADMIN_GUARD, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status, fieldName, page = '1', limit = '50' } = req.query as Record<string, string>;
  const isSuperAdmin = req.user!.role === Role.SUPER_ADMIN;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const where: any = {};
    if (status) where.status = status;
    if (fieldName) where.fieldName = fieldName;

    if (!isSuperAdmin) {
      // Sub-admin: only requests from advisors assigned to them
      const myAdvisors = await prisma.advisor.findMany({
        where: { assignedSubAdminId: req.user!.id },
        select: { id: true },
      });
      where.advisorId = { in: myAdvisors.map(a => a.id) };
    }

    const [requests, total] = await Promise.all([
      (prisma as any).advisorChangeRequest.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          advisor: { select: { id: true, seqId: true, fullName: true, phoneNumber: true, avatarUrl: true } },
        },
      }),
      (prisma as any).advisorChangeRequest.count({ where }),
    ]);

    res.json({ success: true, data: requests, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('[admin/change-requests GET]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch change requests' });
  }
});

/**
 * GET /admin/advisors/:id/change-requests
 * All change requests for a specific advisor.
 */
router.get('/advisors/:id/change-requests', ...ADMIN_GUARD, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const requests = await (prisma as any).advisorChangeRequest.findMany({
      where: { advisorId: id },
      orderBy: { requestedAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('[admin/advisors/:id/change-requests GET]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch change requests' });
  }
});

/**
 * PATCH /admin/change-requests/:id
 * Approve or reject a pending change request.
 * On APPROVE: applies the field change to the Advisor (and User for phoneNumber).
 */
router.patch('/change-requests/:id', ...ADMIN_GUARD,
  validateRequest(z.object({ body: z.object({ action: z.enum(['APPROVE', 'REJECT']), note: z.string().optional() }) })),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { action, note } = req.body;
    const adminId = req.user!.id;

    try {
      const cr = await (prisma as any).advisorChangeRequest.findUnique({
        where: { id },
        include: { advisor: true },
      });
      if (!cr) { res.status(404).json({ success: false, message: 'Change request not found' }); return; }
      if (cr.status !== 'PENDING') {
        res.status(400).json({ success: false, message: 'This change request has already been reviewed' });
        return;
      }

      if (action === 'REJECT') {
        await (prisma as any).advisorChangeRequest.update({
          where: { id },
          data: { status: 'REJECTED', reviewedAt: new Date(), reviewedById: adminId, reviewNote: note || null },
        });
        await logAuditEvent('CHANGE_REQUEST_REJECTED', adminId,
          { advisorId: cr.advisorId, fieldName: cr.fieldName, reviewNote: note || '' }, cr.advisorId, req);
        res.json({ success: true, message: 'Change request rejected.' });
        return;
      }

      // APPROVE — apply the field change
      const advisor = cr.advisor;
      const advisorUpdate: Record<string, any> = {};
      const userUpdate: Record<string, any> = {};

      if (cr.fieldName === 'phoneNumber') {
        advisorUpdate.phoneNumber = cr.newValue;
        userUpdate.phoneNumber = cr.newValue;
      } else if (cr.fieldName === 'aadhaarNumber') {
        const parsed = JSON.parse(cr.newValue) as { last4: string; hash: string };
        advisorUpdate.aadhaarLast4 = parsed.last4;
        advisorUpdate.aadhaarHash  = parsed.hash;
      } else if (cr.fieldName === 'licenseNumber') {
        advisorUpdate.licenseNumber = cr.newValue;
      } else if (cr.fieldName === 'fullName') {
        advisorUpdate.fullName = cr.newValue;
        // Mirror onto User row via phone number lookup
        userUpdate.fullName = cr.newValue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.advisor.update({ where: { id: advisor.id }, data: advisorUpdate });
        if (Object.keys(userUpdate).length > 0) {
          await tx.user.updateMany({ where: { phoneNumber: advisor.phoneNumber }, data: userUpdate });
        }
        await (tx as any).advisorChangeRequest.update({
          where: { id },
          data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: adminId, reviewNote: note || null },
        });
      });

      await logAuditEvent('CHANGE_REQUEST_APPROVED', adminId,
        { advisorId: cr.advisorId, advisorName: advisor.fullName, fieldName: cr.fieldName, newValue: cr.fieldName === 'aadhaarNumber' ? '[masked]' : cr.newValue },
        cr.advisorId, req);

      res.json({ success: true, message: `Change request for ${cr.fieldName} approved and applied.` });
    } catch (err) {
      console.error('[admin/change-requests/:id PATCH]', err);
      res.status(500).json({ success: false, message: 'Failed to process change request' });
    }
  }
);

/**
 * PATCH /admin/advisors/:id/edit
 * Admin direct-edit of ANY advisor field — no approval queue.
 * Super-admin only.
 */
router.patch('/advisors/:id/edit', ...SUPER_ADMIN_ONLY,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = req.user!.id;
    const {
      fullName, email, phoneNumber,
      bio, businessName, location, state, circle, subdivision,
      experienceYears, consultationFee, languages, gstNumber, licenseNumber,
      aadhaarNumber,
    } = req.body;

    try {
      const advisor = await prisma.advisor.findUnique({ where: { id } });
      if (!advisor) { res.status(404).json({ success: false, message: 'Advisor not found' }); return; }

      const advisorData: Record<string, any> = {};
      const userData: Record<string, any> = {};

      if (fullName       !== undefined) { advisorData.fullName       = fullName;       userData.fullName = fullName; }
      if (bio            !== undefined) advisorData.bio            = bio;
      if (businessName   !== undefined) advisorData.businessName   = businessName;
      if (location       !== undefined) advisorData.location       = location;
      if (state          !== undefined) advisorData.state          = state;
      if (circle         !== undefined) advisorData.circle         = circle;
      if (subdivision    !== undefined) advisorData.subdivision    = subdivision;
      if (experienceYears !== undefined) advisorData.experienceYears = Number(experienceYears);
      if (consultationFee !== undefined) advisorData.consultationFee = Number(consultationFee);
      if (languages      !== undefined) advisorData.languages      = languages;
      if (gstNumber      !== undefined) advisorData.gstNumber      = gstNumber || null;
      if (licenseNumber  !== undefined) advisorData.licenseNumber  = licenseNumber || null;

      if (email !== undefined && email.trim() !== advisor.email) {
        const normalised = email.trim().toLowerCase();
        const dup = await prisma.advisor.findFirst({ where: { email: normalised, id: { not: id } } });
        if (dup) { res.status(409).json({ success: false, message: 'Email already in use' }); return; }
        advisorData.email = normalised;
        userData.email    = normalised;
      }

      if (phoneNumber !== undefined && phoneNumber.trim() !== advisor.phoneNumber) {
        const digits = phoneNumber.replace(/\D/g, '');
        const dup = await prisma.advisor.findFirst({ where: { phoneNumber: digits, id: { not: id } } });
        if (dup) { res.status(409).json({ success: false, message: 'Phone number already in use' }); return; }
        advisorData.phoneNumber = digits;
        userData.phoneNumber    = digits;
      }

      if (aadhaarNumber !== undefined && aadhaarNumber.trim()) {
        const { validateAadhaar: va, maskAadhaar: ma, hashAadhaar: ha } = await import('../utils/aadhaar');
        const digits = aadhaarNumber.replace(/\D/g, '');
        if (!va(digits)) { res.status(400).json({ success: false, message: 'Invalid Aadhaar number' }); return; }
        advisorData.aadhaarLast4 = ma(digits);
        advisorData.aadhaarHash  = ha(digits);
      }

      if (Object.keys(advisorData).length === 0) {
        res.status(400).json({ success: false, message: 'No fields provided to update' }); return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.advisor.update({ where: { id }, data: advisorData });
        if (Object.keys(userData).length > 0) {
          await tx.user.updateMany({ where: { phoneNumber: advisor.phoneNumber }, data: userData });
        }
      });

      await logAuditEvent('ADMIN_DIRECT_EDIT', adminId,
        { advisorId: id, advisorName: advisor.fullName, fieldsChanged: Object.keys(advisorData) }, id, req);

      const updated = await prisma.advisor.findUnique({
        where: { id },
        include: { documents: true, assignedSubAdmin: { select: { id: true, fullName: true, email: true } } },
      });

      res.json({ success: true, message: 'Advisor details updated successfully.', data: updated });
    } catch (err) {
      console.error('[admin/advisors/:id/edit PATCH]', err);
      res.status(500).json({ success: false, message: 'Failed to update advisor details' });
    }
  }
);

export default router;
