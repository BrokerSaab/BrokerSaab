'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, CheckCircle, XCircle, TrendingUp, AlertTriangle,
  ShieldCheck, BookOpen, Loader2, Calendar, Clock, RefreshCw, BadgeCheck,
  BarChart2, CreditCard, Download, ChevronDown, ChevronRight, MapPin, X,
  UserCheck, Award, Activity, Eye, MessageSquare, TicketCheck,
  UserPlus, Send, ClipboardCheck, Shield, Search, Lock
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

type AdminTab = 'overview' | 'advisors' | 'users' | 'funnel' | 'subscriptions' | 'contact-packs' | 'contact-unlocks' | 'bookings' | 'support' | 'sub-admins';
type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

const STATUS_BADGE: Record<BookingStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  ACCEPTED:  'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DISPUTED:  'bg-orange-100 text-orange-700',
};

const VSTATUS_BADGE: Record<string, string> = {
  PENDING:                  'bg-amber-100 text-amber-700',
  UNDER_REVIEW:             'bg-blue-100 text-blue-700',
  SUBMITTED_FOR_APPROVAL:   'bg-purple-100 text-purple-700',
  APPROVED:                 'bg-emerald-100 text-emerald-700',
  REJECTED:                 'bg-red-100 text-red-700',
  SUSPENDED:                'bg-orange-100 text-orange-700',
};

// ── Display ID helpers ──────────────────────────────────────────────────────
function genDisplayId(model: 'user' | 'advisor' | 'admin', seqId?: number): string {
  if (!seqId) return '—';
  const prefix = { user: 'BSU', advisor: 'BSA', admin: 'BSAD' }[model];
  return `${prefix}-${String(seqId).padStart(6, '0')}`;
}

interface Advisor {
  id: string; seqId?: number; fullName: string; email: string; phoneNumber: string;
  businessName?: string; licenseNumber?: string; gstNumber?: string;
  aadhaarLast4?: string; advisorType: string; verificationStatus: string;
  isAuthorizedDealer?: boolean; dealerAuthorizedAt?: string; avatarUrl?: string;
  experienceYears: number; location: string; state?: string;
  consultationFee: string; createdAt: string;
  rejectionComment?: string; subAdminNote?: string;
  assignedSubAdmin?: { id: string; fullName: string; email: string };
  documents?: { id: string; documentType: string; documentUrl: string; verified: boolean }[];
  subscriptions?: { status: string; expiresAt?: string; subscribedAt?: string }[];
}

interface SubAdminStats { assigned: number; underReview: number; submitted: number; processed: number; }
interface SubAdmin {
  id: string; seqId?: number; fullName: string; email: string; role: string; createdAt: string;
  stats: SubAdminStats;
}

interface User { id: string; seqId?: number; fullName?: string; email?: string; phoneNumber: string; state?: string; createdAt: string; _count?: { bookings: number }; }
interface Subscription { id: string; advisorId: string; razorpayOrderId: string; razorpayPaymentId?: string; amount: string; status: string; subscribedAt?: string; expiresAt?: string; advisor: { fullName: string; email: string; advisorType: string }; }
interface Booking { id: string; bookingNumber: string; scheduledDate: string; startTime: string; endTime: string; status: BookingStatus; totalFee: string; mode: string; client?: { fullName?: string; phoneNumber: string }; advisor?: { fullName: string }; }
interface FunnelStep { step: number; label: string; count: number; }
interface FunnelSessionSnapshot {
  advisorType?: string; fullName?: string; email?: string; state?: string;
  city?: string; businessName?: string; languages?: string[];
  selectedSlugs?: string[]; licenseNumber?: string; gstNumber?: string;
  experienceYears?: string; consultationFee?: string;
}
interface FunnelSession { id: string; phoneNumber: string; currentStep: number; stepLabel: string; lastActiveAt: string; advisorId?: string; formSnapshot?: FunnelSessionSnapshot; }
interface Metrics { totalClients: number; totalAdvisors: number; approvedAdvisors: number; authorizedAdvisors: number; regularAdvisors: number; pendingVerification: number; consultationsCompleted: number; grossRevenue: string; platformCommission: string; activeSubscriptions: number; subscriptionRevenue: string; abandonedFunnels: number; completedOnboardings: number; }

