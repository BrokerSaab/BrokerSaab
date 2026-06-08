import {
  Role,
  VerificationStatus,
  ConsultationMode,
  BookingStatus,
  TransactionType,
  TransactionStatus,
  AdvisorType,
  DocumentType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from './enums';

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  seqId: number;
  phoneNumber: string;
  email: string | null;
  fullName: string | null;
  role: Role;
  avatarUrl: string | null;
  state: string | null;
  walletBalance?: string;
  createdAt: string;
}

// ─── Advisor ─────────────────────────────────────────────────────────────────

export interface AdvisorCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdvisorSpecialization {
  id: string;
  name: string;
  slug: string;
}

export interface AvailabilitySlot {
  id: string;
  advisorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  isAvailable?: boolean;
}

export interface AdvisorDocument {
  id: string;
  advisorId: string;
  documentType: DocumentType;
  documentUrl: string;
  verified: boolean;
  verifiedAt: string | null;
}

export interface AdvisorSummary {
  id: string;
  seqId: number;
  fullName: string;
  businessName: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  consultationFee: string;
  location: string;
  state: string | null;
  experienceYears: number;
  languages: string[];
  isAuthorizedDealer: boolean;
  advisorType: AdvisorType;
  verificationStatus: VerificationStatus;
  onboardingStep: number;
  categories: AdvisorCategory[];
  specializations: AdvisorSpecialization[];
  averageRating?: number;
  ratingsCount?: number;
}

export interface AdvisorDetail extends AdvisorSummary {
  email: string;
  phoneNumber: string;
  licenseNumber: string | null;
  gstNumber: string | null;
  circle: string | null;
  subdivision: string | null;
  latitude: number | null;
  longitude: number | null;
  aadhaarLast4: string | null;
  dealerAuthorizedAt: string | null;
  rejectionComment: string | null;
  assignedSubAdminId: string | null;
  documents: AdvisorDocument[];
  availabilitySlots: AvailabilitySlot[];
  createdAt: string;
  updatedAt: string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  advisorId: string;
  mode: ConsultationMode;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalFee: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client?: Pick<UserProfile, 'id' | 'fullName' | 'phoneNumber' | 'avatarUrl'>;
  advisor?: Pick<AdvisorSummary, 'id' | 'fullName' | 'businessName' | 'avatarUrl' | 'location'>;
  chatRoom?: { id: string };
  transaction?: BookingTransaction | null;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface BookingTransaction {
  id: string;
  referenceId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  commission: string;
  netAmount: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  referenceId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  gatewayMessage: string | null;
  createdAt: string;
}

// ─── Chat / Message ───────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: Pick<UserProfile, 'id' | 'fullName' | 'avatarUrl'>;
}

// ─── Support Ticket ───────────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  seqId: number;
  ticketNumber: string;
  userId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedToAdminId: string | null;
  closingNotes: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketActivity {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  performedByName: string;
  performedByRole: string;
  createdAt: string;
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export interface ContactUnlock {
  id: string;
  advisorId: string;
  advisor: Pick<AdvisorSummary, 'id' | 'fullName' | 'businessName' | 'avatarUrl'> & {
    email: string;
    phoneNumber: string;
  };
  isFree: boolean;
  createdAt: string;
}

export interface ContactSubscription {
  id: string;
  status: TransactionStatus;
  creditsTotal: number;
  creditsUsed: number;
  expiresAt: string | null;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  userId: string;
  balance: string;
  updatedAt: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface SubAdmin {
  id: string;
  seqId: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalAdvisors: number;
  pendingAdvisors: number;
  approvedAdvisors: number;
  totalClients: number;
  totalBookings: number;
  pendingTickets: number;
  revenue: number;
}

// ─── Onboarding Session ───────────────────────────────────────────────────────

export interface OnboardingSession {
  id: string;
  phoneNumber: string;
  currentStep: number;
  stepLabel: string;
  formSnapshot: Record<string, unknown> | null;
  advisorId: string | null;
  lastActiveAt: string;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface AdvisorSubscription {
  id: string;
  advisorId: string;
  status: TransactionStatus;
  amount: string;
  subscribedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}
