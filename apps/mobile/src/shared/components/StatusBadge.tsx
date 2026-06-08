import React from 'react';
import { Badge } from './Badge';
import type { BadgeProps } from './Badge';
import { BookingStatus, VerificationStatus, TicketStatus, TransactionStatus } from '@brokersaab/shared-types';

type StatusInput =
  | BookingStatus
  | VerificationStatus
  | TicketStatus
  | TransactionStatus
  | string;

interface StatusBadgeProps {
  status: StatusInput;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; color: 'gold' | 'indigo' | 'emerald' | 'red' | 'slate' | 'amber' }> = {
  // Booking
  PENDING: { label: 'Pending', color: 'amber' },
  ACCEPTED: { label: 'Accepted', color: 'indigo' },
  COMPLETED: { label: 'Completed', color: 'emerald' },
  CANCELLED: { label: 'Cancelled', color: 'red' },
  DISPUTED: { label: 'Disputed', color: 'red' },
  // Verification
  UNDER_REVIEW: { label: 'Under Review', color: 'indigo' },
  SUBMITTED_FOR_APPROVAL: { label: 'Submitted', color: 'gold' },
  APPROVED: { label: 'Approved', color: 'emerald' },
  REJECTED: { label: 'Rejected', color: 'red' },
  SUSPENDED: { label: 'Suspended', color: 'red' },
  // Ticket
  OPEN: { label: 'Open', color: 'amber' },
  IN_PROGRESS: { label: 'In Progress', color: 'indigo' },
  RESOLVED: { label: 'Resolved', color: 'emerald' },
  CLOSED: { label: 'Closed', color: 'slate' },
  // Transaction
  SUCCESS: { label: 'Success', color: 'emerald' },
  FAILED: { label: 'Failed', color: 'red' },
  REFUNDED: { label: 'Refunded', color: 'indigo' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] ?? { label: status, color: 'slate' as const };
  return <Badge text={config.label} color={config.color} size={size} dot />;
};
