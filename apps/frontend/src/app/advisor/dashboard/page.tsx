'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, User, AlertCircle, Loader2, ArrowLeft,
  CheckCircle2, XCircle, ShieldCheck, RefreshCw, LayoutDashboard,
  Phone, MessageSquare, BadgeCheck, Camera, Layers, FileText, Bell,
  Eye, Edit3, Send, Users, Ticket, QrCode, Copy, Check, X, Download,
  CreditCard, Crown, Zap, TrendingUp, Award, Star, Calculator,
} from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('react-qr-code').default as React.ComponentType<{ value: string; size?: number; bgColor?: string; fgColor?: string; level?: string }>;
import { useAuth } from '@/contexts/AuthContext';
import LiveClock from '@/components/LiveClock';
import AdvisorFillQuotePanel, { QuoteRequest } from '@/components/AdvisorFillQuotePanel';
import FeeCalculatorModal from '@/components/FeeCalculatorModal';
import { getCategoryName } from '@/data/categoryMap';
import { io as ioClient } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '');

interface AdvisorQuote {
  id: string; status: string; categorySlug?: string;
  clientMessage?: string; createdAt: string;
  totalAmount?: string; viewedAt?: string; advisorNote?: string;
  lineItems?: { description: string; amount: string }[];
  client: { id: string; fullName: string; phoneNumber: string };
}

interface ConnectedClient {
  id: string; createdAt: string;
  openQuoteStatus: string | null;
  user: { id: string; fullName: string; phoneNumber: string; avatarUrl?: string };
}

type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface Booking {
  id: string;
  bookingNumber: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalFee: string;
  mode: string;
  notes?: string;
  createdAt: string;
  chatRoom?: { id: string } | null;
  client?: { id: string; fullName: string; phoneNumber: string; avatarUrl?: string };
}

const STATUS_STYLES: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pending Review', bg: 'bg-amber-100',   text: 'text-amber-700'   },
  ACCEPTED:  { label: 'Accepted',       bg: 'bg-blue-100',    text: 'text-blue-700'    },
  COMPLETED: { label: 'Completed',      bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELLED: { label: 'Cancelled',      bg: 'bg-red-100',     text: 'text-red-700'     },
  DISPUTED:  { label: 'Disputed',       bg: 'bg-orange-100',  text: 'text-orange-700'  },
};

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'demo-1', bookingNumber: 'BS-20260602-0001',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '10:00', endTime: '11:00', status: 'PENDING', totalFee: '1500', mode: 'VIDEO',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    client: { id: 'c1', fullName: 'Ravi Ranjan', phoneNumber: '+919876543210' },
  },
  {
    id: 'demo-2', bookingNumber: 'BS-20260601-0042',
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '14:00', endTime: '15:00', status: 'ACCEPTED', totalFee: '1500', mode: 'PHONE',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    client: { id: 'c2', fullName: 'Priya Sharma', phoneNumber: '+918765432109' },
  },
];

