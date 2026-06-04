'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, CheckCircle, XCircle, TrendingUp, AlertTriangle,
  ShieldCheck, BookOpen, Loader2, Calendar, Clock, RefreshCw, BadgeCheck,
  BarChart2, CreditCard, Download, ChevronDown, MapPin, X,
  UserCheck, Award, Activity
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type AdminTab = 'overview' | 'advisors' | 'users' | 'funnel' | 'subscriptions' | 'bookings';
type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

const STATUS_BADGE: Record<BookingStatus, string> = {
  PENDING:   'bg-amber-500/10 text-amber-400',
  ACCEPTED:  'bg-blue-500/10 text-blue-400',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  DISPUTED:  'bg-orange-500/10 text-orange-400',
};

const VSTATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-500/10 text-amber-400',
  APPROVED:  'bg-emerald-500/10 text-emerald-400',
  REJECTED:  'bg-red-500/10 text-red-400',
  SUSPENDED: 'bg-orange-500/10 text-orange-400',
};

interface Advisor {
  id: string; fullName: string; email: string; phoneNumber: string;
  businessName?: string; licenseNumber?: string; gstNumber?: string;
  aadhaarLast4?: string; advisorType: string; verificationStatus: string;
  isAuthorizedDealer?: boolean; dealerAuthorizedAt?: string;
  experienceYears: number; location: string; state?: string;
  consultationFee: string; createdAt: string;
  documents?: { id: string; documentType: string; documentUrl: string; verified: boolean }[];
  subscriptions?: { status: string; expiresAt?: string; subscribedAt?: string }[];
}

interface User { id: string; fullName?: string; email?: string; phoneNumber: string; state?: string; createdAt: string; _count?: { bookings: number }; }
interface Subscription { id: string; advisorId: string; razorpayOrderId: string; razorpayPaymentId?: string; amount: string; status: string; subscribedAt?: string; expiresAt?: string; advisor: { fullName: string; email: string; advisorType: string }; }
interface Booking { id: string; bookingNumber: string; scheduledDate: string; startTime: string; endTime: string; status: BookingStatus; totalFee: string; mode: string; client?: { fullName?: string; phoneNumber: string }; advisor?: { fullName: string }; }
interface FunnelStep { step: number; label: string; count: number; }
interface FunnelSession { id: string; phoneNumber: string; currentStep: number; stepLabel: string; lastActiveAt: string; advisorId?: string; }
interface Metrics { totalClients: number; totalAdvisors: number; authorizedAdvisors: number; regularAdvisors: number; pendingVerification: number; consultationsCompleted: number; grossRevenue: string; platformCommission: string; activeSubscriptions: number; subscriptionRevenue: string; abandonedFunnels: number; completedOnboardings: number; }

