/**
 * Shared fee-math and payout-release logic used by both the milestone
 * confirm-stage route and the ticket close route — keeps the fee tier
 * locked in once per ticket (at creation time) and reproduced consistently
 * across however many partial releases sum to the full base amount.
 */

import prisma from '../config/db';
import { initiatePayout, mapRzpStatus, PayoutRecipient } from './razorpayPayout';

export interface AdvisorShare {
  platformFee: number;
  gatewayFee:  number;
  advisorNet:  number;
}

/**
 * Applies the ticket's original platform-fee rate (locked in from the whole
 * base amount at ticket creation) to a partial slice of that base amount.
 * Gateway fee is always 1.5% of the slice. This guarantees that summing the
 * fees across every slice of a ticket reproduces exactly what a single
 * whole-ticket payout would have charged.
 */
export function computeAdvisorShare(
  ticket: { baseAmount: number; platformFee: number },
  partialAmount: number,
): AdvisorShare {
  if (partialAmount <= 0 || ticket.baseAmount <= 0) {
    return { platformFee: 0, gatewayFee: 0, advisorNet: Math.max(partialAmount, 0) };
  }
  const rate        = ticket.platformFee / ticket.baseAmount;
  const platformFee = Math.round(partialAmount * rate * 100) / 100;
  const gatewayFee  = Math.round(partialAmount * 0.015 * 100) / 100;
  const advisorNet  = Math.round((partialAmount - platformFee - gatewayFee) * 100) / 100;
  return { platformFee, gatewayFee, advisorNet };
}

export interface ReleasePayoutParams {
  advisorId:       string;
  ticketId:        string | null;
  stageId?:        string | null;
  grossAmount:     number;   // Payout.amount — the gross slice this payout covers
  netAmount:       number;   // Payout.netAmount — what's actually transferred to the advisor
  bankLabel:       string;
  hasBankDetails:  boolean;
  advisorFullName: string;
  advisorEmail:    string;
  advisorPhone:    string;
  advisorPushToken?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?:          string | null;
  bankAccountHolder?: string | null;
  razorpayContactId?:     string | null;
  razorpayFundAccountId?: string | null;
  notifyTitle:   string;
  notifySuccess: string;
  notifyPending: string;
}

export interface ReleasePayoutResult {
  payoutId: string;
  success:  boolean;
}

/**
 * Creates a Payout row for a slice of ticket money (a milestone release, or
 * the final remainder at ticket close) and attempts the RazorpayX transfer.
 * Does NOT touch TicketStage/FeeQuoteLineItem/ServiceTicket status — callers
 * own their own status transition, since it differs by caller.
 */
export async function releasePayout(params: ReleasePayoutParams): Promise<ReleasePayoutResult> {
  const payoutRecord = await prisma.payout.create({
    data: {
      advisorId:   params.advisorId,
      ticketId:    params.ticketId,
      stageId:     params.stageId ?? null,
      amount:      params.grossAmount,
      commission:  0,
      netAmount:   params.netAmount,
      status:      'PENDING',
      bankAccount: params.bankLabel,
      referenceId: `payout_${params.stageId ?? params.ticketId ?? Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    },
  });

  if (!params.hasBankDetails) {
    if (params.advisorPushToken) {
      const { sendPushNotification } = await import('../utils/pushNotification');
      sendPushNotification(params.advisorPushToken, params.notifyTitle, params.notifyPending, {
        ticketId: params.ticketId, screen: 'Wallet',
      });
    }
    return { payoutId: payoutRecord.id, success: false };
  }

  const recipient: PayoutRecipient = {
    recipientType:          'ADVISOR',
    recipientId:            params.advisorId,
    fullName:               params.advisorFullName,
    email:                  params.advisorEmail,
    phoneNumber:            params.advisorPhone,
    bankAccountNumber:      params.bankAccountNumber!,
    bankIfsc:               params.bankIfsc!,
    bankAccountHolder:      params.bankAccountHolder ?? params.advisorFullName,
    razorpayContactId:      params.razorpayContactId,
    razorpayFundAccountId:  params.razorpayFundAccountId,
  };

  const amountPaise = Math.round(params.netAmount * 100);
  const outcome = await initiatePayout(recipient, amountPaise, `payout_${payoutRecord.id}`);
  const payoutStatus = mapRzpStatus(outcome.rzpStatus);
  const now = new Date();

  await prisma.payout.update({
    where: { id: payoutRecord.id },
    data: {
      razorpayPayoutId: outcome.razorpayPayoutId,
      payoutMode:       outcome.mode ?? 'IMPS',
      status:           payoutStatus,
      ...(outcome.error ? { rejectionReason: outcome.error } : {}),
      ...(outcome.success ? { releasedAt: now } : {}),
    },
  });

  if (outcome.success) {
    await prisma.advisor.update({
      where: { id: params.advisorId },
      data:  { walletBalance: { increment: params.netAmount } },
    });
  }

  if (params.advisorPushToken) {
    const { sendPushNotification } = await import('../utils/pushNotification');
    sendPushNotification(
      params.advisorPushToken,
      outcome.success ? params.notifyTitle : 'Payout Pending',
      outcome.success ? params.notifySuccess : params.notifyPending,
      { ticketId: params.ticketId, screen: 'Wallet' },
    );
  }

  return { payoutId: payoutRecord.id, success: outcome.success };
}