export default function AdvisorDashboard() {
  const { isLoggedIn, authReady, user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<BookingStatus | 'ALL'>('ALL');
  const [subValidity, setSubValidity] = useState<{
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
    planType: 'REGULAR' | 'AUTHORIZED';
    trialEndDate: string | null;
    trialDaysLeft: number;
    isInTrial: boolean;
    isActive: boolean;
    subscriptionValidUntil: string | null;
    daysLeft: number;
  } | null>(null);

  // Quote requests
  const [quoteRequests,    setQuoteRequests]    = useState<AdvisorQuote[]>([]);
  const [unreadQuoteCount, setUnreadQuoteCount] = useState(0);
  const [selectedRequest,  setSelectedRequest]  = useState<QuoteRequest | null>(null);
  const [showQuotePanel,   setShowQuotePanel]   = useState(false);
  const [isProactive,      setIsProactive]      = useState(false);
  const [showQuoteList,    setShowQuoteList]    = useState(false);
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string | null>(null);

  // Connected clients
  const [connectedClients,    setConnectedClients]    = useState<ConnectedClient[]>([]);
  const [connectedLoading,    setConnectedLoading]    = useState(false);
  const [showConnectedClients, setShowConnectedClients] = useState(false);

  // Service tickets
  const [tickets,       setTickets]       = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showTickets,   setShowTickets]   = useState(false);

  // QR code
  const [showQR,         setShowQR]         = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [advisorPublicId, setAdvisorPublicId] = useState<string | null>(null);
  const [qrCopied,       setQrCopied]       = useState(false);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [advisorProfile, setAdvisorProfile] = useState<{
    advisorType?: string; location?: string; experienceYears?: number;
    avatarUrl?: string; licenseNumber?: string; businessName?: string;
  } | null>(null);

  // Upgrade plan modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePaying,    setUpgradePaying]    = useState(false);
  const [upgradeError,     setUpgradeError]     = useState('');
  const [upgradeSuccess,   setUpgradeSuccess]   = useState<{ plan: string; expiresAt: string } | null>(null);

  // Wallet & earnings
  const [walletData, setWalletData] = useState<{
    walletBalance: number;
    totalEarned: number;
    pendingWithdrawals: any[];
    recentPayouts: any[];
  } | null>(null);
  const [showWalletPanel,   setShowWalletPanel]   = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm,      setWithdrawForm]      = useState({ amount: '', bankAccount: '', ifscCode: '', accountHolderName: '' });
  const [withdrawing,       setWithdrawing]       = useState(false);
  const [withdrawError,     setWithdrawError]     = useState('');
  const [withdrawSuccess,   setWithdrawSuccess]   = useState(false);

  const qrSvgRef     = useRef<HTMLDivElement>(null);
  const bookingsRef  = useRef<HTMLDivElement>(null);

  const fetchWallet = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/advisors/wallet`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setWalletData(data.data);
    } catch { /* ignore */ }
  };

  const handleWithdraw = async () => {
    const { amount, bankAccount, ifscCode, accountHolderName } = withdrawForm;
    if (!amount || !bankAccount || !ifscCode || !accountHolderName) {
      setWithdrawError('All fields are required'); return;
    }
    setWithdrawing(true); setWithdrawError('');
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/advisors/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(amount), bankAccount, ifscCode, accountHolderName }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawSuccess(true);
        setWithdrawForm({ amount: '', bankAccount: '', ifscCode: '', accountHolderName: '' });
        fetchWallet();
      } else {
        setWithdrawError(data.message || 'Withdrawal failed');
      }
    } catch { setWithdrawError('Network error. Please try again.'); }
    finally { setWithdrawing(false); }
  };

  const fetchQuoteRequests = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/quotes`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setQuoteRequests(data.data);
    } catch { /* ignore */ }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/quotes/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUnreadQuoteCount(data.count);
    } catch { /* ignore */ }
  };

  const fetchConnectedClients = async () => {
    setConnectedLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/quotes/connected-clients`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setConnectedClients(data.data);
    } catch { /* ignore */ }
    finally { setConnectedLoading(false); }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTickets(data.data);
    } catch { /* ignore */ }
    finally { setTicketsLoading(false); }
  };

  const fetchAdvisorPublicId = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/advisors/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data?.id) {
        setAdvisorPublicId(data.data.id);
        setAdvisorProfile({
          advisorType:     data.data.advisorType,
          location:        data.data.location,
          experienceYears: data.data.experienceYears,
          avatarUrl:       data.data.avatarUrl,
          licenseNumber:   data.data.licenseNumber,
          businessName:    data.data.businessName,
        });
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) { router.push('/'); return; }
    if (user?.role !== 'ADVISOR') { router.push('/'); return; }
    fetchBookings();
    fetchSubscriptionValidity();
    fetchQuoteRequests();
    fetchUnreadCount();
    fetchConnectedClients();
    fetchTickets();
    fetchAdvisorPublicId();
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn, user]);

  const downloadQRPdf = async () => {
    if (!advisorPublicId || !qrSvgRef.current) return;
    setPdfLoading(true);
    try {
      const BACKEND_BASE = API.replace(/\/api\/v1\/?$/, '');
      const profileUrl  = `${window.location.origin}/advisors/${advisorPublicId}`;
      const advisorName = user?.fullName || 'Advisor';
      const location    = advisorProfile?.location || '';
      const initials    = advisorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

      // ── 1. QR SVG → image ─────────────────────────────────────────────
      const svgEl = qrSvgRef.current.querySelector('svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl  = URL.createObjectURL(svgBlob);
      const qrImg   = await new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = svgUrl;
      });

      // ── 2. Logo ───────────────────────────────────────────────────────
      const logoImg = await new Promise<HTMLImageElement | null>(res => {
        const img = new Image();
        img.onload = () => res(img); img.onerror = () => res(null); img.src = '/logo-icon.png';
      });

      // ── 3. Avatar (photo or null) ────────────────────────────────────
      const avatarImg = await new Promise<HTMLImageElement | null>(res => {
        if (!advisorProfile?.avatarUrl) return res(null);
        const raw = advisorProfile.avatarUrl;
        const url = raw.startsWith('http') ? raw : `${BACKEND_BASE}${raw.startsWith('/') ? raw : `/${raw}`}`;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img); img.onerror = () => res(null); img.src = url;
      });

      // ── 4. Canvas — A4 @ 2× for crisp output ─────────────────────────
      const W = 595, H = 842;
      const canvas = document.createElement('canvas');
      canvas.width  = W * 2; canvas.height = H * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);

      // ── Palette ───────────────────────────────────────────────────────
      const GOLD = '#D4AF37', GOLD_LT = '#F5D77A', GOLD_DK = '#AA771C';
      const NAVY = '#0B1F3A', WHITE = '#FFFFFF';
      const INDIGO = '#312e81', INDIGO_LT = '#4338ca';

      const makeGold = (x0: number, y0: number, x1: number, y1: number) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, GOLD_DK); g.addColorStop(0.3, GOLD_LT);
        g.addColorStop(0.5, GOLD);  g.addColorStop(0.7, GOLD_LT);
        g.addColorStop(1, GOLD_DK); return g;
      };

      const BDR = 3, RAD = 20;

      // White background + gold border
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.strokeStyle = makeGold(0, 0, W, H);
      ctx.lineWidth = BDR * 2;
      ctx.beginPath(); ctx.roundRect(BDR, BDR, W - BDR*2, H - BDR*2, RAD); ctx.stroke();
      ctx.restore();

      // ═══ HERO (top 195px) ════════════════════════════════════════════
      const heroH = 195;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(BDR + RAD, BDR); ctx.lineTo(W - BDR - RAD, BDR);
      ctx.arcTo(W-BDR, BDR, W-BDR, BDR+RAD, RAD);
      ctx.lineTo(W-BDR, heroH); ctx.lineTo(BDR, heroH);
      ctx.arcTo(BDR, BDR, BDR+RAD, BDR, RAD); ctx.closePath();
      const heroBg = ctx.createLinearGradient(0, 0, W, heroH);
      heroBg.addColorStop(0, INDIGO_LT); heroBg.addColorStop(1, INDIGO);
      ctx.fillStyle = heroBg; ctx.fill(); ctx.restore();

      // Dot grid on hero
      ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = WHITE;
      for (let gx = 18; gx < W; gx += 26)
        for (let gy = 12; gy < heroH; gy += 26) {
          ctx.beginPath(); ctx.arc(gx, gy, 1.2, 0, Math.PI*2); ctx.fill();
        }
      ctx.restore();

      // Logo + BrokerSaab text
      const logoSz = 44, brandFs = 30, gap = 10;
      ctx.font = `bold ${brandFs}px Arial`;
      const bW = ctx.measureText('Broker').width, sW = ctx.measureText('Saab').width;
      const rowW = logoSz + gap + bW + sW;
      const rowX = (W - rowW) / 2, rowCY = 72;
      if (logoImg) {
        ctx.save();
        ctx.shadowColor = 'rgba(212,175,55,0.5)'; ctx.shadowBlur = 14;
        ctx.fillStyle = WHITE;
        ctx.beginPath(); ctx.roundRect(rowX, rowCY - logoSz/2, logoSz, logoSz, 10); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.roundRect(rowX, rowCY - logoSz/2, logoSz, logoSz, 10); ctx.clip();
        ctx.drawImage(logoImg, rowX, rowCY - logoSz/2, logoSz, logoSz); ctx.restore();
      }
      const tX = rowX + logoSz + gap, tBY = rowCY + brandFs * 0.35;
      ctx.font = `bold ${brandFs}px Arial`; ctx.textAlign = 'left';
      ctx.fillStyle = WHITE; ctx.fillText('Broker', tX, tBY);
      ctx.fillStyle = makeGold(tX + bW, tBY - brandFs, tX + bW + sW, tBY);
      ctx.fillText('Saab', tX + bW, tBY);

      // Tagline
      const tag = 'TRUSTED ADVISORY PLATFORM';
      ctx.font = 'bold 9px Arial'; ctx.fillStyle = GOLD_LT;
      ctx.textAlign = 'center'; ctx.fillText(tag, W/2, rowCY + logoSz/2 + 18);

      // Gold divider at hero bottom
      ctx.strokeStyle = makeGold(40, heroH, W-40, heroH);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(40, heroH); ctx.lineTo(W-40, heroH); ctx.stroke();

      // ═══ AVATAR (overlapping hero/body) ══════════════════════════════
      const avatarCY = heroH, avatarR = 52;
      // White ring (background)
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 12;
      ctx.fillStyle = WHITE;
      ctx.beginPath(); ctx.arc(W/2, avatarCY, avatarR + 5, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      // Avatar clip
      ctx.save();
      ctx.beginPath(); ctx.arc(W/2, avatarCY, avatarR, 0, Math.PI*2); ctx.clip();
      if (avatarImg) {
        ctx.drawImage(avatarImg, W/2 - avatarR, avatarCY - avatarR, avatarR*2, avatarR*2);
      } else {
        // Initials fallback
        const avBg = ctx.createLinearGradient(W/2-avatarR, avatarCY-avatarR, W/2+avatarR, avatarCY+avatarR);
        avBg.addColorStop(0, INDIGO_LT); avBg.addColorStop(1, INDIGO);
        ctx.fillStyle = avBg; ctx.fillRect(W/2-avatarR, avatarCY-avatarR, avatarR*2, avatarR*2);
        ctx.fillStyle = GOLD; ctx.font = `bold ${avatarR * 0.75}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(initials, W/2, avatarCY); ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();
      // Gold ring around avatar
      ctx.save();
      ctx.strokeStyle = makeGold(W/2-avatarR, avatarCY, W/2+avatarR, avatarCY);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(W/2, avatarCY, avatarR + 2, 0, Math.PI*2); ctx.stroke();
      ctx.restore();

      // ═══ ADVISOR INFO (below avatar) ═════════════════════════════════
      const nameY = avatarCY + avatarR + 30;
      ctx.font = 'bold 24px Arial'; ctx.fillStyle = NAVY;
      ctx.textAlign = 'center'; ctx.fillText(advisorName, W/2, nameY);
      // Gold underline
      const nw = ctx.measureText(advisorName).width;
      ctx.strokeStyle = makeGold(W/2 - nw/2, 0, W/2 + nw/2, 0);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W/2-nw/2, nameY+6); ctx.lineTo(W/2+nw/2, nameY+6); ctx.stroke();

      // Location
      if (location) {
        ctx.font = '13px Arial'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'center';
        ctx.fillText(`📍 ${location}`, W/2, nameY + 26);
      }

      // Divider
      const divY = nameY + (location ? 46 : 26);
      ctx.strokeStyle = makeGold(60, divY, W-60, divY);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, divY); ctx.lineTo(W-60, divY); ctx.stroke();

      // ═══ QR SECTION ══════════════════════════════════════════════════
      // "SCAN QR TO CONNECT" label
      const scanY = divY + 22;
      ctx.font = 'bold 10px Arial'; ctx.fillStyle = INDIGO; ctx.textAlign = 'center';
      ctx.fillText('SCAN QR CODE TO VIEW MY PROFILE', W/2, scanY);
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.arc(W/2, scanY + 7, 2, 0, Math.PI*2); ctx.fill();

      // QR box
      const qrSize = 210, qrPad = 14, qrBoxW = qrSize + qrPad*2;
      const qrBoxX = (W - qrBoxW) / 2, qrBoxY = scanY + 18;
      ctx.save();
      ctx.shadowColor = 'rgba(212,175,55,0.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
      ctx.fillStyle = WHITE;
      ctx.strokeStyle = makeGold(qrBoxX, qrBoxY, qrBoxX+qrBoxW, qrBoxY+qrBoxW);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxW, 14);
      ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.drawImage(qrImg, qrBoxX+qrPad, qrBoxY+qrPad, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);

      // Verified pill
      const pillY = qrBoxY + qrBoxW + 18;
      const pillW = 180, pillH = 26, pillX = (W-pillW)/2;
      ctx.fillStyle = makeGold(pillX, pillY, pillX+pillW, pillY+pillH);
      ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 13); ctx.fill();
      ctx.font = 'bold 10px Arial'; ctx.fillStyle = '#1e1b4b'; ctx.textAlign = 'center';
      ctx.fillText('✓  VERIFIED BY BROKERSAAB', W/2, pillY + 17);

      // Profile URL
      ctx.font = '8.5px Arial'; ctx.fillStyle = '#94a3b8';
      ctx.fillText(profileUrl, W/2, pillY + 44);

      // ═══ FOOTER ══════════════════════════════════════════════════════
      const footerY = H - 50;
      ctx.strokeStyle = makeGold(40, footerY, W-40, footerY);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, footerY); ctx.lineTo(W-40, footerY); ctx.stroke();
      ctx.font = 'bold 12px Arial'; ctx.fillStyle = INDIGO; ctx.textAlign = 'center';
      ctx.fillText('brokersaab.com', W/2, H - 28);
      ctx.font = '8px Arial'; ctx.fillStyle = '#94a3b8';
      ctx.fillText('TRUSTED ADVISORY PLATFORM', W/2, H - 13);

      // ── Canvas → PDF ──────────────────────────────────────────────────
      const imgData = canvas.toDataURL('image/jpeg', 0.97);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 595, 842);
      pdf.save(`BrokerSaab-${advisorName.replace(/\s+/g, '_')}-QR-Card.pdf`);
    } catch (e) {
      console.error('PDF generation failed', e);
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const socket = ioClient(WS_URL, { transports: ['websocket'], autoConnect: true });
    socket.on('connect', () => socket.emit('join_advisor_room', user.id));
    socket.on('quote_requested', () => { fetchQuoteRequests(); fetchUnreadCount(); });
    socket.on('quote_viewed',    () => { fetchQuoteRequests(); });
    socket.on('quote_accepted',  () => { fetchQuoteRequests(); fetchTickets(); setShowTickets(true); });
    socket.on('ticket_created',  () => { fetchTickets(); setShowTickets(true); });
    socket.on('ticket_closed',   () => { fetchTickets(); });
    socket.on('ticket_updated',  () => { fetchTickets(); });
    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  const fetchSubscriptionValidity = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/subscriptions/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSubValidity(data);
    } catch { /* ignore */ }
  };

  const handleUpgradePay = async (plan: 'REGULAR' | 'AUTHORIZED') => {
    setUpgradeError('');
    setUpgradePaying(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) { setUpgradeError('Session expired. Please log in again.'); setUpgradePaying(false); return; }

      const orderRes = await fetch(`${API}/subscriptions/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setUpgradeError(orderData.message || 'Could not initiate payment'); setUpgradePaying(false); return; }

      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Payment gateway unavailable'));
        document.body.appendChild(s);
      });

      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'BrokerSaab',
        description: orderData.planLabel,
        order_id: orderData.orderId,
        theme: { color: plan === 'AUTHORIZED' ? '#4F46E5' : '#D4AF37' },
        prefill: { name: user?.fullName ?? '', contact: user?.phoneNumber ?? '' },
        notes: { purpose: 'ADVISOR_SUBSCRIPTION', plan },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API}/subscriptions/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpayOrderId: orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const vd = await verifyRes.json();
            if (vd.success) {
              setUpgradeSuccess({ plan: vd.plan, expiresAt: vd.expiresAt });
              fetchSubscriptionValidity();
            } else {
              setUpgradeError(vd.message || 'Payment verification failed');
            }
          } catch { setUpgradeError('Verification error. Please contact support.'); }
          finally { setUpgradePaying(false); }
        },
        modal: { ondismiss: () => setUpgradePaying(false) },
      });
      rzp.open();
    } catch (e: any) { setUpgradeError(e.message || 'Payment failed.'); setUpgradePaying(false); }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBookings(data.success ? data.data : DEMO_BOOKINGS);
    } catch { setBookings(DEMO_BOOKINGS); }
    finally { setLoading(false); }
  };

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    setUpdating(bookingId + status);
    try {
      const token = sessionStorage.getItem('accessToken');
      await fetch(`${API}/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch { setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b)); }
    finally { setUpdating(null); }
  };

  const openEditQuote = (q: AdvisorQuote) => {
    setSelectedRequest({
      id: q.id,
      status: q.status,
      categorySlug: q.categorySlug,
      clientMessage: q.clientMessage,
      createdAt: q.createdAt,
      client: q.client,
      existingLineItems: q.lineItems?.map(li => ({ description: li.description, amount: li.amount })),
      existingNote: q.advisorNote,
      existingTotalAmount: q.totalAmount,
    });
    setIsProactive(false);
    setShowQuotePanel(true);
  };

  const openProactiveQuote = (client: ConnectedClient) => {
    setSelectedRequest({
      id: 'proactive',
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
      client: { id: client.user.id, fullName: client.user.fullName, phoneNumber: client.user.phoneNumber },
    });
    setIsProactive(true);
    setShowQuotePanel(true);
    setShowConnectedClients(false);
  };

  const filtered     = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
  const counts       = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const quoteCounts  = quoteRequests.reduce((acc, q) => { acc[q.status] = (acc[q.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  const TICKET_STATUS_COLOR: Record<string, string> = {
    OPEN:              'bg-blue-50 text-blue-700 border border-blue-200',
    IN_PROGRESS:       'bg-amber-50 text-amber-700 border border-amber-200',
    AWAITING_CONFIRM:  'bg-purple-50 text-purple-700 border border-purple-200',
    DISPUTED:          'bg-red-50 text-red-700 border border-red-200',
    CLOSED:            'bg-gray-50 text-gray-600 border border-gray-200',
    PAYOUT_RELEASED:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  return (
    <>
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-navy-800 rounded-lg overflow-hidden p-1 shrink-0">
              <img src="/logo-icon.png" alt="BrokerSaab" className="w-full h-full object-contain" />
            </div>
            <span className="text-navy-800 font-black text-base tracking-tight hidden sm:block">
              Broker<span style={{ color: '#D4AF37' }}>Saab</span>
            </span>
          </Link>
          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <LayoutDashboard size={15} style={{ color: '#D4AF37' }} />
              Advisor Dashboard
            </h1>
            <p className="text-slate-500 text-xs">{user?.fullName}</p>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <LiveClock className="text-[11px] text-slate-400 hidden sm:flex" />
            {/* Tickets badge */}
            <button onClick={() => { setShowTickets(v => !v); if (!showTickets) fetchTickets(); }}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showTickets
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
              }`}>
              <Ticket size={13} /> Tickets
              {tickets.filter(t => t.status === 'OPEN' || t.status === 'AWAITING_CONFIRM').length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-emerald-500">
                  {tickets.filter(t => t.status === 'OPEN' || t.status === 'AWAITING_CONFIRM').length}
                </span>
              )}
            </button>

            {/* Connected clients */}
            <button onClick={() => { setShowConnectedClients(v => !v); if (!showConnectedClients) fetchConnectedClients(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showConnectedClients
                  ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              <Users size={13} /> Clients
              {connectedClients.length > 0 && (
                <span className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  showConnectedClients ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {connectedClients.length}
                </span>
              )}
            </button>

            {/* Quote requests badge */}
            <button onClick={() => { setShowQuoteList(v => !v); fetchQuoteRequests(); fetchUnreadCount(); }}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showQuoteList
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
              }`}>
              <FileText size={13} /> Quotes
              {unreadQuoteCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white animate-pulse"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)' }}>
                  {unreadQuoteCount > 9 ? '9+' : unreadQuoteCount}
                </span>
              )}
            </button>

            <Link href="/advisor/profile"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
              <Camera size={13} /> Edit Profile
            </Link>
            <button onClick={() => { setShowQR(true); if (!advisorPublicId) fetchAdvisorPublicId(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all"
              title="View My QR Code">
              <QrCode size={13} /> QR Code
            </button>
            <button onClick={() => setShowCalculator(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
              title="Fee breakdown calculator">
              <Calculator size={13} /> Fee Calc
            </button>
            <Link href="/advisor/services" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all">
              <Layers size={13} /> Services
            </Link>
            <button onClick={fetchBookings} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Subscription / trial status */}
        {subValidity && subValidity.status === 'ACTIVE' && (
          <div className="mb-4 p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <BadgeCheck size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-700">
                  {subValidity.planType === 'AUTHORIZED' ? 'Authorized Plan' : 'Regular Plan'} — Active
                </p>
                <p className="text-xs text-slate-500">
                  Valid until {subValidity.subscriptionValidUntil
                    ? new Date(subValidity.subscriptionValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                  <span className="ml-2 text-amber-700 font-semibold">{subValidity.daysLeft} days left</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {subValidity && subValidity.status === 'TRIAL' && (
          <div className="mb-4 p-4 rounded-2xl border border-indigo-200 bg-indigo-50 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-black text-indigo-700">Free Trial — {subValidity.trialDaysLeft} days remaining</p>
                <p className="text-xs text-slate-500">
                  Pay now to get <strong>1.5 years</strong> validity ·
                  Trial ends {subValidity.trialEndDate
                    ? new Date(subValidity.trialEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setUpgradeError(''); setUpgradeSuccess(null); setShowUpgradeModal(true); }}
              className="px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: '#fff' }}>
              Upgrade Plan
            </button>
          </div>
        )}

        {subValidity && subValidity.status === 'EXPIRED' && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-black text-red-700">Subscription Expired</p>
                <p className="text-xs text-slate-500">Choose a plan to restore full platform access</p>
              </div>
            </div>
            <button
              onClick={() => { setUpgradeError(''); setUpgradeSuccess(null); setShowUpgradeModal(true); }}
              className="px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
              Upgrade Plan
            </button>
          </div>
        )}

        {/* ── Wallet / Earnings card ── */}
        {walletData && (
          <div className="mb-5 bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100"
              style={{ background: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)' }}>
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-600" />
                <h3 className="text-sm font-black text-slate-800">Earnings &amp; Wallet</h3>
              </div>
              <button
                onClick={() => setShowWalletPanel(v => !v)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                {showWalletPanel ? 'Hide' : 'View History'}
              </button>
            </div>

            <div className="px-5 py-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] text-slate-500 mb-1">Wallet Balance</p>
                <p className="text-xl font-black text-emerald-700">
                  ₹{walletData.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-1">Total Earned</p>
                <p className="text-xl font-black text-slate-800">
                  ₹{walletData.totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center">
                <button
                  onClick={() => { setWithdrawError(''); setWithdrawSuccess(false); setShowWithdrawModal(true); }}
                  disabled={walletData.walletBalance <= 0}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                  Withdraw Funds
                </button>
              </div>
            </div>

            {showWalletPanel && walletData.recentPayouts.length > 0 && (
              <div className="border-t border-slate-100">
                <div className="px-5 py-3 bg-slate-50">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Recent Transactions</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {walletData.recentPayouts.map((p: any) => (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        p.status === 'SUCCESS' ? 'bg-emerald-500' :
                        p.status === 'PENDING' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          {p.bankAccount === 'WALLET_CREDIT'
                            ? `Ticket payment — ${p.ticket?.ticketNumber ?? 'N/A'}`
                            : `Withdrawal to ${p.bankAccount.split('|')[0]?.trim() ?? p.bankAccount}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-700">+₹{Number(p.netAmount).toLocaleString('en-IN')}</p>
                        {Number(p.commission) > 0 && (
                          <p className="text-[10px] text-slate-400">Fees ₹{Number(p.commission).toLocaleString('en-IN')} deducted</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {walletData.pendingWithdrawals.filter((p: any) => p.bankAccount !== 'WALLET_CREDIT').length > 0 && (
              <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 flex items-center gap-2">
                <Clock size={13} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-semibold">
                  {walletData.pendingWithdrawals.filter((p: any) => p.bankAccount !== 'WALLET_CREDIT').length} withdrawal request(s) pending admin approval
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Service Tickets panel ── */}
        {showTickets && (
          <div className="mb-5 bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-emerald-50">
              <div className="flex items-center gap-2">
                <Ticket size={15} className="text-emerald-600" />
                <h3 className="text-sm font-black text-slate-800">Work Tickets</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {tickets.length} total
                </span>
              </div>
              <button onClick={() => setShowTickets(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle size={15} />
              </button>
            </div>

            {ticketsLoading ? (
              <div className="px-5 py-6 flex justify-center"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
            ) : tickets.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Ticket size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No work tickets yet</p>
                <p className="text-slate-400 text-xs mt-1">Tickets are created when clients pay for your quoted services.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {tickets.map((t: any) => (
                  <div key={t.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-slate-400">{t.ticketNumber}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TICKET_STATUS_COLOR[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                        {t.status === 'AWAITING_CONFIRM' && (
                          <span className="text-[10px] font-bold text-purple-600 animate-pulse">⏳ Confirm needed</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{t.client?.fullName}</p>
                      <p className="text-xs text-slate-500">₹{Number(t.totalAmount).toLocaleString('en-IN')} · {t.stages?.length ?? 0} stages</p>
                    </div>
                    <Link href={`/tickets/${t.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)' }}>
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Connected Clients panel ── */}
        {showConnectedClients && (
          <div className="mb-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-slate-600" />
                <h3 className="text-sm font-black text-slate-800">Connected Clients</h3>
                <p className="text-[11px] text-slate-500">Send proactive fee quotes</p>
              </div>
              <button onClick={() => setShowConnectedClients(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle size={15} />
              </button>
            </div>

            {connectedLoading ? (
              <div className="px-5 py-6 flex justify-center"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
            ) : connectedClients.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Users size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No connected clients yet</p>
                <p className="text-slate-400 text-xs mt-1">Clients who unlock your contact will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {connectedClients.map(c => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                      {c.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{c.user.fullName}</p>
                      <p className="text-[11px] text-slate-500">{c.user.phoneNumber}</p>
                      {c.openQuoteStatus && (
                        <span className="text-[10px] font-semibold text-indigo-600">Open quote: {c.openQuoteStatus}</span>
                      )}
                    </div>
                    <button
                      onClick={() => openProactiveQuote(c)}
                      disabled={!!c.openQuoteStatus}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: c.openQuoteStatus ? '#9ca3af' : 'linear-gradient(135deg,#4F46E5,#3730A3)' }}
                      title={c.openQuoteStatus ? 'Already has an open quote' : 'Send fee quote'}>
                      <Send size={11} /> {c.openQuoteStatus ? 'Quote Sent' : 'Send Quote'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Quote Requests panel ── */}
        {showQuoteList && (
          <div className="mb-5 bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100"
              style={{ background: 'linear-gradient(135deg,#f0f0ff,#fafaff)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <FileText size={15} className="text-indigo-500" />
                <h3 className="text-sm font-black text-slate-800">Quote Requests</h3>
                {unreadQuoteCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500 text-white animate-pulse">
                    {unreadQuoteCount} new
                  </span>
                )}
                {quoteStatusFilter && (
                  <button onClick={() => setQuoteStatusFilter(null)}
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-all">
                    {quoteStatusFilter} <XCircle size={9} />
                  </button>
                )}
              </div>
              <button onClick={() => { setShowQuoteList(false); setQuoteStatusFilter(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle size={15} />
              </button>
            </div>

            {quoteRequests.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Bell size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No quote requests yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(quoteStatusFilter ? quoteRequests.filter(q => q.status === quoteStatusFilter) : quoteRequests).length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <Bell size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No {quoteStatusFilter?.toLowerCase()} quotes</p>
                    <button onClick={() => setQuoteStatusFilter(null)} className="mt-2 text-xs text-indigo-500 hover:underline">Show all</button>
                  </div>
                )}
                {(quoteStatusFilter ? quoteRequests.filter(q => q.status === quoteStatusFilter) : quoteRequests).map(q => {
                  const isViewed = q.status === 'VIEWED';
                  const isQuoted = q.status === 'QUOTED';
                  const canEdit  = isViewed || isQuoted;
                  return (
                    <div key={q.id} className="px-5 py-4 flex items-center gap-4 hover:bg-indigo-50/30 transition-all">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                        <User size={14} className="text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{q.client.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {getCategoryName(q.categorySlug)} ·{' '}
                          {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {q.totalAmount && ` · ₹${parseFloat(q.totalAmount).toLocaleString('en-IN')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isViewed && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Eye size={9} /> SEEN
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          q.status === 'REQUESTED' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                          q.status === 'QUOTED'    ? 'text-blue-700 bg-blue-50 border-blue-200' :
                          q.status === 'VIEWED'    ? 'text-purple-700 bg-purple-50 border-purple-200' :
                          q.status === 'ACCEPTED'  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                                     'text-slate-500 bg-slate-50 border-slate-200'
                        }`}>{q.status}</span>
                        {q.status === 'REQUESTED' && (
                          <button
                            onClick={() => { setSelectedRequest({ id: q.id, status: q.status, categorySlug: q.categorySlug, clientMessage: q.clientMessage, createdAt: q.createdAt, client: q.client }); setIsProactive(false); setShowQuotePanel(true); }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)' }}>
                            Respond
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => openEditQuote(q)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all">
                            <Edit3 size={11} /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quote Request Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'New Requests', key: 'REQUESTED', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   hover: 'hover:border-amber-300 hover:shadow-amber-100' },
            { label: 'Quotes Sent',  key: 'QUOTED',    color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100',  hover: 'hover:border-indigo-300 hover:shadow-indigo-100' },
            { label: 'Quotes Won',   key: 'ACCEPTED',  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
          ].map(s => (
            <button key={s.key}
              onClick={() => {
                setShowQuoteList(true);
                setQuoteStatusFilter(s.key);
                fetchQuoteRequests();
              }}
              className={`${s.bg} border ${s.border} ${s.hover} rounded-xl p-3 text-center cursor-pointer hover:shadow-md active:scale-95 transition-all w-full`}>
              <p className={`text-xl font-extrabold ${s.color}`}>{quoteCounts[s.key] ?? 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">tap to view</p>
            </button>
          ))}
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Pending',   status: 'PENDING'   as BookingStatus, count: counts['PENDING']   ?? 0, color: 'text-amber-600',   hover: 'hover:border-amber-200 hover:shadow-amber-50' },
            { label: 'Accepted',  status: 'ACCEPTED'  as BookingStatus, count: counts['ACCEPTED']  ?? 0, color: 'text-blue-600',    hover: 'hover:border-blue-200 hover:shadow-blue-50' },
            { label: 'Completed', status: 'COMPLETED' as BookingStatus, count: counts['COMPLETED'] ?? 0, color: 'text-emerald-600', hover: 'hover:border-emerald-200 hover:shadow-emerald-50' },
            { label: 'Cancelled', status: 'CANCELLED' as BookingStatus, count: counts['CANCELLED'] ?? 0, color: 'text-red-600',     hover: 'hover:border-red-200 hover:shadow-red-50' },
          ].map(s => (
            <button key={s.label}
              onClick={() => {
                setFilter(s.status);
                setTimeout(() => bookingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
              className={`bg-white shadow-sm border border-slate-100 ${s.hover} rounded-xl p-4 text-center cursor-pointer hover:shadow-md active:scale-95 transition-all w-full`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-[9px] text-slate-400">bookings · tap to filter</p>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div ref={bookingsRef} className="flex gap-2 mb-5 flex-wrap">
          {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === f
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'text-slate-500 border-slate-200 bg-white hover:border-indigo-300'
              }`}>
              {f === 'ALL' ? 'All' : STATUS_STYLES[f].label}
              {f !== 'ALL' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 size={24} className="animate-spin mr-3" /> Loading bookings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <LayoutDashboard size={40} className="text-slate-300 mx-auto" />
            <p className="text-slate-500">No bookings in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const s = STATUS_STYLES[booking.status];
              const scheduledDate = new Date(booking.scheduledDate);
              const isUpdating = (status: string) => updating === booking.id + status;
              return (
                <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400 font-mono truncate">{booking.bookingNumber}</p>
                      <h3 className="font-bold text-slate-800 mt-0.5 flex items-center gap-2 truncate">
                        <User size={13} className="text-indigo-400 shrink-0" />
                        {booking.client?.fullName ?? 'Client'}
                      </h3>
                      {booking.client?.phoneNumber && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone size={10} className="shrink-0" /> {booking.client.phoneNumber}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-indigo-400/60" />
                      {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-indigo-400/60" />
                      {booking.startTime} – {booking.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={12} className="text-indigo-400/60" />
                      {booking.mode}
                    </span>
                    <span style={{ color: '#B48C22' }} className="font-bold">₹{booking.totalFee}</span>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 mb-4">"{booking.notes}"</p>
                  )}

                  <div className="flex gap-2 flex-wrap border-t border-slate-100 pt-3">
                    {booking.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(booking.id, 'ACCEPTED')} disabled={!!updating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
                          {isUpdating('ACCEPTED') ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Accept
                        </button>
                        <button onClick={() => updateStatus(booking.id, 'CANCELLED')} disabled={!!updating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-300 text-red-700 hover:bg-red-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
                          {isUpdating('CANCELLED') ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'ACCEPTED' && (
                      <button onClick={() => updateStatus(booking.id, 'COMPLETED')} disabled={!!updating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50">
                        {isUpdating('COMPLETED') ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                        Mark Completed
                      </button>
                    )}
                    {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
                      <span className="text-xs text-slate-500 py-2">
                        {booking.status === 'COMPLETED' ? '✓ Consultation closed' : '✗ Rejected/cancelled'}
                      </span>
                    )}
                    {booking.chatRoom?.id && booking.status !== 'CANCELLED' && (
                      <Link href={`/chat/${booking.chatRoom.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-all">
                        <MessageSquare size={12} /> Open Chat
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    <AdvisorFillQuotePanel
      request={selectedRequest}
      isOpen={showQuotePanel}
      proactive={isProactive}
      onClose={() => { setShowQuotePanel(false); setIsProactive(false); }}
      onSubmitted={(quoteId) => {
        fetchQuoteRequests();
        fetchUnreadCount();
        fetchConnectedClients();
        setUnreadQuoteCount(prev => Math.max(0, prev - 1));
        setShowQuotePanel(false);
        setIsProactive(false);
      }}
    />

    {/* Fee Calculator Modal */}
    <FeeCalculatorModal
      isOpen={showCalculator}
      onClose={() => setShowCalculator(false)}
      role="ADVISOR"
    />

    {/* QR Code Modal */}
    {showQR && (
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center overflow-y-auto sm:py-6"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        onClick={() => setShowQR(false)}>
        <div
          className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
          style={{
            background: 'linear-gradient(160deg,#0B1F3A 0%,#0F2B4A 50%,#0a1428 100%)',
            border: '1px solid rgba(212,175,55,0.3)',
            maxHeight: 'min(90vh, 760px)',
          }}
          onClick={e => e.stopPropagation()}>

          {/* Close */}
          <button onClick={() => setShowQR(false)}
            className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors z-10 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10">
            <X size={15} />
          </button>

          {/* Top gold stripe */}
          <div className="h-1 w-full shrink-0"
            style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC60,#D4AF37)' }} />

          {/* Header — logo + name + tagline on one compact row */}
          <div className="px-4 pt-3 pb-2.5 flex items-center gap-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
              <QrCode size={16} className="text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white leading-tight">Profile QR Code</p>
              <p className="text-[10px] text-white/40 truncate">Share with clients to view your profile</p>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 min-h-0">

            {/* ── Mini card preview ─────────────────────────────────────── */}
            <div className="mx-4 mt-3 rounded-xl overflow-hidden shadow-xl"
              style={{ border: '1px solid rgba(212,175,55,0.35)' }}>

              {/* Card hero (indigo) */}
              <div className="relative flex flex-col items-center pt-3 pb-6"
                style={{ background: 'linear-gradient(135deg,#4338ca,#312e81)' }}>
                {/* dot grid */}
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
                {/* logo + brand text */}
                <div className="flex items-center gap-1.5 z-10 mb-0.5">
                  <div className="w-4 h-4 rounded-md overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-icon.png" alt="logo" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  </div>
                  <span className="text-[11px] font-black text-white leading-none">
                    Broker<span style={{ color: '#F5D77A' }}>Saab</span>
                  </span>
                </div>
                <p className="text-[9px] font-bold tracking-widest z-10 text-center" style={{ color: '#F5D77A' }}>
                  TRUSTED ADVISORY PLATFORM
                </p>
              </div>

              {/* Avatar overlapping hero/body */}
              <div className="relative bg-white flex flex-col items-center pb-3 pt-0"
                style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="absolute -top-6 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full ring-[3px] ring-white shadow-lg overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#4338ca,#312e81)' }}>
                    {advisorProfile?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={advisorProfile.avatarUrl.startsWith('http')
                          ? advisorProfile.avatarUrl
                          : `${API.replace(/\/api\/v1\/?$/, '')}${advisorProfile.avatarUrl.startsWith('/') ? advisorProfile.avatarUrl : `/${advisorProfile.avatarUrl}`}`}
                        alt={user?.fullName || ''}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm font-black" style={{ color: '#D4AF37' }}>
                          {(user?.fullName || 'A').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advisor info */}
                <div className="mt-10 text-center px-3 w-full">
                  <p className="text-sm font-black text-slate-900 leading-tight truncate">{user?.fullName}</p>
                  {advisorProfile?.location && (
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-1">
                      📍 {advisorProfile.location}
                    </p>
                  )}
                  {/* Verified pill */}
                  <div className="flex justify-center mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: 'linear-gradient(90deg,#D4AF37,#B48C22)', color: '#1e1b4b' }}>
                      ✓ VERIFIED BY BROKERSAAB
                    </span>
                  </div>
                </div>

                {/* QR code */}
                <div className="mt-2 flex justify-center">
                  {advisorPublicId ? (
                    <div ref={qrSvgRef} className="p-1.5 bg-white rounded-lg shadow-md inline-block"
                      style={{ border: '1.5px solid rgba(212,175,55,0.4)' }}>
                      <QRCode
                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://brokersaab.com'}/advisors/${advisorPublicId}`}
                        size={110}
                        bgColor="#ffffff"
                        fgColor="#312e81"
                        level="M"
                      />
                    </div>
                  ) : (
                    <div className="w-[120px] h-[120px] rounded-lg flex items-center justify-center bg-slate-50">
                      <Loader2 size={20} className="animate-spin text-slate-300" />
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 tracking-widest mt-1.5 pb-0.5 text-center px-2">SCAN QR TO VIEW MY PROFILE</p>
              </div>

              {/* Card footer stripe */}
              <div className="h-0.5 w-full"
                style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC60,#D4AF37)' }} />
            </div>

            {/* ── URL + copy + download ──────────────────────────────── */}
            {advisorPublicId && (
              <div className="px-4 pt-2.5 pb-4 space-y-2">
                {/* URL row */}
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="flex-1 text-[9px] text-white/40 truncate font-mono">
                    {`${typeof window !== 'undefined' ? window.location.origin : 'https://brokersaab.com'}/advisors/${advisorPublicId}`}
                  </p>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/advisors/${advisorPublicId}`;
                      navigator.clipboard.writeText(url).then(() => {
                        setQrCopied(true);
                        setTimeout(() => setQrCopied(false), 2000);
                      });
                    }}
                    className="shrink-0 text-white/35 hover:text-amber-400 transition-colors">
                    {qrCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
                {qrCopied && <p className="text-[10px] text-emerald-400 text-center -mt-1">Link copied!</p>}

                {/* Download PDF */}
                <button
                  onClick={downloadQRPdf}
                  disabled={pdfLoading}
                  className="w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 4px 16px rgba(212,175,55,0.25)' }}>
                  {pdfLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Generating PDF…</>
                    : <><Download size={14} /> Download PDF Card</>
                  }
                </button>
                <p className="text-[9px] text-white/20 text-center">
                  A4 branded card · Share with clients
                </p>
              </div>
            )}
          </div>

          {/* Bottom gold stripe */}
          <div className="h-1 w-full shrink-0"
            style={{ background: 'linear-gradient(90deg,#D4AF37,#F0CC60,#D4AF37)' }} />
        </div>
      </div>
    )}

    {/* ── Upgrade Plan Modal ─────────────────────────────────────────────── */}
    {showUpgradeModal && (
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center overflow-y-auto sm:p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden flex flex-col my-auto"
          style={{ maxHeight: 'min(92vh, 820px)' }}>
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" />
              <p className="text-sm font-black text-slate-800">Upgrade Your Plan</p>
            </div>
            <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto min-h-0">
            {upgradeSuccess ? (
              /* Success state */
              <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.4)' }}>
                  <CheckCircle2 size={32} className="text-amber-500" />
                </div>
                <p className="text-lg font-black text-slate-800">
                  {upgradeSuccess.plan === 'AUTHORIZED' ? 'Authorized Plan' : 'Regular Plan'} Activated!
                </p>
                <p className="text-sm text-slate-500">
                  Valid until {new Date(upgradeSuccess.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {upgradeSuccess.plan === 'AUTHORIZED' && (
                  <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl px-3 py-2">Your Authorized Dealer badge is pending admin approval.</p>
                )}
                <button onClick={() => setShowUpgradeModal(false)}
                  className="mt-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 text-center">
                  {subValidity?.status === 'TRIAL'
                    ? `You're within 6 months → subscribing now gives you 1.5 years validity`
                    : `Trial expired → subscribing now gives you 1 year validity`}
                </p>

                {/* Two plan cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Regular Plan */}
                  <div className="rounded-2xl border-2 border-amber-300 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg,#fffbf0,#fef9e7)' }}>
                    <div className="px-3 py-2.5 text-center" style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                      <Crown size={14} className="text-white mx-auto mb-0.5" />
                      <p className="text-[11px] font-black text-white">Regular Plan</p>
                    </div>
                    <div className="px-3 py-3 flex-1 space-y-2">
                      <div className="text-center">
                        <p className="text-xl font-black text-gray-900">₹499</p>
                        <p className="text-[10px] text-gray-400 line-through">₹4,990 MRP</p>
                        <p className="text-[10px] font-bold text-amber-600">Total ₹588.82 (incl. GST)</p>
                      </div>
                      {['Full platform access', 'Bookings, quotes & escrow', 'Upgrade to Authorized anytime'].map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                          <p className="text-[11px] text-gray-700">{b}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 pb-3">
                      <button onClick={() => handleUpgradePay('REGULAR')} disabled={upgradePaying}
                        className="w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                        {upgradePaying ? <Loader2 size={13} className="animate-spin" /> : <><CreditCard size={12} /> Pay ₹588.82</>}
                      </button>
                    </div>
                  </div>

                  {/* Authorized Plan */}
                  <div className="rounded-2xl border-2 border-indigo-300 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg,#eef2ff,#f0f4ff)' }}>
                    <div className="px-3 py-2.5 text-center" style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)' }}>
                      <Award size={14} className="text-white mx-auto mb-0.5" />
                      <p className="text-[11px] font-black text-white">Get Authorized</p>
                    </div>
                    <div className="px-3 py-3 flex-1 space-y-2">
                      <div className="text-center">
                        <p className="text-xl font-black text-gray-900">₹1,999</p>
                        <p className="text-[10px] text-gray-400 line-through">₹19,999 MRP</p>
                        <p className="text-[10px] font-bold text-indigo-600">Total ₹2,358.82 (incl. GST)</p>
                      </div>
                      {['All Regular benefits', 'Authorized Dealer badge', 'Priority search placement', 'Trusted seal & certificate'].map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Star size={11} className="text-indigo-500 shrink-0" />
                          <p className="text-[11px] text-gray-700">{b}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 pb-3">
                      <button onClick={() => handleUpgradePay('AUTHORIZED')} disabled={upgradePaying}
                        className="w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: '#fff' }}>
                        {upgradePaying ? <Loader2 size={13} className="animate-spin" /> : <><Zap size={12} /> Pay ₹2,358.82</>}
                      </button>
                    </div>
                  </div>
                </div>

                {upgradeError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-700">Payment couldn&apos;t be started</p>
                      <p className="text-xs text-red-600 mt-0.5">{upgradeError}</p>
                    </div>
                    <button onClick={() => setUpgradeError('')} className="text-red-400 hover:text-red-600 shrink-0 p-0.5">
                      <X size={13} />
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <ShieldCheck size={10} /> Razorpay secured · 100% refund if profile rejected
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    {/* ── Withdraw Funds Modal ── */}
    {showWithdrawModal && (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <h2 className="text-base font-black text-slate-800">Withdraw Funds</h2>
            </div>
            <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {withdrawSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-800">Withdrawal Request Submitted!</p>
                <p className="text-xs text-slate-500 mt-1">Admin will process it within 2-3 business days.</p>
                <button
                  onClick={() => { setShowWithdrawModal(false); setWithdrawSuccess(false); }}
                  className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Available Balance</span>
                  <span className="text-base font-black text-emerald-700">
                    ₹{walletData?.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 block">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter amount to withdraw"
                    value={withdrawForm.amount}
                    onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 block">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="As per bank records"
                    value={withdrawForm.accountHolderName}
                    onChange={e => setWithdrawForm(f => ({ ...f, accountHolderName: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 block">Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={withdrawForm.bankAccount}
                    onChange={e => setWithdrawForm(f => ({ ...f, bankAccount: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 block">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={withdrawForm.ifscCode}
                    onChange={e => setWithdrawForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {withdrawError && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> {withdrawError}
                  </p>
                )}

                <p className="text-[10px] text-slate-400">
                  Gateway (1.5%) and platform fees (1% above ₹5,000) are deducted from earnings. Withdrawals are processed within 2-3 business days.
                </p>

                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="w-full px-4 py-3 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                  {withdrawing ? <><Loader2 size={15} className="animate-spin" /> Processing…</> : 'Submit Withdrawal Request'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