export default function AdminSuitePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminRole, setAdminRole] = useState<string>('SUPER_ADMIN');
  const [metrics, setMetrics] = useState<Metrics>({ totalClients: 0, totalAdvisors: 0, approvedAdvisors: 0, authorizedAdvisors: 0, regularAdvisors: 0, pendingVerification: 0, consultationsCompleted: 0, grossRevenue: '0', platformCommission: '0', activeSubscriptions: 0, subscriptionRevenue: '0', abandonedFunnels: 0, completedOnboardings: 0 });

  // Advisors tab
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorsLoading, setAdvisorsLoading] = useState(false);
  const [advisorStatusFilter, setAdvisorStatusFilter] = useState('ALL');
  const [advisorTypeFilter, setAdvisorTypeFilter] = useState('ALL');
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedAdv, setSelectedAdv] = useState<Advisor | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['Admin portal loaded.']);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  // Submit-for-approval modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [pendingSubmitId, setPendingSubmitId] = useState<string | null>(null);

  // Bulk assign
  const [selectedForAssign, setSelectedForAssign] = useState<Set<string>>(new Set());
  const [assignTargetSubAdminId, setAssignTargetSubAdminId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Sub-admins tab
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [subAdminsLoading, setSubAdminsLoading] = useState(false);
  const [newSubAdmin, setNewSubAdmin] = useState({ fullName: '', email: '', password: '' });
  const [creatingSubAdmin, setCreatingSubAdmin] = useState(false);
  const [subAdminFormError, setSubAdminFormError] = useState('');
  const [myStats, setMyStats] = useState<SubAdminStats | null>(null);

  // Users tab
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Funnel tab
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [funnelSessions, setFunnelSessions] = useState<FunnelSession[]>([]);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [expandedFunnelRow, setExpandedFunnelRow] = useState<string | null>(null);

  // Subscriptions tab
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subStatusFilter, setSubStatusFilter] = useState('ALL');

  // Contact Packs tab
  interface ContactSub { id: string; userId: string; razorpayOrderId: string; razorpayPaymentId?: string; amount: string; status: string; creditsTotal: number; creditsUsed: number; subscribedAt?: string; expiresAt?: string; user: { fullName?: string; email?: string; phoneNumber: string }; }
  const [contactSubs, setContactSubs]         = useState<ContactSub[]>([]);
  const [contactSubsLoading, setContactSubsLoading] = useState(false);
  const [contactSubStatusFilter, setContactSubStatusFilter] = useState('ALL');

  // Contact Unlocks tab
  interface ContactUnlockRecord {
    id: string; unlockedAt: string; isFree: boolean;
    user: { id: string; fullName?: string; phoneNumber: string; email?: string };
    advisor: { id: string; fullName: string; businessName?: string; phoneNumber: string; email?: string; location: string; state?: string; categories: string[] };
  }
  const [contactUnlocks, setContactUnlocks]         = useState<ContactUnlockRecord[]>([]);
  const [contactUnlocksLoading, setContactUnlocksLoading] = useState(false);
  const [contactUnlocksSearch, setContactUnlocksSearch]   = useState('');
  const [contactUnlocksTotal, setContactUnlocksTotal]     = useState(0);

  // Bookings tab
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | 'ALL'>('ALL');

  // Support tickets tab
  interface TicketActivityItem { action: string; fromStatus?: string; toStatus?: string; note?: string; performedByName: string; performedByRole: string; createdAt: string; }
  interface SupportTicket {
    id: string; ticketNumber: string; subject: string; description: string;
    category: string; priority: string; status: string; closingNotes?: string;
    resolvedAt?: string; closedAt?: string;
    user: { fullName?: string; phoneNumber: string; email?: string; role?: string };
    assignedToAdmin?: { id: string; fullName: string };
    activities: TicketActivityItem[];
    createdAt: string;
  }
  const [tickets, setTickets]                   = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading]     = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket]     = useState<SupportTicket | null>(null);
  const [ticketTotal, setTicketTotal]           = useState(0);
  const [openTicketCount, setOpenTicketCount]   = useState(0);
  // Closing modal
  const [closingModal, setClosingModal]         = useState(false);
  const [closingNoteText, setClosingNoteText]   = useState('');
  const [closingTicketId, setClosingTicketId]   = useState<string|null>(null);
  const [closingSubmitting, setClosingSubmitting] = useState(false);
  // Sub-admin assignment
  const [ticketSubAdmins, setTicketSubAdmins]   = useState<{id:string;fullName:string}[]>([]);
  const [assigningTicket, setAssigningTicket]   = useState<string|null>(null);
  const [assignTargetId, setAssignTargetId]     = useState('');

  const token = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') || '' : '');

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u?.role) setAdminRole(u.role);
      } catch { /* keep default */ }
    }
  }, []);

  const isSuperAdmin = adminRole === 'SUPER_ADMIN';

  const fetchDashboard = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setMetrics(d.metrics);
    } catch { /* keep defaults */ }
  }, []);

  const fetchAdvisors = useCallback(async () => {
    setAdvisorsLoading(true);
    try {
      // Sub-admins always see their assigned queue
      if (!isSuperAdmin) {
        const r = await fetch(`${API}/admin/advisors/my-queue`, { headers: { Authorization: `Bearer ${token()}` } });
        const d = await r.json();
        if (d.success) { setAdvisors(d.data); setSelectedAdv(d.data[0] ?? null); }
        return;
      }
      const params = new URLSearchParams({ limit: '50' });
      if (advisorStatusFilter !== 'ALL') params.set('status', advisorStatusFilter);
      if (advisorTypeFilter !== 'ALL') params.set('type', advisorTypeFilter);
      if (advisorSearch.trim()) params.set('search', advisorSearch.trim());
      const r = await fetch(`${API}/admin/advisors?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) { setAdvisors(d.data); setSelectedAdv(d.data[0] ?? null); }
    } catch { /* empty */ } finally { setAdvisorsLoading(false); }
  }, [advisorStatusFilter, advisorTypeFilter, advisorSearch, isSuperAdmin]);

  const fetchSubAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    setSubAdminsLoading(true);
    try {
      const r = await fetch(`${API}/admin/sub-admins`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setSubAdmins(d.data);
    } catch { /* empty */ } finally { setSubAdminsLoading(false); }
  }, [isSuperAdmin]);

  const fetchMyStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/my-stats`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setMyStats(d.data);
    } catch { /* empty */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (userSearch.trim()) params.set('search', userSearch.trim());
      const r = await fetch(`${API}/admin/users?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setUsers(d.data);
    } catch { /* empty */ } finally { setUsersLoading(false); }
  }, [userSearch]);

  const fetchFunnel = useCallback(async () => {
    setFunnelLoading(true);
    try {
      const r = await fetch(`${API}/admin/funnel`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) { setFunnelSteps(d.funnel); setFunnelSessions(d.sessions); }
    } catch { /* empty */ } finally { setFunnelLoading(false); }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setSubLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (subStatusFilter !== 'ALL') params.set('status', subStatusFilter);
      const r = await fetch(`${API}/admin/subscriptions?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setSubscriptions(d.data);
    } catch { /* empty */ } finally { setSubLoading(false); }
  }, [subStatusFilter]);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const r = await fetch(`${API}/admin/bookings`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setAllBookings(d.data);
    } catch { /* empty */ } finally { setBookingsLoading(false); }
  }, []);

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (ticketStatusFilter !== 'ALL') params.set('status', ticketStatusFilter);
      const r = await fetch(`${API}/admin/tickets?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) {
        setTickets(d.tickets);
        setTicketTotal(d.total);
        setSelectedTicket(prev => prev ? (d.tickets.find((t: SupportTicket) => t.id === prev.id) ?? prev) : null);
      }
    } catch { /* empty */ } finally { setTicketsLoading(false); }
  }, [ticketStatusFilter]);

  const fetchTicketSubAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const r = await fetch(`${API}/admin/sub-admins/list`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setTicketSubAdmins(d.data);
    } catch { /* ignore */ }
  }, [isSuperAdmin]);

  const assignTicket = useCallback(async (ticketId: string, adminId: string) => {
    if (!adminId) return;
    setAssigningTicket(ticketId);
    try {
      const r = await fetch(`${API}/admin/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ adminId }),
      });
      const d = await r.json();
      if (d.success) {
        setTickets(prev => prev.map(t => t.id === ticketId ? d.ticket : t));
        setSelectedTicket(prev => prev?.id === ticketId ? d.ticket : prev);
        setAssignTargetId('');
      }
    } catch { /* ignore */ } finally { setAssigningTicket(null); }
  }, []);

  const openClosingModal = (ticketId: string) => {
    setClosingTicketId(ticketId);
    setClosingNoteText('');
    setClosingModal(true);
  };

  const confirmCloseTicket = useCallback(async () => {
    if (!closingTicketId || !closingNoteText.trim()) return;
    setClosingSubmitting(true);
    try {
      const r = await fetch(`${API}/admin/tickets/${closingTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: 'CLOSED', closingNotes: closingNoteText.trim() }),
      });
      const d = await r.json();
      if (d.success) {
        setTickets(prev => prev.map(t => t.id === closingTicketId ? d.ticket : t));
        setSelectedTicket(prev => prev?.id === closingTicketId ? d.ticket : prev);
        setOpenTicketCount(c => Math.max(0, c - 1));
        setClosingModal(false);
      }
    } catch { /* ignore */ } finally { setClosingSubmitting(false); }
  }, [closingTicketId, closingNoteText]);

  const fetchContactSubs = useCallback(async () => {
    setContactSubsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (contactSubStatusFilter !== 'ALL') params.set('status', contactSubStatusFilter);
      const r = await fetch(`${API}/admin/contact-subscriptions?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setContactSubs(d.data);
    } catch { /* empty */ } finally { setContactSubsLoading(false); }
  }, [contactSubStatusFilter]);

  const fetchContactUnlocks = useCallback(async () => {
    setContactUnlocksLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (contactUnlocksSearch.trim()) params.set('search', contactUnlocksSearch.trim());
      const r = await fetch(`${API}/admin/contact-unlocks?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) { setContactUnlocks(d.data); setContactUnlocksTotal(d.total); }
    } catch { /* empty */ } finally { setContactUnlocksLoading(false); }
  }, [contactUnlocksSearch]);

  const updateTicketStatus = useCallback(async (id: string, status: string) => {
    if (status === 'CLOSED') { openClosingModal(id); return; }
    try {
      const r = await fetch(`${API}/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (d.success) {
        setTickets(prev => prev.map(t => t.id === id ? d.ticket : t));
        setSelectedTicket(prev => (prev?.id === id ? d.ticket : prev));
        setLogs(prev => [`Ticket ${id.slice(-6).toUpperCase()} → ${status}`, ...prev]);
        if (status !== 'OPEN') setOpenTicketCount(c => Math.max(0, c - 1));
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchDashboard(); fetchMyStats(); }, [fetchDashboard, fetchMyStats]);
  useEffect(() => { if (activeTab === 'advisors') fetchAdvisors(); }, [activeTab, fetchAdvisors]);
  useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [activeTab, fetchUsers]);
  useEffect(() => { if (activeTab === 'funnel') fetchFunnel(); }, [activeTab, fetchFunnel]);
  useEffect(() => { if (activeTab === 'subscriptions') fetchSubscriptions(); }, [activeTab, fetchSubscriptions]);
  useEffect(() => { if (activeTab === 'contact-packs') fetchContactSubs(); }, [activeTab, fetchContactSubs]);
  useEffect(() => { if (activeTab === 'contact-unlocks') fetchContactUnlocks(); }, [activeTab, fetchContactUnlocks]);
  useEffect(() => { if (activeTab === 'bookings') fetchBookings(); }, [activeTab, fetchBookings]);
  useEffect(() => { if (activeTab === 'support') { fetchTickets(); fetchTicketSubAdmins(); } }, [activeTab, fetchTickets, fetchTicketSubAdmins]);
  useEffect(() => { if (activeTab === 'sub-admins') fetchSubAdmins(); }, [activeTab, fetchSubAdmins]);
  useEffect(() => {
    fetch(`${API}/admin/tickets?status=OPEN&limit=0`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(d => { if (d.success) setOpenTicketCount(d.total); }).catch(() => {});
  }, []);

  // Re-fetch sub-admins so the assign dropdown stays current when entering advisors tab
  useEffect(() => { if (activeTab === 'advisors' && isSuperAdmin) fetchSubAdmins(); }, [activeTab, isSuperAdmin, fetchSubAdmins]);

  // ── Rejection flow ───────────────────────────────────────────────
  const openRejectModal = (id: string) => {
    setPendingRejectId(id);
    setRejectComment('');
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!pendingRejectId || rejectComment.trim().length < 5) return;
    setVerifying(pendingRejectId + 'REJECT');
    try {
      const res = await fetch(`${API}/admin/advisors/${pendingRejectId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: 'REJECTED', reason: rejectComment.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        const adv = advisors.find(a => a.id === pendingRejectId);
        if (adv) setLogs(prev => [`Advisor ${adv.fullName} REJECTED: "${rejectComment.trim()}"`, ...prev]);
        setAdvisors(prev => prev.map(a => a.id === pendingRejectId ? { ...a, verificationStatus: 'REJECTED', rejectionComment: rejectComment.trim() } : a));
        if (selectedAdv?.id === pendingRejectId) setSelectedAdv(prev => prev ? { ...prev, verificationStatus: 'REJECTED', rejectionComment: rejectComment.trim() } : prev);
        fetchDashboard();
      }
    } catch { /* keep */ } finally {
      setVerifying(null);
      setRejectModalOpen(false);
      setPendingRejectId(null);
    }
  };

  // ── Approve flow ─────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setVerifying(id + 'APPROVE');
    try {
      await fetch(`${API}/admin/advisors/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const adv = advisors.find(a => a.id === id);
      if (adv) setLogs(prev => [`Advisor ${adv.fullName} APPROVED.`, ...prev]);
      setAdvisors(prev => prev.map(a => a.id === id ? { ...a, verificationStatus: 'APPROVED' } : a));
      if (selectedAdv?.id === id) setSelectedAdv(prev => prev ? { ...prev, verificationStatus: 'APPROVED' } : prev);
      fetchDashboard();
    } catch { /* keep */ } finally { setVerifying(null); }
  };

  // ── Submit for approval flow (SUB_ADMIN) ──────────────────────────
  const openSubmitModal = (id: string) => {
    setPendingSubmitId(id);
    setSubmitNote('');
    setSubmitModalOpen(true);
  };

  const confirmSubmit = async () => {
    if (!pendingSubmitId) return;
    setVerifying(pendingSubmitId + 'SUBMIT');
    try {
      const res = await fetch(`${API}/admin/advisors/${pendingSubmitId}/submit-for-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ note: submitNote.trim() || undefined }),
      });
      const d = await res.json();
      if (d.success) {
        const adv = advisors.find(a => a.id === pendingSubmitId);
        if (adv) setLogs(prev => [`Advisor ${adv.fullName} submitted for approval.`, ...prev]);
        setAdvisors(prev => prev.filter(a => a.id !== pendingSubmitId));
        if (selectedAdv?.id === pendingSubmitId) setSelectedAdv(null);
      }
    } catch { /* keep */ } finally {
      setVerifying(null);
      setSubmitModalOpen(false);
      setPendingSubmitId(null);
    }
  };

  // ── Dealer toggle ────────────────────────────────────────────────
  const handleDealerToggle = async (id: string, action: 'GRANT' | 'REVOKE') => {
    setVerifying(id + 'DEALER');
    try {
      await fetch(`${API}/admin/advisors/${id}/dealer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ action }),
      });
      const adv = advisors.find(a => a.id === id);
      if (adv) setLogs(prev => [`Dealer ${action}ED for ${adv.fullName}.`, ...prev]);
      setAdvisors(prev => prev.map(a => a.id === id ? { ...a, isAuthorizedDealer: action === 'GRANT' } : a));
      if (selectedAdv?.id === id) setSelectedAdv(prev => prev ? { ...prev, isAuthorizedDealer: action === 'GRANT' } : prev);
    } catch { /* keep */ } finally { setVerifying(null); }
  };

  // ── Document verify toggle ────────────────────────────────────────
  const toggleDocVerified = async (advisorId: string, docId: string, verified: boolean) => {
    try {
      const res = await fetch(`${API}/admin/advisors/${advisorId}/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ verified }),
      });
      const d = await res.json();
      if (d.success) {
        setAdvisors(prev => prev.map(a => a.id === advisorId
          ? { ...a, documents: a.documents?.map(doc => doc.id === docId ? { ...doc, verified } : doc) }
          : a
        ));
        if (selectedAdv?.id === advisorId) {
          setSelectedAdv(prev => prev ? { ...prev, documents: prev.documents?.map(doc => doc.id === docId ? { ...doc, verified } : doc) } : prev);
        }
      }
    } catch { /* ignore */ }
  };

  // ── Bulk assign ───────────────────────────────────────────────────
  const toggleSelectAdvisor = (id: string) => {
    setSelectedForAssign(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (!assignTargetSubAdminId || selectedForAssign.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/admin/advisors/assign-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ advisorIds: Array.from(selectedForAssign), subAdminId: assignTargetSubAdminId }),
      });
      const d = await res.json();
      if (d.success) {
        const sa = subAdmins.find(s => s.id === assignTargetSubAdminId);
        setLogs(prev => [`${d.count} advisor(s) assigned to ${sa?.fullName || 'sub-admin'}.`, ...prev]);
        setSelectedForAssign(new Set());
        setAssignTargetSubAdminId('');
        fetchAdvisors();
      }
    } catch { /* keep */ } finally { setAssigning(false); }
  };

  // ── Create sub-admin ──────────────────────────────────────────────
  const handleCreateSubAdmin = async () => {
    setSubAdminFormError('');
    if (!newSubAdmin.fullName.trim() || !newSubAdmin.email.trim() || newSubAdmin.password.length < 8) {
      setSubAdminFormError('All fields are required. Password must be at least 8 characters.');
      return;
    }
    setCreatingSubAdmin(true);
    try {
      const res = await fetch(`${API}/admin/sub-admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(newSubAdmin),
      });
      const d = await res.json();
      if (d.success) {
        setNewSubAdmin({ fullName: '', email: '', password: '' });
        fetchSubAdmins();
        setLogs(prev => [`Sub-admin ${newSubAdmin.fullName} created.`, ...prev]);
      } else {
        setSubAdminFormError(d.message || 'Failed to create sub-admin');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error — check your connection or API URL';
      setSubAdminFormError(msg);
    } finally { setCreatingSubAdmin(false); }
  };

  const handleDeleteSubAdmin = async (id: string, name: string) => {
    if (!confirm(`Remove sub-admin ${name}? Their unreviewed advisors will return to PENDING.`)) return;
    try {
      await fetch(`${API}/admin/sub-admins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      setSubAdmins(prev => prev.filter(s => s.id !== id));
      setLogs(prev => [`Sub-admin ${name} removed.`, ...prev]);
    } catch { /* ignore */ }
  };

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  const getAdvisorAvatar = (adv: Advisor): string | null => {
    if (adv.avatarUrl) return adv.avatarUrl.startsWith('http') ? adv.avatarUrl : `${BASE_URL}${adv.avatarUrl}`;
    const photo = adv.documents?.find(d => d.documentType === 'PASSPORT_PHOTO');
    return photo ? `${BASE_URL}${photo.documentUrl}` : null;
  };

  const getDocUrl = (docUrl: string) => `${BASE_URL}${docUrl}`;

  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (entity: string) => {
    setExporting(entity);
    try {
      const res = await fetch(`${API}/admin/export/${entity}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) { alert('Export failed — please try again.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brokersaab-${entity}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Export failed — network error.'); }
    finally { setExporting(null); }
  };

  const BASE_TABS: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'advisors', label: 'Advisors', icon: Users },
    { key: 'users', label: 'Users', icon: UserCheck },
    { key: 'funnel', label: 'Onboarding Funnel', icon: Activity },
    { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { key: 'contact-packs', label: 'Contact Packs', icon: Eye },
    { key: 'contact-unlocks', label: 'Contact Unlocks', icon: UserCheck },
    { key: 'bookings', label: 'Bookings', icon: BookOpen },
    { key: 'support', label: openTicketCount > 0 ? `Support (${openTicketCount})` : 'Support', icon: MessageSquare },
  ];

  const TABS = isSuperAdmin
    ? [...BASE_TABS, { key: 'sub-admins' as AdminTab, label: 'Sub-Admins', icon: Shield }]
    : BASE_TABS;

  const showBulkAssignBar = isSuperAdmin && selectedForAssign.size > 0;

  const getDocDownloadUrl = (docUrl: string) =>
    `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${docUrl}`;

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          Admin Operations Suite
          <span className={`text-xs border font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${isSuperAdmin ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
            {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}
          </span>
        </h1>
        <p className="text-slate-500 text-xs mt-1">Manage advisors, users, onboarding funnel, subscriptions, and bookings.</p>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 flex gap-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-xl transition-all ${activeTab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Advisors', value: metrics.totalAdvisors, sub: `${metrics.regularAdvisors} Regular / ${metrics.authorizedAdvisors} Authorized`, icon: Users, color: 'border-l-blue-500', onClick: () => setActiveTab('advisors') },
              { label: 'Approved Advisors', value: metrics.approvedAdvisors, sub: 'Live on the platform', icon: CheckCircle, color: 'border-l-emerald-500', onClick: () => { setAdvisorStatusFilter('APPROVED'); setActiveTab('advisors'); } },
              { label: 'Pending Approval', value: metrics.pendingVerification, sub: 'KYC awaiting review', icon: AlertTriangle, color: 'border-l-amber-500', pulse: true, onClick: () => { setAdvisorStatusFilter('PENDING'); setActiveTab('advisors'); } },
              { label: 'Total Clients', value: metrics.totalClients, sub: 'Registered users', icon: UserCheck, color: 'border-l-teal-500', onClick: () => setActiveTab('users') },
              { label: 'Paid Subscriptions', value: metrics.activeSubscriptions, sub: 'Active authorized badges', icon: CreditCard, color: 'border-l-gold-500', onClick: () => setActiveTab('subscriptions') },
              { label: 'Gross Revenue', value: `₹${parseFloat(metrics.grossRevenue || '0').toLocaleString('en-IN')}`, sub: 'Total booking turnover', icon: TrendingUp, color: 'border-l-gold-500', onClick: () => setActiveTab('bookings') },
              { label: 'Abandoned Funnels', value: metrics.abandonedFunnels, sub: 'Started but not submitted', icon: XCircle, color: 'border-l-red-500', onClick: () => setActiveTab('funnel') },
              { label: 'Completed Onboardings', value: metrics.completedOnboardings, sub: 'Fully submitted via wizard', icon: CheckCircle, color: 'border-l-indigo-500', onClick: () => setActiveTab('funnel') },
            ].map((w, i) => (
              <button key={i} onClick={w.onClick}
                className={`bg-white rounded-xl p-4 border-l-4 ${w.color} shadow-sm border border-slate-100 space-y-1 text-left w-full hover:shadow-md hover:-translate-y-0.5 transition-all group`}>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[10px] uppercase font-semibold group-hover:text-indigo-600 transition-colors">{w.label}</span>
                  <w.icon size={14} className={`text-indigo-400 ${(w as any).pulse ? 'animate-pulse' : ''}`} />
                </div>
                <p className="text-xl font-black text-slate-800">{w.value}</p>
                <span className="text-[10px] text-slate-400">{w.sub} <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">→ view</span></span>
              </button>
            ))}
          </div>
          {/* Sub-admin personal stats (shown when logged in as sub-admin) */}
          {!isSuperAdmin && myStats && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <ClipboardCheck size={13} className="text-indigo-500" /> My Work Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Assigned', value: myStats.assigned, color: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', desc: 'advisors assigned to you' },
                  { label: 'Under Review', value: myStats.underReview, color: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', desc: 'actively being reviewed' },
                  { label: 'Submitted', value: myStats.submitted, color: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', desc: 'awaiting super admin' },
                  { label: 'Processed', value: myStats.processed, color: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', desc: 'approved or rejected' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-xl p-4 border-l-4 ${s.color}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${s.text} mb-1`}>{s.label}</p>
                    <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-800">Advisor Category Repair</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Auto-assigns service categories to approved advisors who have none. Run this once after deployment.</p>
              </div>
              <button
                onClick={async () => {
                  const r = await fetch(`${API}/admin/repair-categories`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
                  const d = await r.json();
                  if (d.success) setLogs(p => [`[Repair] Fixed ${d.totalFixed}/${d.total} advisors — ${(d.details||[]).join(' | ')}`, ...p]);
                  else setLogs(p => [`[Repair] Failed: ${d.message}`, ...p]);
                }}
                className="shrink-0 text-[10px] font-bold text-white bg-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw size={11} /> Run Repair
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest pb-3 border-b border-slate-100 mb-3">Audit Log</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[10px] text-slate-400">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gold-500/50 shrink-0">[{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ADVISORS ── */}
      {activeTab === 'advisors' && (
        <div className="space-y-4">
          {/* Filters — SUPER_ADMIN only */}
          {isSuperAdmin && (
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'PENDING', 'UNDER_REVIEW', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(s => (
                  <button key={s} onClick={() => { setAdvisorStatusFilter(s); setSelectedForAssign(new Set()); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      advisorStatusFilter === s
                        ? s === 'SUBMITTED_FOR_APPROVAL' ? 'bg-purple-600 text-white border-purple-600'
                        : s === 'UNDER_REVIEW' ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gold-500 text-navy-800 border-gold-500'
                      : 'text-slate-500 border-slate-200 bg-white hover:border-indigo-300'
                    }`}>
                    {s === 'ALL' ? 'All Status' : s.replace(/_/g, ' ')}
                  </button>
                ))}
                {['ALL', 'REGULAR', 'AUTHORIZED'].map(t => (
                  <button key={t} onClick={() => setAdvisorTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${advisorTypeFilter === t ? 'bg-blue-600 text-white border-blue-500' : 'text-slate-500 border-slate-200 bg-white hover:border-indigo-300'}`}>
                    {t === 'ALL' ? 'All Types' : t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={fetchAdvisors} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors"><RefreshCw size={13} /> Refresh</button>
                <button onClick={() => handleExport('advisors')} disabled={exporting === 'advisors'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50">
                  {exporting === 'advisors' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export Excel
                </button>
              </div>
            </div>
          )}

          {/* Search bar — visible for both roles */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, phone or BSA-000001…"
              value={advisorSearch}
              onChange={e => setAdvisorSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchAdvisors()}
              className="flex-1 text-xs outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
            />
            {advisorSearch && (
              <button onClick={() => { setAdvisorSearch(''); }} className="text-slate-300 hover:text-slate-500 text-xs">✕</button>
            )}
            <button onClick={fetchAdvisors} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all">Search</button>
          </div>

          {!isSuperAdmin && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Your Review Queue ({advisors.length} advisors)</p>
              <button onClick={fetchAdvisors} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"><RefreshCw size={13} /> Refresh</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-3 overflow-y-auto" style={{ maxHeight: 520 }}>
              {advisorsLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 size={18} className="animate-spin mr-2" /> Loading…</div>
              ) : advisors.length === 0 ? (
                <div className="text-center py-10"><CheckCircle className="mx-auto text-gold-500/30 mb-2" size={32} /><p className="text-xs text-slate-400">No advisors found.</p></div>
              ) : advisors.map(adv => (
                <div key={adv.id} className="relative">
                  {isSuperAdmin && (advisorStatusFilter === 'PENDING' || advisorStatusFilter === 'ALL') && (
                    <input
                      type="checkbox"
                      checked={selectedForAssign.has(adv.id)}
                      onChange={() => toggleSelectAdvisor(adv.id)}
                      className="absolute top-3 left-3 z-10 w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                  <button onClick={() => setSelectedAdv(adv)}
                    className={`w-full text-left p-3 ${isSuperAdmin && (advisorStatusFilter === 'PENDING' || advisorStatusFilter === 'ALL') ? 'pl-8' : ''} rounded-xl border text-xs space-y-1.5 transition-all ${selectedAdv?.id === adv.id ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200'}`}>
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-100">
                        {getAdvisorAvatar(adv)
                          ? <img src={getAdvisorAvatar(adv)!} alt={adv.fullName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">{adv.fullName[0]?.toUpperCase()}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold truncate text-[12px]">{adv.fullName}</span>
                            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded shrink-0">{genDisplayId('advisor', adv.seqId)}</span>
                          </div>
                          <div className="flex gap-1 items-center shrink-0 ml-1">
                            {adv.isAuthorizedDealer && <BadgeCheck size={11} className="text-amber-400" />}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${VSTATUS_BADGE[adv.verificationStatus] || 'bg-slate-500/10 text-slate-400'}`}>{adv.verificationStatus.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                          <span>{adv.advisorType}</span><span>{adv.state || adv.location}</span>
                        </div>
                      </div>
                    </div>
                    {adv.assignedSubAdmin && <p className="text-[9px] text-blue-500">Assigned: {adv.assignedSubAdmin.fullName}</p>}
                  </button>
                </div>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2 space-y-4">
              {selectedAdv ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start border-b border-gold-500/10 pb-4 gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      {/* Profile photo */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border-2 border-slate-200">
                        {getAdvisorAvatar(selectedAdv)
                          ? <img src={getAdvisorAvatar(selectedAdv)!} alt={selectedAdv.fullName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = ''; }} />
                          : <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-400">{selectedAdv.fullName[0]?.toUpperCase()}</div>
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-800">{selectedAdv.fullName}</h3>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">{genDisplayId('advisor', selectedAdv.seqId)}</span>
                        </div>
                        <p className="text-xs text-slate-400">{selectedAdv.location} · {selectedAdv.experienceYears}y exp · ₹{selectedAdv.consultationFee}/session</p>
                        <p className="text-[11px] text-slate-500 font-mono">{selectedAdv.email} · {selectedAdv.phoneNumber}</p>
                        {selectedAdv.aadhaarLast4 && <p className="text-[11px] text-slate-500">Aadhaar: ****{selectedAdv.aadhaarLast4}</p>}
                        {selectedAdv.licenseNumber && <p className="text-[11px] text-slate-500">License: {selectedAdv.licenseNumber}</p>}
                        {selectedAdv.gstNumber && <p className="text-[11px] text-slate-500">GST: {selectedAdv.gstNumber}</p>}
                        {selectedAdv.assignedSubAdmin && (
                          <p className="text-[11px] text-blue-600 font-semibold mt-1">Reviewer: {selectedAdv.assignedSubAdmin.fullName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* SUPER_ADMIN action buttons */}
                      {isSuperAdmin && (
                        <>
                          <button onClick={() => handleApprove(selectedAdv.id)} disabled={!!verifying}
                            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60">
                            {verifying === selectedAdv.id + 'APPROVE' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                          </button>
                          <button onClick={() => openRejectModal(selectedAdv.id)} disabled={!!verifying}
                            className="px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60">
                            {verifying === selectedAdv.id + 'REJECT' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Reject
                          </button>
                          <button onClick={() => handleDealerToggle(selectedAdv.id, selectedAdv.isAuthorizedDealer ? 'REVOKE' : 'GRANT')} disabled={!!verifying}
                            className={`px-3 py-2 font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60 ${selectedAdv.isAuthorizedDealer ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-gradient-to-r from-amber-600 to-yellow-400 text-slate-950'}`}>
                            {verifying === selectedAdv.id + 'DEALER' ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />}
                            {selectedAdv.isAuthorizedDealer ? 'Revoke Dealer' : 'Grant Dealer'}
                          </button>
                        </>
                      )}

                      {/* SUB_ADMIN action buttons */}
                      {!isSuperAdmin && (
                        <>
                          <button onClick={() => openSubmitModal(selectedAdv.id)} disabled={!!verifying}
                            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60">
                            {verifying === selectedAdv.id + 'SUBMIT' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit for Approval
                          </button>
                          <button onClick={() => openRejectModal(selectedAdv.id)} disabled={!!verifying}
                            className="px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60">
                            {verifying === selectedAdv.id + 'REJECT' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sub-admin note (visible to super admin) */}
                  {isSuperAdmin && selectedAdv.subAdminNote && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1"><ClipboardCheck size={12} /> Reviewer Note</p>
                      <p className="text-xs text-purple-800">{selectedAdv.subAdminNote}</p>
                    </div>
                  )}

                  {/* Rejection comment */}
                  {selectedAdv.rejectionComment && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
                      <p className="text-xs text-red-800">{selectedAdv.rejectionComment}</p>
                    </div>
                  )}

                  {/* KYC Documents — always shown */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText size={13} className="text-gold-500" /> KYC Documents
                      </p>
                      <span className="text-[10px] text-slate-400">{selectedAdv.documents?.length ?? 0} file{(selectedAdv.documents?.length ?? 0) !== 1 ? 's' : ''}</span>
                    </div>
                    {(!selectedAdv.documents || selectedAdv.documents.length === 0) ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        <FileText size={22} className="mx-auto text-slate-200 mb-1" />
                        No documents uploaded yet
                      </div>
                    ) : (
                      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedAdv.documents.map(doc => {
                          const fileUrl = getDocUrl(doc.documentUrl);
                          const filename = doc.documentType.toLowerCase().replace(/_/g, '-') + doc.documentUrl.slice(doc.documentUrl.lastIndexOf('.'));
                          return (
                            <div key={doc.id} className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                              <div className="flex items-center justify-between">
                                <FileText size={16} className="text-gold-400" />
                                <label className="flex items-center gap-1 cursor-pointer" title="Mark as verified">
                                  <input type="checkbox" checked={doc.verified}
                                    onChange={e => toggleDocVerified(selectedAdv.id, doc.id, e.target.checked)}
                                    className="w-3 h-3 accent-emerald-600" />
                                  <span className="text-[9px] text-slate-400">Verified</span>
                                </label>
                              </div>
                              <span className="text-[10px] text-slate-600 font-medium leading-tight">{doc.documentType.replace(/_/g, ' ')}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded text-center font-semibold ${doc.verified ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                {doc.verified ? '✓ Verified' : '⏳ Pending'}
                              </span>
                              <div className="flex gap-1">
                                <a href={fileUrl} target="_blank" rel="noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1 text-[9px] font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 border border-indigo-200 rounded py-1 transition-all">
                                  <Eye size={9} /> View
                                </a>
                                <a href={fileUrl} download={filename}
                                  className="flex-1 flex items-center justify-center gap-1 text-[9px] font-semibold text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 border border-emerald-200 rounded py-1 transition-all">
                                  <Download size={9} /> Download
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-16 text-center text-slate-400 text-sm">
                  <Users className="mx-auto text-gold-500/20 mb-3" size={40} /> Select an advisor to view details.
                </div>
              )}

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest pb-2 border-b border-gold-500/10">Audit Log</h4>
                <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-[10px] text-slate-400">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gold-500/50 shrink-0">[{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Assign Bar */}
          {showBulkAssignBar && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-700 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 z-50 border border-indigo-500">
              <span className="text-sm font-semibold">{selectedForAssign.size} selected</span>
              <select
                value={assignTargetSubAdminId}
                onChange={e => setAssignTargetSubAdminId(e.target.value)}
                className="text-xs bg-indigo-900 border border-indigo-500 text-white rounded-lg px-2 py-1.5 outline-none">
                <option value="">Choose sub-admin…</option>
                {subAdmins.map(sa => <option key={sa.id} value={sa.id}>{sa.fullName}</option>)}
              </select>
              <button onClick={handleBulkAssign} disabled={!assignTargetSubAdminId || assigning}
                className="px-4 py-1.5 bg-white text-indigo-700 font-bold text-xs rounded-lg disabled:opacity-50 flex items-center gap-1">
                {assigning ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />} Assign
              </button>
              <button onClick={() => setSelectedForAssign(new Set())} className="text-indigo-300 hover:text-white"><X size={16} /></button>
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">All Registered Clients ({users.length})</h2>
            <div className="flex gap-2">
              <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"><RefreshCw size={13} /> Refresh</button>
              <button onClick={() => handleExport('users')} disabled={exporting === 'users'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50">
                {exporting === 'users' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export Excel
              </button>
            </div>
          </div>

          {/* User search bar */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, phone, email or BSU-000001…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers()}
              className="flex-1 text-xs outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
            />
            {userSearch && <button onClick={() => setUserSearch('')} className="text-slate-300 hover:text-slate-500 text-xs">✕</button>}
            <button onClick={fetchUsers} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all">Search</button>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading users…</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs text-slate-700">
                <thead><tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  {['ID', 'Name', 'Phone', 'Email', 'State', 'Bookings', 'Joined'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={`border-b border-slate-50 hover:bg-indigo-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/60'}`}>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{genDisplayId('user', u.seqId)}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{u.fullName || '—'}</td>
                      <td className="px-4 py-3 font-mono">{u.phoneNumber}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email || '—'}</td>
                      <td className="px-4 py-3">{u.state || '—'}</td>
                      <td className="px-4 py-3 text-center">{u._count?.bookings ?? 0}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="text-center py-12 text-slate-500 text-sm">No users found.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── FUNNEL ── */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Onboarding Funnel</h2>
            <div className="flex gap-2">
              <button onClick={fetchFunnel} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"><RefreshCw size={13} /> Refresh</button>
              <button onClick={() => handleExport('funnel')} disabled={exporting === 'funnel'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50">
                {exporting === 'funnel' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export Excel
              </button>
            </div>
          </div>
          {funnelLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading funnel…</div>
          ) : (
            <>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-3">
                {funnelSteps.map((s) => {
                  const max = funnelSteps[0]?.count || 1;
                  const pct = Math.round((s.count / max) * 100);
                  return (
                    <div key={s.step} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-semibold">Step {s.step}: {s.label}</span>
                        <span className="text-gold-400 font-bold">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#D4AF37,#B48C22)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-xs text-slate-700">
                  <thead><tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    {['Phone', 'Name', 'Email', 'State', 'Step', 'Last Active', 'Done', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {funnelSessions.map((s, i) => {
                      const snap = s.formSnapshot;
                      const open = expandedFunnelRow === s.id;
                      return (
                        <React.Fragment key={s.id}>
                          <tr className={`border-b border-slate-50 hover:bg-indigo-50/40 ${i % 2 === 0 ? '' : 'bg-slate-50/60'}`}>
                            <td className="px-4 py-3 font-mono">{s.phoneNumber}</td>
                            <td className="px-4 py-3 font-medium">{snap?.fullName || '—'}</td>
                            <td className="px-4 py-3 text-slate-400">{snap?.email || '—'}</td>
                            <td className="px-4 py-3">{snap?.state || '—'}</td>
                            <td className="px-4 py-3">{s.currentStep}/8 · <span className="text-slate-400">{s.stepLabel}</span></td>
                            <td className="px-4 py-3 text-slate-500">{new Date(s.lastActiveAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-4 py-3 text-center">{s.advisorId ? <CheckCircle size={13} className="text-emerald-400 mx-auto" /> : <XCircle size={13} className="text-red-400 mx-auto" />}</td>
                            <td className="px-4 py-3">
                              {snap && Object.keys(snap).some(k => (snap as any)[k]) && (
                                <button onClick={() => setExpandedFunnelRow(open ? null : s.id)}
                                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                  {open ? 'Hide' : 'Details'} {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                </button>
                              )}
                            </td>
                          </tr>
                          {open && snap && (
                            <tr className="bg-indigo-50/60 border-b border-indigo-100">
                              <td colSpan={8} className="px-6 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  {([
                                    ['Type', snap.advisorType],
                                    ['Business', snap.businessName],
                                    ['City', snap.city],
                                    ['Experience', snap.experienceYears ? `${snap.experienceYears} yrs` : undefined],
                                    ['Fee', snap.consultationFee ? `₹${snap.consultationFee}` : undefined],
                                    ['Languages', snap.languages?.join(', ')],
                                    ['License', snap.licenseNumber],
                                    ['GST', snap.gstNumber],
                                    ['Services', snap.selectedSlugs?.join(', ')],
                                  ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                                    <div key={label}>
                                      <p className="text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-0.5">{label}</p>
                                      <p className="font-semibold text-slate-700 truncate">{value}</p>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {funnelSessions.length === 0 && <p className="text-center py-12 text-slate-500 text-sm">No onboarding sessions recorded yet.</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PENDING', 'SUCCESS', 'FAILED'].map(s => (
                <button key={s} onClick={() => setSubStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${subStatusFilter === s ? 'bg-gold-500 text-navy-800 border-gold-500' : 'text-slate-500 border-slate-200 bg-white hover:border-indigo-300'}`}>
                  {s === 'ALL' ? 'All Payments' : s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchSubscriptions} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"><RefreshCw size={13} /> Refresh</button>
              <button onClick={() => handleExport('subscriptions')} disabled={exporting === 'subscriptions'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50">
                {exporting === 'subscriptions' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export Excel
              </button>
            </div>
          </div>
          {subLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading…</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs text-slate-700">
                <thead><tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  {['Advisor', 'Type', 'Razorpay Order', 'Razorpay Payment', 'Amount', 'Status', 'Subscribed', 'Expires'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {subscriptions.map((s, i) => (
                    <tr key={s.id} className={`border-b border-slate-50 hover:bg-indigo-50/40 ${i % 2 === 0 ? '' : 'bg-slate-50/60'}`}>
                      <td className="px-4 py-3 font-medium">{s.advisor.fullName}<div className="text-[10px] text-slate-500">{s.advisor.email}</div></td>
                      <td className="px-4 py-3">{s.advisor.advisorType}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{s.razorpayOrderId}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{s.razorpayPaymentId || '—'}</td>
                      <td className="px-4 py-3 text-gold-400 font-bold">₹{s.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : s.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscriptions.length === 0 && <p className="text-center py-12 text-slate-500 text-sm">No subscription payments found.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── CONTACT PACKS ── */}
      {activeTab === 'contact-packs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PENDING', 'SUCCESS', 'FAILED'].map(s => (
                <button key={s} onClick={() => setContactSubStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${contactSubStatusFilter === s ? 'bg-gold-500 text-navy-800 border-gold-500' : 'text-slate-500 border-slate-200 bg-white hover:border-indigo-300'}`}>
                  {s === 'ALL' ? 'All Packs' : s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchContactSubs} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"><RefreshCw size={13} /> Refresh</button>
              <button onClick={() => handleExport('contact-subscriptions')} disabled={exporting === 'contact-subscriptions'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50">
                {exporting === 'contact-subscriptions' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export Excel
              </button>
            </div>
          </div>
          {contactSubsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading…</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs text-slate-700">
                <thead><tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  {['User', 'Phone', 'Order ID', 'Payment ID', 'Amount', 'Credits (Used/Total)', 'Status', 'Subscribed', 'Expires'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {contactSubs.map((s, i) => (
                    <tr key={s.id} className={`border-b border-slate-50 hover:bg-indigo-50/40 ${i % 2 === 0 ? '' : 'bg-slate-50/60'}`}>
                      <td className="px-4 py-3 font-medium">{s.user.fullName || '—'}<div className="text-[10px] text-slate-500">{s.user.email}</div></td>
                      <td className="px-4 py-3 font-mono">{s.user.phoneNumber}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{s.razorpayOrderId}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{s.razorpayPaymentId || '—'}</td>
                      <td className="px-4 py-3 text-gold-400 font-bold">₹{s.amount}</td>
                      <td className="px-4 py-3 text-center">{s.creditsUsed}/{s.creditsTotal}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : s.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contactSubs.length === 0 && <p className="text-center py-12 text-slate-500 text-sm">No contact pack purchases found.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── CONTACT UNLOCKS ── */}
      {activeTab === 'contact-unlocks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Advisor Contact Unlocks</h2>
              <p className="text-xs text-slate-500 mt-0.5">Every advisor contact revealed by a user — {contactUnlocksTotal} total</p>
            </div>
            <div className="flex gap-2 items-center">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search user or advisor…"
                  value={contactUnlocksSearch}
                  onChange={e => setContactUnlocksSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchContactUnlocks()}
                  className="outline-none bg-transparent w-44 placeholder-slate-400 text-slate-700"
                />
              </div>
              <button onClick={fetchContactUnlocks} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {contactUnlocksLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading…</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    {['User', 'User Phone', 'Advisor', 'Advisor Phone', 'Service Categories', 'Location', 'Unlock Type', 'Unlocked On'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contactUnlocks.map((u, i) => (
                    <tr key={u.id} className={`border-b border-slate-50 hover:bg-indigo-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{u.user.fullName || '—'}</p>
                        {u.user.email && <p className="text-[10px] text-slate-400 mt-0.5">{u.user.email}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{u.user.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{u.advisor.fullName}</p>
                        {u.advisor.businessName && <p className="text-[10px] text-slate-400 mt-0.5">{u.advisor.businessName}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{u.advisor.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.advisor.categories.length > 0
                            ? u.advisor.categories.slice(0, 2).map(cat => (
                                <span key={cat} className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  {cat}
                                </span>
                              ))
                            : <span className="text-slate-400">—</span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {u.advisor.location}{u.advisor.state ? `, ${u.advisor.state}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.isFree ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {u.isFree ? '🎁 Free' : 'Credit'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(u.unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <div className="text-[10px] text-slate-400">
                          {new Date(u.unlockedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contactUnlocks.length === 0 && (
                <p className="text-center py-12 text-slate-500 text-sm">No contact unlocks found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── BOOKINGS ── */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'] as const).map(f => (
                <button key={f} onClick={() => setBookingFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${bookingFilter === f ? 'bg-gold-500 text-navy-800 border-gold-500' : 'text-slate-400 border-slate-700 hover:border-gold-500/30'}`}>
                  {f === 'ALL' ? 'All' : f[0] + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchBookings} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"><RefreshCw size={13} /> Refresh</button>
              <button onClick={() => handleExport('bookings')} disabled={exporting === 'bookings'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50">
                {exporting === 'bookings' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export Excel
              </button>
            </div>
          </div>
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading bookings…</div>
          ) : (
            <div className="space-y-3">
              {(bookingFilter === 'ALL' ? allBookings : allBookings.filter(b => b.status === bookingFilter)).map(b => (
                <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">{b.bookingNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[b.status]}`}>{b.status}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{b.client?.fullName ?? 'Client'} → {b.advisor?.fullName ?? 'Advisor'}</p>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={11} className="text-gold-500/60" />{new Date(b.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={11} className="text-gold-500/60" />{b.startTime} – {b.endTime}</span>
                      <span className="text-gold-400 font-bold">₹{b.totalFee}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">{b.mode}</div>
                </div>
              ))}
              {(bookingFilter === 'ALL' ? allBookings : allBookings.filter(b => b.status === bookingFilter)).length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><BookOpen size={40} className="text-slate-300 mx-auto mb-3" /><p className="text-slate-500 text-sm">No bookings found.</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SUPPORT TICKETS ── */}
      {activeTab === 'support' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TicketCheck size={18} className="text-indigo-600" /> Support Tickets
                {ticketTotal > 0 && <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">{ticketTotal} total</span>}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Tickets raised by clients and advisors via /contact</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                <button key={s} onClick={() => { setTicketStatusFilter(s); setSelectedTicket(null); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${ticketStatusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
              <button onClick={fetchTickets} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {ticketsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm">No support tickets found</p>
              {ticketStatusFilter !== 'ALL' && <button onClick={() => setTicketStatusFilter('ALL')} className="mt-3 text-xs text-indigo-500 hover:underline">Clear filter</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left: ticket list */}
              <div className="lg:col-span-2 space-y-2">
                {tickets.map(ticket => {
                  const statusColor = ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : ticket.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200';
                  const prioColor = ticket.priority === 'URGENT' ? 'text-red-600' : ticket.priority === 'HIGH' ? 'text-amber-600' : ticket.priority === 'MEDIUM' ? 'text-blue-600' : 'text-slate-400';
                  return (
                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                      className={`bg-white rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md ${selectedTicket?.id === ticket.id ? 'border-indigo-400 shadow-md ring-1 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-indigo-600">{ticket.ticketNumber || `BS-${ticket.id.slice(-8).toUpperCase()}`}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>{ticket.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate mb-1">{ticket.subject}</p>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">{ticket.category?.replace('_', ' ')}</span>
                        <span className={`text-[10px] font-semibold ${prioColor}`}>{ticket.priority}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{ticket.user.fullName || ticket.user.phoneNumber}</p>
                      {ticket.assignedToAdmin && (
                        <p className="text-[10px] text-slate-400 mt-0.5">↳ {ticket.assignedToAdmin.fullName}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right: detail panel */}
              {selectedTicket ? (
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 space-y-5 h-fit sticky top-4 max-h-[85vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-indigo-600">{selectedTicket.ticketNumber || `BS-${selectedTicket.id.slice(-8).toUpperCase()}`}</span>
                      <h3 className="text-base font-bold text-slate-800 mt-0.5">{selectedTicket.subject}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        From: <strong className="text-slate-600">{selectedTicket.user.fullName || 'User'}</strong>
                        {' · '}{selectedTicket.user.phoneNumber}
                        {selectedTicket.user.email && <> · {selectedTicket.user.email}</>}
                        {selectedTicket.user.role && <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{selectedTicket.user.role}</span>}
                      </p>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className="text-slate-300 hover:text-slate-500 shrink-0"><X size={16} /></button>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const c = selectedTicket.status === 'OPEN' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : selectedTicket.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : selectedTicket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-200';
                      return <span className={`text-xs font-bold px-3 py-1 rounded-full ${c}`}>{selectedTicket.status.replace('_', ' ')}</span>;
                    })()}
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                      {selectedTicket.priority} priority
                    </span>
                    <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                      {selectedTicket.category?.replace('_', ' ')}
                    </span>
                    {selectedTicket.assignedToAdmin && (
                      <span className="text-xs flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-full">
                        <UserCheck size={11} /> {selectedTicket.assignedToAdmin.fullName}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                    {selectedTicket.description}
                  </div>

                  {/* Closing notes */}
                  {selectedTicket.closingNotes && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Lock size={11} /> Closing Notes
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedTicket.closingNotes}</p>
                    </div>
                  )}

                  {/* Assign section (SUPER_ADMIN only) */}
                  {isSuperAdmin && selectedTicket.status !== 'CLOSED' && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assign to Sub-Admin</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={assignTargetId}
                          onChange={e => setAssignTargetId(e.target.value)}
                          className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-400"
                        >
                          <option value="">Select sub-admin…</option>
                          {ticketSubAdmins.map(sa => (
                            <option key={sa.id} value={sa.id}>{sa.fullName}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignTicket(selectedTicket.id, assignTargetId)}
                          disabled={!assignTargetId || assigningTicket === selectedTicket.id}
                          className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {assigningTicket === selectedTicket.id ? <><Loader2 size={12} className="animate-spin" /> Assigning…</> : <><UserCheck size={12} /> Assign</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Update Status */}
                  {selectedTicket.status !== 'CLOSED' && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                          <button key={s} onClick={() => updateTicketStatus(selectedTicket.id, s)}
                            disabled={selectedTicket.status === s}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              s === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                              : s === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}>
                            {s === 'IN_PROGRESS' ? '🔄 In Progress' : s === 'RESOLVED' ? '✅ Resolved' : '🔒 Close Ticket'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Timeline */}
                  {selectedTicket.activities?.length > 0 && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Activity Timeline</p>
                      <div className="space-y-3">
                        {selectedTicket.activities.map((act, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              {act.action === 'ASSIGNED' ? <UserCheck size={11} className="text-indigo-500" />
                               : act.action === 'CLOSED' ? <Lock size={11} className="text-slate-500" />
                               : <Activity size={11} className="text-indigo-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700">
                                {act.action === 'ASSIGNED' ? (act.note || 'Ticket assigned')
                                 : act.action === 'CLOSED' ? 'Ticket closed'
                                 : act.toStatus ? `Status → ${act.toStatus.replace('_', ' ')}` : act.action}
                              </p>
                              {act.note && act.action !== 'ASSIGNED' && (
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{act.note}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {act.performedByName} · {new Date(act.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden lg:col-span-3 lg:flex items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 h-64 text-slate-300 text-sm">
                  ← Click a ticket to view details
                </div>
              )}
            </div>
          )}

          {/* Closing Notes Modal */}
          {closingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Lock size={16} className="text-red-500" /> Close Ticket
                  </h3>
                  <button onClick={() => setClosingModal(false)} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
                </div>
                <p className="text-sm text-slate-500">Provide closing notes to explain the resolution before closing this ticket.</p>
                <textarea
                  value={closingNoteText}
                  onChange={e => setClosingNoteText(e.target.value)}
                  placeholder="Describe how this issue was resolved…"
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none"
                />
                <div className="flex items-center gap-3 justify-end">
                  <button onClick={() => setClosingModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={confirmCloseTicket}
                    disabled={!closingNoteText.trim() || closingSubmitting}
                    className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {closingSubmitting ? <><Loader2 size={13} className="animate-spin" /> Closing…</> : <>🔒 Close Ticket</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-ADMINS (SUPER_ADMIN only) ── */}
      {activeTab === 'sub-admins' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Shield size={15} className="text-indigo-500" /> Sub-Admin Management
            </h2>
            <button onClick={fetchSubAdmins} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600"><RefreshCw size={13} /> Refresh</button>
          </div>

          {/* Create sub-admin form */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2"><UserPlus size={13} className="text-indigo-500" /> Create New Sub-Admin</h3>
            {subAdminFormError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{subAdminFormError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text" placeholder="Full Name" value={newSubAdmin.fullName}
                onChange={e => setNewSubAdmin(p => ({ ...p, fullName: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 placeholder:text-slate-400"
              />
              <input
                type="email" placeholder="Email Address" value={newSubAdmin.email}
                onChange={e => setNewSubAdmin(p => ({ ...p, email: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 placeholder:text-slate-400"
              />
              <input
                type="password" placeholder="Password (min 8 chars)" value={newSubAdmin.password}
                onChange={e => setNewSubAdmin(p => ({ ...p, password: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 placeholder:text-slate-400"
              />
            </div>
            <button onClick={handleCreateSubAdmin} disabled={creatingSubAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all">
              {creatingSubAdmin ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Create Sub-Admin
            </button>
          </div>

          {/* Sub-admin list */}
          {subAdminsLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading…</div>
          ) : subAdmins.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm bg-white rounded-xl border border-slate-100">No sub-admins created yet.</p>
          ) : (
            <div className="space-y-3">
              {subAdmins.map((sa) => {
                const s = sa.stats ?? { assigned: 0, underReview: 0, submitted: 0, processed: 0 };
                const pending = s.underReview + s.submitted;
                return (
                  <div key={sa.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800">{sa.fullName}</p>
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{genDisplayId('admin', sa.seqId)}</span>
                        </div>
                        <p className="text-xs text-slate-400">{sa.email}</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          Added {new Date(sa.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteSubAdmin(sa.id, sa.fullName)}
                        className="text-[10px] text-red-500 hover:text-red-700 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Assigned', value: s.assigned, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
                        { label: 'Under Review', value: s.underReview, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                        { label: 'Submitted', value: s.submitted, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                        { label: 'Processed', value: s.processed, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                      ].map((stat) => (
                        <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-lg px-3 py-2 text-center`}>
                          <p className={`text-lg font-black ${stat.text}`}>{stat.value}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-wider ${stat.text} opacity-70`}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {pending > 0 && (
                      <p className="text-[10px] text-amber-600 mt-2 font-medium">
                        ⏳ {pending} advisor{pending > 1 ? 's' : ''} in pipeline
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>

    {/* ── REJECTION MODAL ── */}
    {rejectModalOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><XCircle size={16} className="text-red-500" /> Reject Advisor</h3>
            <button onClick={() => { setRejectModalOpen(false); setPendingRejectId(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <p className="text-xs text-slate-500">Provide a clear reason for rejection. This will be recorded and visible to reviewers.</p>
          <textarea
            value={rejectComment}
            onChange={e => setRejectComment(e.target.value)}
            placeholder="e.g. Aadhaar card is blurry and unreadable. GST certificate appears expired."
            rows={4}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-red-400 placeholder:text-slate-300 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setRejectModalOpen(false); setPendingRejectId(null); }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={confirmReject} disabled={rejectComment.trim().length < 5 || !!verifying}
              className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
              {verifying ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Confirm Rejection
            </button>
          </div>
          {rejectComment.trim().length > 0 && rejectComment.trim().length < 5 && (
            <p className="text-[10px] text-red-500">Minimum 5 characters required.</p>
          )}
        </div>
      </div>
    )}

    {/* ── SUBMIT FOR APPROVAL MODAL (SUB_ADMIN) ── */}
    {submitModalOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Send size={16} className="text-purple-500" /> Submit for Approval</h3>
            <button onClick={() => { setSubmitModalOpen(false); setPendingSubmitId(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <p className="text-xs text-slate-500">You can add an optional note for the Super Admin. All documents should be verified before submitting.</p>
          <textarea
            value={submitNote}
            onChange={e => setSubmitNote(e.target.value)}
            placeholder="Optional: Add any notes for the super admin about this profile…"
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-purple-400 placeholder:text-slate-300 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setSubmitModalOpen(false); setPendingSubmitId(null); }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={confirmSubmit} disabled={!!verifying}
              className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5">
              {verifying ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit for Approval
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
