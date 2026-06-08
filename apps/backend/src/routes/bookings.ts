import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, BookingStatus, ConsultationMode } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

const createBookingSchema = z.object({
  body: z.object({
    advisorId: z.string().uuid(),
    slotId: z.string().uuid(),
    scheduledDate: z.string().datetime(), // ISO Date String
    mode: z.nativeEnum(ConsultationMode),
    notes: z.string().optional()
  })
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(BookingStatus)
  })
});

/**
 * 1. POST /bookings
 * Create consultation booking with strict double-booking protection via Prisma Transactions
 */
router.post(
  '/',
  authenticateJWT,
  validateRequest(createBookingSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const clientId = req.user!.id;
    const { advisorId, slotId, scheduledDate, mode, notes } = req.body;

    try {
      const parsedDate = new Date(scheduledDate);

      // Perform everything inside a transaction to prevent race conditions (double bookings)
      const booking = await prisma.$transaction(async (tx) => {
        // 1. Fetch Advisor details
        const advisor = await tx.advisor.findUnique({
          where: { id: advisorId }
        });

        if (!advisor) {
          throw new Error('Advisor profile not found');
        }

        if (advisor.verificationStatus !== 'APPROVED') {
          throw new Error('Advisor is not authorized/approved to receive bookings');
        }

        // 2. Lock & Verify Availability Slot
        const slot = await tx.availabilitySlot.findUnique({
          where: { id: slotId }
        });

        if (!slot || slot.advisorId !== advisorId) {
          throw new Error('Selected availability slot does not exist');
        }

        if (slot.isBooked) {
          throw new Error('This slot has already been booked by another client');
        }

        // 3. Prevent Client self-booking
        if (advisor.phoneNumber === req.user!.phoneNumber) {
          throw new Error('Self-consultation bookings are forbidden');
        }

        // 4. Update the slot status to Booked
        await tx.availabilitySlot.update({
          where: { id: slotId },
          data: { isBooked: true }
        });

        // 5. Generate descriptive unique booking number
        const bookingNumber = `BS-${parsedDate.getFullYear()}${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}${parsedDate.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 6. Create booking ledger with PENDING status
        const createdBooking = await tx.booking.create({
          data: {
            bookingNumber,
            clientId,
            advisorId,
            mode,
            scheduledDate: parsedDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: BookingStatus.PENDING,
            totalFee: advisor.consultationFee,
            notes
          }
        });

        // 7. Auto-initialize Socket.IO Chat Room
        const chatRoom = await tx.chatRoom.create({
          data: { bookingId: createdBooking.id }
        });

        // Register advisor User ID
        const advisorUser = await tx.user.findUnique({
          where: { phoneNumber: advisor.phoneNumber }
        });

        if (advisorUser) {
          await tx.chatRoomParticipant.createMany({
            data: [
              { chatRoomId: chatRoom.id, userId: clientId },
              { chatRoomId: chatRoom.id, userId: advisorUser.id }
            ]
          });
        }

        return createdBooking;
      });

      res.status(201).json({
        success: true,
        message: 'Booking created successfully. Pending payment.',
        data: booking
      });
    } catch (error: any) {
      console.error('Booking generation failed:', error.message);
      res.status(400).json({ success: false, message: error.message || 'Error occurred while scheduling booking' });
    }
  }
);

/**
 * 2. GET /bookings
 * Lists user previous and active sessions (scoping to logged user)
 */
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const role = req.user!.role;

  try {
    let bookings;

    if (role === Role.ADVISOR) {
      // Find advisor ID
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: user!.phoneNumber } });

      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor profile mapping not found' });
        return;
      }

      bookings = await prisma.booking.findMany({
        where: { advisorId: advisor.id },
        include: {
          client: { select: { id: true, fullName: true, phoneNumber: true, avatarUrl: true } },
          transaction: true,
          chatRoom: true
        },
        orderBy: { scheduledDate: 'desc' }
      });
    } else {
      // Client role
      bookings = await prisma.booking.findMany({
        where: { clientId: userId },
        include: {
          advisor: { select: { id: true, fullName: true, businessName: true, avatarUrl: true, location: true } },
          transaction: true,
          chatRoom: true
        },
        orderBy: { scheduledDate: 'desc' }
      });
    }

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving bookings ledger' });
  }
});

/**
 * 3. POST /bookings/:id/status
 * Updates status (Accept, Complete, Cancel, Disputed)
 */
router.post(
  '/:id/status',
  authenticateJWT,
  validateRequest(updateStatusSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;
    const role = req.user!.role;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { advisor: true }
      });

      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking record not found' });
        return;
      }

      // Authorization guard checks
      if (role === Role.ADVISOR) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (booking.advisor.phoneNumber !== user!.phoneNumber) {
          res.status(403).json({ success: false, message: 'Unauthorized. Booking belongs to another advisor.' });
          return;
        }
      } else if (role === Role.CLIENT) {
        if (booking.clientId !== userId) {
          res.status(403).json({ success: false, message: 'Unauthorized. Booking belongs to another client.' });
          return;
        }
        // Clients can only cancel pending bookings
        if (status === BookingStatus.CANCELLED && booking.status !== BookingStatus.PENDING) {
          res.status(400).json({ success: false, message: 'Cannot cancel an active or completed consultation.' });
          return;
        }
      }

      // Database transaction to resolve slots and release funds
      const updatedBooking = await prisma.$transaction(async (tx) => {
        const result = await tx.booking.update({
          where: { id },
          data: { status }
        });

        // Release slot if cancelled
        if (status === BookingStatus.CANCELLED) {
          await tx.availabilitySlot.updateMany({
            where: {
              advisorId: booking.advisorId,
              startTime: booking.startTime,
              endTime: booking.endTime
            },
            data: { isBooked: false }
          });

          // Process instant refund if transaction has occurred
          const transaction = await tx.transaction.findFirst({
            where: { bookingId: id, status: 'SUCCESS' }
          });

          if (transaction) {
            // Revert funds back to client wallet
            await tx.wallet.update({
              where: { userId: booking.clientId },
              data: { balance: { increment: transaction.amount } }
            });

            // Log refund transaction
            await tx.transaction.create({
              data: {
                referenceId: `REF-${transaction.referenceId}`,
                userId: booking.clientId,
                bookingId: id,
                type: 'CREDIT',
                status: 'REFUNDED',
                amount: transaction.amount,
                commission: 0,
                netAmount: transaction.amount,
                gatewayMessage: 'Instant booking cancellation refund.'
              }
            });
          }
        }

        // Release escrow payout to advisor's wallet if marked COMPLETED
        if (status === BookingStatus.COMPLETED) {
          const transaction = await tx.transaction.findFirst({
            where: { bookingId: id, status: 'SUCCESS' }
          });

          if (transaction) {
            // Find advisor Base User ID
            const advisorUser = await tx.user.findUnique({
              where: { phoneNumber: booking.advisor.phoneNumber }
            });

            if (advisorUser) {
              await tx.wallet.update({
                where: { userId: advisorUser.id },
                data: { balance: { increment: transaction.netAmount } }
              });

              // Register escrow payout transaction
              await tx.transaction.create({
                data: {
                  referenceId: `EARN-${transaction.referenceId}`,
                  userId: advisorUser.id,
                  bookingId: id,
                  type: 'CREDIT',
                  status: 'SUCCESS',
                  amount: transaction.netAmount,
                  commission: 0,
                  netAmount: transaction.netAmount,
                  gatewayMessage: 'Escrow earnings settlement released'
                }
              });
            }
          }
        }

        return result;
      });

      res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}`,
        data: updatedBooking
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Error updating status' });
    }
  }
);

/**
 * GET /bookings/:id
 * Single booking detail — used by mobile BookingDetailScreen
 */
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fullName: true, phoneNumber: true, avatarUrl: true } },
        advisor: { select: { id: true, fullName: true, businessName: true, avatarUrl: true, location: true } },
        transaction: true,
        chatRoom: true,
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Scope check: only the booking's client, advisor, or admins can view
    if (role === Role.CLIENT && booking.clientId !== userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (role === Role.ADVISOR) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: user!.phoneNumber } });
      if (!advisor || booking.advisorId !== advisor.id) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }
    }

    res.json({ success: true, data: booking });
  } catch {
    res.status(500).json({ success: false, message: 'Error retrieving booking' });
  }
});

export default router;
