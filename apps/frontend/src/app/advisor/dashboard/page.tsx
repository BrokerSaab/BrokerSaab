'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, User, AlertCircle, Loader2, ArrowLeft,
  CheckCircle2, XCircle, ShieldCheck, RefreshCw, LayoutDashboard,
  Phone, MessageSquare, BadgeCheck, Camera, Layers, FileText, Bell,
  Eye, Edit3, Send, Users, Ticket, QrCode, Copy, Check, X, Download
} from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = require('react-qr-code').default as React.ComponentType<{ value: string; size?: number; bgColor?: string; fgColor?: string; level?: string }>;
import { useAuth } from '@/contexts/AuthContext';
import AdvisorFillQuotePanel, { QuoteRequest } from '@/components/AdvisorFillQuotePanel';
import { io as ioClient } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com');

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
  const [subValidity, setSubValidity] = useState<{ isActive: boolean; expiresAt: string | null; daysLeft: number } | null>(null);

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
  const [advisorPublicId, setAdvisorPublicId] = useState<string | null>(null);
  const [qrCopied,       setQrCopied]       = useState(false);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const qrSvgRef     = useRef<HTMLDivElement>(null);
  const bookingsRef  = useRef<HTMLDivElement>(null);

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
      if (data.success && data.data?.id) setAdvisorPublicId(data.data.id);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) { router.push('/auth/admin'); return; }
    if (user?.role !== 'ADVISOR') { router.push('/'); return; }
    fetchBookings();
    fetchSubscriptionValidity();
    fetchQuoteRequests();
    fetchUnreadCount();
    fetchConnectedClients();
    fetchTickets();
    fetchAdvisorPublicId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn, user]);

  const downloadQRPdf = async () => {
    if (!advisorPublicId || !qrSvgRef.current) return;
    setPdfLoading(true);
    try {
      const profileUrl  = `${window.location.origin}/advisors/${advisorPublicId}`;
      const advisorName = user?.fullName || 'Advisor';

      // ── 1. QR SVG → image ──────────────────────────────────────────────
      const svgEl = qrSvgRef.current.querySelector('svg');
      if (!svgEl) return;
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl  = URL.createObjectURL(svgBlob);
      const qrImg   = await new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = svgUrl;
      });

      // ── 2. Logo ────────────────────────────────────────────────────────
      const logoImg = await new Promise<HTMLImageElement | null>(res => {
        const img = new Image();
        img.onload = () => res(img); img.onerror = () => res(null); img.src = '/logo-icon.png';
      });

      // ── 3. Canvas — A4 @ 2× for crisp text ────────────────────────────
      const W = 595, H = 842;
      const canvas = document.createElement('canvas');
      canvas.width  = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);

      // Colour palette
      const navy    = '#0B1F3A';
      const navyDk  = '#071526';
      const gold    = '#D4AF37';
      const goldLt  = '#F0CC60';
      const indigoBl = '#4B6CB7';  // steel-blue matching brand tagline colour

      // ══════════════════════════════════════════════════════════════════
      // SECTION 1 — HERO  (0 → 210)  dark navy, logo + name + tagline
      // ══════════════════════════════════════════════════════════════════
      const heroH = 210;

      // Background gradient
      const heroBg = ctx.createLinearGradient(0, 0, 0, heroH);
      heroBg.addColorStop(0, navy);
      heroBg.addColorStop(1, '#0d2240');
      ctx.fillStyle = heroBg;
      ctx.fillRect(0, 0, W, heroH);

      // Subtle dot-grid overlay
      ctx.globalAlpha = 0.055;
      ctx.fillStyle = '#ffffff';
      for (let gx = 20; gx < W; gx += 26) {
        for (let gy = 20; gy < heroH; gy += 26) {
          ctx.beginPath(); ctx.arc(gx, gy, 0.9, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Gold top stripe (6px)
      const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
      goldGrad.addColorStop(0, gold); goldGrad.addColorStop(0.5, goldLt); goldGrad.addColorStop(1, gold);
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, 0, W, 6);

      // Indigo left / right side bars (full height)
      ctx.fillStyle = indigoBl;
      ctx.fillRect(0, 6, 5, H - 12);
      ctx.fillRect(W - 5, 6, 5, H - 12);

      // Logo + brand name row — centred in hero
      const logoSz  = 56;
      const brandFs = 36;
      ctx.font = `bold ${brandFs}px Arial, sans-serif`;
      const brokerW = ctx.measureText('Broker').width;
      const saabW   = ctx.measureText('Saab').width;
      const gap     = 18;
      const rowW    = logoSz + gap + brokerW + saabW;
      const rowX    = (W - rowW) / 2;
      const rowCY   = heroH / 2 - 14;   // centre slightly above middle to leave room for tagline

      // Logo: white rounded-rect background then image
      if (logoImg) {
        ctx.save();
        ctx.shadowColor = 'rgba(212,175,55,0.4)';
        ctx.shadowBlur  = 16;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(rowX, rowCY - logoSz / 2, logoSz, logoSz, 14);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(rowX, rowCY - logoSz / 2, logoSz, logoSz, 14);
        ctx.clip();
        ctx.drawImage(logoImg, rowX, rowCY - logoSz / 2, logoSz, logoSz);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.roundRect(rowX, rowCY - logoSz / 2, logoSz, logoSz, 14);
        ctx.fill();
        ctx.restore();
        ctx.font = `bold 24px Arial`;
        ctx.fillStyle = navy;
        ctx.textAlign = 'center';
        ctx.fillText('B', rowX + logoSz / 2, rowCY + 9);
      }

      // "Broker" in white, "Saab" in gold — on same baseline
      const textX  = rowX + logoSz + gap;
      const textBY = rowCY + brandFs * 0.36;  // baseline offset ≈ 36% of font size
      ctx.font = `bold ${brandFs}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Broker', textX, textBY);
      ctx.fillStyle = gold;
      ctx.fillText('Saab', textX + brokerW, textBY);

      // Tagline — "TRUSTED ADVISORY PLATFORM" in steel-blue, uppercase, letter-spaced
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillStyle = '#7BAFD4';   // light steel-blue matching screenshot
      ctx.textAlign = 'center';
      // Simulate letter-spacing by manual offset
      const tagText = 'TRUSTED ADVISORY PLATFORM';
      const tagSpacing = 3.5;
      ctx.font = 'bold 12.5px Arial, sans-serif';
      let tagX = W / 2 - (ctx.measureText(tagText).width + tagSpacing * (tagText.length - 1)) / 2;
      const tagY = rowCY + logoSz / 2 + 24;
      for (const ch of tagText) {
        ctx.fillText(ch, tagX, tagY);
        tagX += ctx.measureText(ch).width + tagSpacing;
      }

      // Hero bottom gold line
      const divY1 = heroH - 0.5;
      const dg1 = ctx.createLinearGradient(30, divY1, W - 30, divY1);
      dg1.addColorStop(0, 'transparent'); dg1.addColorStop(0.15, gold);
      dg1.addColorStop(0.85, gold);       dg1.addColorStop(1, 'transparent');
      ctx.strokeStyle = dg1; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(30, divY1); ctx.lineTo(W - 30, divY1); ctx.stroke();

      // ══════════════════════════════════════════════════════════════════
      // SECTION 2 — QR CODE  (210 → 660)  pure white background
      // ══════════════════════════════════════════════════════════════════
      const qrSecY = heroH;
      const qrSecH = 450;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, qrSecY, W, qrSecH);

      // "SCAN QR TO VIEW MY PROFILE" — dark navy, clearly visible on white
      ctx.font = 'bold 11.5px Arial, sans-serif';
      ctx.fillStyle = '#1E3A5F';
      ctx.textAlign = 'center';
      let labelX = W / 2 - (ctx.measureText('SCAN QR TO VIEW MY PROFILE').width + 3 * 26) / 2;
      const labelY = qrSecY + 38;
      const labelText = 'SCAN QR TO VIEW MY PROFILE';
      const labelSp   = 3.2;
      labelX = W / 2 - (ctx.measureText(labelText).width + labelSp * (labelText.length - 1)) / 2;
      for (const ch of labelText) {
        ctx.fillStyle = '#1E3A5F';
        ctx.fillText(ch, labelX, labelY);
        labelX += ctx.measureText(ch).width + labelSp;
      }

      // Thin indigo underline beneath label
      const luW = 180;
      ctx.strokeStyle = indigoBl;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - luW / 2, labelY + 7);
      ctx.lineTo(W / 2 + luW / 2, labelY + 7);
      ctx.stroke();

      // QR code — light border card on white
      const qrSize = 270;
      const qrPad  = 16;
      const qrCW   = qrSize + qrPad * 2;
      const qrCX   = (W - qrCW) / 2;
      const qrCY   = qrSecY + 60;

      // Card: very light shadow + thin border visible on white background
      ctx.save();
      ctx.shadowColor = 'rgba(11,31,58,0.12)';
      ctx.shadowBlur  = 22;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#E5EAF0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(qrCX, qrCY, qrCW, qrCW, 20);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // QR image drawn sharply inside card
      ctx.drawImage(qrImg, qrCX + qrPad, qrCY + qrPad, qrSize, qrSize);
      URL.revokeObjectURL(svgUrl);

      // Advisor name below QR — dark navy, large, clearly visible
      const nameY = qrCY + qrCW + 34;
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillStyle = '#0B1F3A';
      ctx.textAlign = 'center';
      ctx.fillText(advisorName, W / 2, nameY);

      // Gold underline under name
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2.5;
      const nw = ctx.measureText(advisorName).width;
      ctx.beginPath();
      ctx.moveTo(W / 2 - nw / 2, nameY + 7);
      ctx.lineTo(W / 2 + nw / 2, nameY + 7);
      ctx.stroke();

      // "Certified Financial Advisor" subtitle — indigo blue, clearly visible
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = indigoBl;
      ctx.fillText('Certified Financial Advisor  ·  BrokerSaab', W / 2, nameY + 32);

      // Profile URL — medium gray, clearly readable
      ctx.font = '10.5px Arial, sans-serif';
      ctx.fillStyle = '#7B8EA8';
      ctx.fillText(profileUrl, W / 2, nameY + 56);

      // Thin indigo line separating QR section from footer
      const divY2 = qrSecY + qrSecH - 0.5;
      const dg2 = ctx.createLinearGradient(30, divY2, W - 30, divY2);
      dg2.addColorStop(0, 'transparent'); dg2.addColorStop(0.15, indigoBl + 'aa');
      dg2.addColorStop(0.85, indigoBl + 'aa'); dg2.addColorStop(1, 'transparent');
      ctx.strokeStyle = dg2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(30, divY2); ctx.lineTo(W - 30, divY2); ctx.stroke();

      // ══════════════════════════════════════════════════════════════════
      // SECTION 3 — FOOTER  (660 → 842)  dark navy
      // ══════════════════════════════════════════════════════════════════
      const footerY = qrSecY + qrSecH;
      const footerH = H - footerY;

      const footBg = ctx.createLinearGradient(0, footerY, 0, H);
      footBg.addColorStop(0, '#0d2240');
      footBg.addColorStop(1, navyDk);
      ctx.fillStyle = footBg;
      ctx.fillRect(0, footerY, W, footerH);

      // "Verified by BrokerSaab" with dot separators — gold, clearly visible
      const vY = footerY + footerH * 0.42;
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillStyle = gold;
      ctx.textAlign = 'center';
      ctx.fillText('✦  Verified by BrokerSaab  ✦', W / 2, vY);

      // Website
      ctx.font = '11px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('brokersaab.in  ·  Trusted Advisory Platform', W / 2, vY + 26);

      // Gold bottom stripe (6px)
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, H - 6, W, 6);

      // Corner golden dots
      const dr = 4, dp2 = 16;
      ctx.fillStyle = gold;
      [[dp2, dp2],[W - dp2, dp2],[dp2, H - dp2],[W - dp2, H - dp2]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.arc(cx, cy, dr, 0, Math.PI * 2); ctx.fill();
      });

      // ══════════════════════════════════════════════════════════════════
      // WATERMARK — diagonal 3D repeating "BrokerSaab" (barely visible)
      // ══════════════════════════════════════════════════════════════════
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 4);   // 45° diagonal

      const wmFont = 'bold 22px Arial, sans-serif';
      const wmText = 'BrokerSaab';
      ctx.font = wmFont;
      const wmW = ctx.measureText(wmText).width + 60;  // spacing between repeats
      const wmH = 80;                                    // row spacing
      const cols = Math.ceil((W + H) / wmW) + 2;
      const rows = Math.ceil((W + H) / wmH) + 2;
      const startX = -cols * wmW / 2;
      const startY = -rows * wmH / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = startX + c * wmW;
          const wy = startY + r * wmH;

          // 3D shadow layer — offset 2px, very dark navy
          ctx.globalAlpha = 0.022;
          ctx.fillStyle = '#000000';
          ctx.font = wmFont;
          ctx.textAlign = 'left';
          ctx.fillText(wmText, wx + 2, wy + 2);

          // Main watermark text — very light navy
          ctx.globalAlpha = 0.032;
          ctx.fillStyle = navy;
          ctx.fillText(wmText, wx, wy);
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      // ── 4. Canvas → PDF ────────────────────────────────────────────────
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 595, 842);
      pdf.save(`BrokerSaab-QR-${advisorName.replace(/\s+/g, '_')}.pdf`);
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
            {/* Tickets badge */}
            <button onClick={() => { setShowTickets(v => !v); if (!showTickets) fetchTickets(); }}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-all">
              <Ticket size={13} /> Tickets
              {tickets.filter(t => t.status === 'OPEN' || t.status === 'AWAITING_CONFIRM').length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-emerald-500">
                  {tickets.filter(t => t.status === 'OPEN' || t.status === 'AWAITING_CONFIRM').length}
                </span>
              )}
            </button>

            {/* Connected clients */}
            <button onClick={() => { setShowConnectedClients(v => !v); if (!showConnectedClients) fetchConnectedClients(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
              <Users size={13} /> Clients
              {connectedClients.length > 0 && (
                <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {connectedClients.length}
                </span>
              )}
            </button>

            {/* Quote requests badge */}
            <button onClick={() => { setShowQuoteList(v => !v); fetchQuoteRequests(); fetchUnreadCount(); }}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all">
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
            <button onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all"
              title="View My QR Code">
              <QrCode size={13} /> QR Code
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

        {/* Subscription validity */}
        {subValidity && (
          subValidity.isActive ? (
            <div className="mb-4 p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <BadgeCheck size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-700">Authorized Badge Active</p>
                  <p className="text-xs text-slate-500">
                    Expires {new Date(subValidity.expiresAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <span className="ml-2 text-amber-700 font-semibold">{subValidity.daysLeft} days left</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-black text-red-700">Authorized Badge Expired</p>
                  <p className="text-xs text-slate-500">Renew to keep your badge visible to clients</p>
                </div>
              </div>
              <Link href="/advisor/badge"
                className="px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
                Get Badge
              </Link>
            </div>
          )
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
                          {q.categorySlug?.toUpperCase() ?? 'General'} ·{' '}
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
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-mono">{booking.bookingNumber}</p>
                      <h3 className="font-bold text-slate-800 mt-0.5 flex items-center gap-2">
                        <User size={13} className="text-indigo-400" />
                        {booking.client?.fullName ?? 'Client'}
                      </h3>
                      {booking.client?.phoneNumber && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone size={10} /> {booking.client.phoneNumber}
                        </p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
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

    {/* QR Code Modal — compact to fit 13" laptop screen */}
    {showQR && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-3"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={() => setShowQR(false)}>
        <div
          className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(160deg,#0B1F3A 0%,#0F2B4A 50%,#0a1428 100%)',
            border: '1px solid rgba(212,175,55,0.3)',
            maxHeight: 'calc(100vh - 24px)',
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
          <div className="px-5 pt-4 pb-3 flex items-center gap-3 shrink-0"
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

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            {/* Advisor name */}
            <div className="px-5 pt-3 pb-1 text-center">
              <p className="text-xs font-bold text-amber-400 truncate">{user?.fullName}</p>
            </div>

            {/* QR code */}
            <div className="flex justify-center px-5 py-3">
              {advisorPublicId ? (
                <div ref={qrSvgRef} className="p-3 bg-white rounded-xl shadow-lg inline-block">
                  <QRCode
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://frontend-tellar.vercel.app'}/advisors/${advisorPublicId}`}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#0B1F3A"
                    level="M"
                  />
                </div>
              ) : (
                <div className="w-[184px] h-[184px] rounded-xl flex items-center justify-center bg-white/5">
                  <Loader2 size={22} className="animate-spin text-white/30" />
                </div>
              )}
            </div>

            <p className="text-[10px] text-white/35 text-center tracking-widest mb-3">
              SCAN TO VIEW MY PROFILE
            </p>

            {/* URL + copy + download */}
            {advisorPublicId && (
              <div className="px-5 pb-5 space-y-2.5">
                {/* URL row */}
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="flex-1 text-[9px] text-white/40 truncate font-mono">
                    {`${typeof window !== 'undefined' ? window.location.origin : 'https://frontend-tellar.vercel.app'}/advisors/${advisorPublicId}`}
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
                    ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                    : <><Download size={14} /> Download Branded PDF Card</>
                  }
                </button>
                <p className="text-[9px] text-white/20 text-center">
                  Professional card · Share with clients
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
    </>
  );
}