export default function AdminSuitePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<Metrics>({ totalClients: 0, totalAdvisors: 0, authorizedAdvisors: 0, regularAdvisors: 0, pendingVerification: 0, consultationsCompleted: 0, grossRevenue: '0', platformCommission: '0', activeSubscriptions: 0, subscriptionRevenue: '0', abandonedFunnels: 0, completedOnboardings: 0 });

  // Advisors tab
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorsLoading, setAdvisorsLoading] = useState(false);
  const [advisorStatusFilter, setAdvisorStatusFilter] = useState('ALL');
  const [advisorTypeFilter, setAdvisorTypeFilter] = useState('ALL');
  const [selectedAdv, setSelectedAdv] = useState<Advisor | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['Admin portal loaded.']);

  // Users tab
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Funnel tab
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [funnelSessions, setFunnelSessions] = useState<FunnelSession[]>([]);
  const [funnelLoading, setFunnelLoading] = useState(false);

  // Subscriptions tab
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subStatusFilter, setSubStatusFilter] = useState('ALL');

  // Bookings tab
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | 'ALL'>('ALL');

  const token = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') || '' : '');

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
      const params = new URLSearchParams({ limit: '50' });
      if (advisorStatusFilter !== 'ALL') params.set('status', advisorStatusFilter);
      if (advisorTypeFilter !== 'ALL') params.set('type', advisorTypeFilter);
      const r = await fetch(`${API}/admin/advisors?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) { setAdvisors(d.data); setSelectedAdv(d.data[0] ?? null); }
    } catch { /* empty */ } finally { setAdvisorsLoading(false); }
  }, [advisorStatusFilter, advisorTypeFilter]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const r = await fetch(`${API}/admin/users?limit=50`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setUsers(d.data);
    } catch { /* empty */ } finally { setUsersLoading(false); }
  }, []);

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

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { if (activeTab === 'advisors') fetchAdvisors(); }, [activeTab, fetchAdvisors]);
  useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [activeTab, fetchUsers]);
  useEffect(() => { if (activeTab === 'funnel') fetchFunnel(); }, [activeTab, fetchFunnel]);
  useEffect(() => { if (activeTab === 'subscriptions') fetchSubscriptions(); }, [activeTab, fetchSubscriptions]);
  useEffect(() => { if (activeTab === 'bookings') fetchBookings(); }, [activeTab, fetchBookings]);

  const handleVerify = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setVerifying(id + action);
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    try {
      await fetch(`${API}/admin/advisors/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status }),
      });
      const adv = advisors.find(a => a.id === id);
      if (adv) setLogs(prev => [`Advisor ${adv.fullName} was ${action}D.`, ...prev]);
      setAdvisors(prev => prev.map(a => a.id === id ? { ...a, verificationStatus: status } : a));
      if (selectedAdv?.id === id) setSelectedAdv(prev => prev ? { ...prev, verificationStatus: status } : prev);
      fetchDashboard();
    } catch { /* keep */ } finally { setVerifying(null); }
  };

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

  const exportUrl = (entity: string) => `${API}/admin/export/${entity}`;

  const TABS: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'advisors', label: 'Advisors', icon: Users },
    { key: 'users', label: 'Users', icon: UserCheck },
    { key: 'funnel', label: 'Onboarding Funnel', icon: Activity },
    { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { key: 'bookings', label: 'Bookings', icon: BookOpen },
  ];

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
          Admin Operations Suite
          <span className="text-xs border border-gold-500/30 text-gold-400 font-semibold px-2 py-0.5 rounded bg-gold-500/5 uppercase tracking-wider">Super Admin</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">Manage advisors, users, onboarding funnel, subscriptions, and bookings.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gold-500/10 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === key ? 'border-gold-500 text-gold-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Advisors', value: metrics.totalAdvisors, sub: `${metrics.regularAdvisors} Regular / ${metrics.authorizedAdvisors} Authorized`, icon: Users, color: 'border-l-blue-500' },
              { label: 'Total Clients', value: metrics.totalClients, sub: 'Registered users', icon: UserCheck, color: 'border-l-emerald-500' },
              { label: 'Pending Approval', value: metrics.pendingVerification, sub: 'KYC awaiting review', icon: AlertTriangle, color: 'border-l-amber-500', pulse: true },
              { label: 'Paid Subscriptions', value: metrics.activeSubscriptions, sub: 'Active authorized badges', icon: CreditCard, color: 'border-l-gold-500' },
              { label: 'Gross Revenue', value: `₹${parseFloat(metrics.grossRevenue || '0').toLocaleString('en-IN')}`, sub: 'Total booking turnover', icon: TrendingUp, color: 'border-l-gold-500' },
              { label: 'Subscription Revenue', value: `₹${parseFloat(metrics.subscriptionRevenue || '0').toLocaleString('en-IN')}`, sub: 'From authorized badges', icon: Award, color: 'border-l-purple-500' },
              { label: 'Abandoned Funnels', value: metrics.abandonedFunnels, sub: 'Started but not submitted', icon: XCircle, color: 'border-l-red-500' },
              { label: 'Completed Onboardings', value: metrics.completedOnboardings, sub: 'Fully submitted profiles', icon: CheckCircle, color: 'border-l-emerald-500' },
            ].map((w, i) => (
              <div key={i} className={`glass-card rounded-xl p-4 border-l-4 ${w.color} space-y-1`}>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] uppercase font-semibold">{w.label}</span>
                  <w.icon size={14} className={`text-gold-500 ${(w as any).pulse ? 'animate-pulse' : ''}`} />
                </div>
                <p className="text-xl font-black text-slate-100">{w.value}</p>
                <span className="text-[10px] text-slate-500">{w.sub}</span>
              </div>
            ))}
          </div>

          {/* Audit log */}
          <div className="glass-card rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest pb-3 border-b border-gold-500/10 mb-3">Audit Log</h4>
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
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(s => (
                <button key={s} onClick={() => setAdvisorStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${advisorStatusFilter === s ? 'bg-gold-500 text-navy-800 border-gold-500' : 'text-slate-400 border-slate-700 hover:border-gold-500/40'}`}>
                  {s === 'ALL' ? 'All Status' : s}
                </button>
              ))}
              {['ALL', 'REGULAR', 'AUTHORIZED'].map(t => (
                <button key={t} onClick={() => setAdvisorTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${advisorTypeFilter === t ? 'bg-blue-600 text-white border-blue-500' : 'text-slate-400 border-slate-700 hover:border-blue-500/40'}`}>
                  {t === 'ALL' ? 'All Types' : t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchAdvisors} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold-400 transition-colors"><RefreshCw size={13} /> Refresh</button>
              <a href={exportUrl('advisors')} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 transition-all">
                <Download size={13} /> Export Excel
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 glass-card rounded-xl p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 520 }}>
              {advisorsLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 size={18} className="animate-spin mr-2" /> Loading…</div>
              ) : advisors.length === 0 ? (
                <div className="text-center py-10"><CheckCircle className="mx-auto text-gold-500/30 mb-2" size={32} /><p className="text-xs text-slate-400">No advisors found.</p></div>
              ) : advisors.map(adv => (
                <button key={adv.id} onClick={() => setSelectedAdv(adv)}
                  className={`w-full text-left p-3 rounded-xl border text-xs space-y-1.5 transition-all ${selectedAdv?.id === adv.id ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-navy-800/20 border-gold-500/5 hover:border-gold-500/25 text-slate-300'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{adv.fullName}</span>
                    <div className="flex gap-1">
                      {adv.isAuthorizedDealer && <BadgeCheck size={12} className="text-amber-400" />}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${VSTATUS_BADGE[adv.verificationStatus] || 'bg-slate-500/10 text-slate-400'}`}>{adv.verificationStatus}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{adv.advisorType}</span><span>{adv.state || adv.location}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2 space-y-4">
              {selectedAdv ? (
                <div className="glass-card rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-gold-500/10 pb-4 gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{selectedAdv.fullName}</h3>
                      <p className="text-xs text-slate-400">{selectedAdv.location} · {selectedAdv.experienceYears}y exp · ₹{selectedAdv.consultationFee}/session</p>
                      <p className="text-[11px] text-slate-500 font-mono">{selectedAdv.email} · {selectedAdv.phoneNumber}</p>
                      {selectedAdv.aadhaarLast4 && <p className="text-[11px] text-slate-500">Aadhaar: {selectedAdv.aadhaarLast4}</p>}
                      {selectedAdv.licenseNumber && <p className="text-[11px] text-slate-500">License: {selectedAdv.licenseNumber}</p>}
                      {selectedAdv.gstNumber && <p className="text-[11px] text-slate-500">GST: {selectedAdv.gstNumber}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleVerify(selectedAdv.id, 'APPROVE')} disabled={!!verifying}
                        className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60">
                        {verifying === selectedAdv.id + 'APPROVE' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                      </button>
                      <button onClick={() => handleVerify(selectedAdv.id, 'REJECT')} disabled={!!verifying}
                        className="px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60">
                        {verifying === selectedAdv.id + 'REJECT' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Reject
                      </button>
                      <button onClick={() => handleDealerToggle(selectedAdv.id, selectedAdv.isAuthorizedDealer ? 'REVOKE' : 'GRANT')} disabled={!!verifying}
                        className={`px-3 py-2 font-bold text-xs rounded-lg flex items-center gap-1 disabled:opacity-60 ${selectedAdv.isAuthorizedDealer ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-gradient-to-r from-amber-600 to-yellow-400 text-slate-950'}`}>
                        {verifying === selectedAdv.id + 'DEALER' ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />}
                        {selectedAdv.isAuthorizedDealer ? 'Revoke Dealer' : 'Grant Dealer'}
                      </button>
                    </div>
                  </div>

                  {/* KYC documents */}
                  {selectedAdv.documents && selectedAdv.documents.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">KYC Documents</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedAdv.documents.map(doc => (
                          <a key={doc.id} href={`http://localhost:5000${doc.documentUrl}`} target="_blank" rel="noreferrer"
                            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gold-500/20 bg-gold-500/5 hover:bg-gold-500/10 transition-all cursor-pointer">
                            <FileText size={20} className="text-gold-400" />
                            <span className="text-[10px] text-slate-400 text-center leading-tight">{doc.documentType.replace(/_/g, ' ')}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${doc.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {doc.verified ? 'Verified' : 'Pending'}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-16 text-center text-slate-400 text-sm">
                  <Users className="mx-auto text-gold-500/20 mb-3" size={40} /> Select an advisor to view details.
                </div>
              )}

              <div className="glass-card rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest pb-2 border-b border-gold-500/10">Audit Log</h4>
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
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">All Registered Clients ({users.length})</h2>
            <div className="flex gap-2">
              <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold-400"><RefreshCw size={13} /> Refresh</button>
              <a href={exportUrl('users')} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 transition-all">
                <Download size={13} /> Export Excel
              </a>
            </div>
          </div>
          {usersLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading users…</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gold-500/10">
              <table className="w-full text-xs text-slate-300">
                <thead><tr className="bg-navy-800/60 text-slate-400 border-b border-gold-500/10">
                  {['Name', 'Phone', 'Email', 'State', 'Bookings', 'Joined'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={`border-b border-gold-500/5 hover:bg-gold-500/5 transition-colors ${i % 2 === 0 ? '' : 'bg-navy-800/20'}`}>
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
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Onboarding Funnel</h2>
            <div className="flex gap-2">
              <button onClick={fetchFunnel} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold-400"><RefreshCw size={13} /> Refresh</button>
              <a href={exportUrl('funnel')} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 transition-all">
                <Download size={13} /> Export Excel
              </a>
            </div>
          </div>
          {funnelLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading funnel…</div>
          ) : (
            <>
              <div className="glass-card rounded-xl p-5 space-y-3">
                {funnelSteps.map((s, i) => {
                  const max = funnelSteps[0]?.count || 1;
                  const pct = Math.round((s.count / max) * 100);
                  return (
                    <div key={s.step} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Step {s.step}: {s.label}</span>
                        <span className="text-gold-400 font-bold">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#D4AF37,#B48C22)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="overflow-x-auto rounded-xl border border-gold-500/10">
                <table className="w-full text-xs text-slate-300">
                  <thead><tr className="bg-navy-800/60 text-slate-400 border-b border-gold-500/10">
                    {['Phone', 'Step Reached', 'Label', 'Last Active', 'Advisor Created'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {funnelSessions.map((s, i) => (
                      <tr key={s.id} className={`border-b border-gold-500/5 hover:bg-gold-500/5 ${i % 2 === 0 ? '' : 'bg-navy-800/20'}`}>
                        <td className="px-4 py-3 font-mono">{s.phoneNumber}</td>
                        <td className="px-4 py-3 text-center">{s.currentStep}/8</td>
                        <td className="px-4 py-3">{s.stepLabel}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(s.lastActiveAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3 text-center">{s.advisorId ? <CheckCircle size={13} className="text-emerald-400 mx-auto" /> : <XCircle size={13} className="text-red-400 mx-auto" />}</td>
                      </tr>
                    ))}
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${subStatusFilter === s ? 'bg-gold-500 text-navy-800 border-gold-500' : 'text-slate-400 border-slate-700 hover:border-gold-500/40'}`}>
                  {s === 'ALL' ? 'All Payments' : s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchSubscriptions} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold-400"><RefreshCw size={13} /> Refresh</button>
              <a href={exportUrl('subscriptions')} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 transition-all">
                <Download size={13} /> Export Excel
              </a>
            </div>
          </div>
          {subLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading…</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gold-500/10">
              <table className="w-full text-xs text-slate-300">
                <thead><tr className="bg-navy-800/60 text-slate-400 border-b border-gold-500/10">
                  {['Advisor', 'Type', 'Razorpay Order', 'Razorpay Payment', 'Amount', 'Status', 'Subscribed', 'Expires'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {subscriptions.map((s, i) => (
                    <tr key={s.id} className={`border-b border-gold-500/5 hover:bg-gold-500/5 ${i % 2 === 0 ? '' : 'bg-navy-800/20'}`}>
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
              <button onClick={fetchBookings} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-gold-400"><RefreshCw size={13} /> Refresh</button>
              <a href={exportUrl('bookings')} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 transition-all">
                <Download size={13} /> Export Excel
              </a>
            </div>
          </div>
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin mr-3" /> Loading bookings…</div>
          ) : (
            <div className="space-y-3">
              {(bookingFilter === 'ALL' ? allBookings : allBookings.filter(b => b.status === bookingFilter)).map(b => (
                <div key={b.id} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                <div className="text-center py-16 glass-card rounded-2xl"><BookOpen size={40} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-400 text-sm">No bookings found.</p></div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
