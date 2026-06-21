'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Loader2, CheckCircle2, Copy, Check, Download, Phone, Mail, Award } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// GST constants (display-only)
const ORIGINAL_PRICE = 999;
const BASE_PRICE     = 99;
const DISCOUNT_AMT   = ORIGINAL_PRICE - BASE_PRICE;  // 900
const CGST_AMT       = Math.round(BASE_PRICE * 0.09 * 100) / 100;  // 8.91
const SGST_AMT       = Math.round(BASE_PRICE * 0.09 * 100) / 100;  // 8.91
const TOTAL_PAYABLE  = BASE_PRICE + CGST_AMT + SGST_AMT;            // 116.82

interface Props {
  advisorId: string;
  advisorName: string;
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (phone: string, email: string, creditsRemaining: number) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded hover:bg-white/10 transition-colors">
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400 hover:text-white" />}
    </button>
  );
}

export default function ContactUnlockModal({ advisorId, advisorName, isOpen, onClose, onUnlockSuccess }: Props) {
  const [step, setStep]                   = useState<'offer' | 'success'>('offer');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [revealedContact, setRevealed]    = useState<{ phone: string; email: string } | null>(null);
  const [creditsLeft, setCreditsLeft]     = useState(0);
  const [invoiceData, setInvoiceData]     = useState<{
    invoiceNo: string; paymentId: string; orderId: string; paidAt: Date;
  } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('offer');
    setError('');
    onClose();
  };

  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePay = async () => {
    setLoading(true); setError('');
    try {
      const token = sessionStorage.getItem('accessToken') || '';
      const user  = JSON.parse(sessionStorage.getItem('user') || '{}');

      // 1. Create order
      const orderRes  = await fetch(`${API}/contacts/create-order`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.message || 'Could not initiate payment'); setLoading(false); return; }

      // 2. Load Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) { setError('Payment gateway unavailable. Please try again.'); setLoading(false); return; }

      // 3. Open Razorpay
      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'BrokerSaab',
        description: 'Contact Unlock Pack — 20 Contacts · 1 Year',
        order_id: orderData.orderId,
        theme: { color: '#D4AF37' },
        prefill: { name: user.fullName || '', contact: user.phoneNumber || '' },
        notes: { purpose: 'CONTACT_UNLOCK_PACK' },
        handler: async (response: any) => {
          try {
            // 4. Verify payment
            const vRes  = await fetch(`${API}/contacts/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpayOrderId:   orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const vd = await vRes.json();
            if (!vd.success) { setError('Payment verified but activation failed. Contact support.'); setLoading(false); return; }

            // 5. Unlock the advisor immediately
            const ulRes  = await fetch(`${API}/contacts/unlock/${advisorId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const ulData = await ulRes.json();

            setInvoiceData({
              invoiceNo: `BS-CPK-${Date.now().toString().slice(-8)}`,
              paymentId: response.razorpay_payment_id,
              orderId:   orderData.orderId,
              paidAt:    new Date(),
            });

            if (ulData.success && ulData.phoneNumber) {
              setRevealed({ phone: ulData.phoneNumber, email: ulData.email || '' });
              setCreditsLeft(ulData.creditsRemaining ?? vd.creditsTotal - 1);
              onUnlockSuccess(ulData.phoneNumber, ulData.email || '', ulData.creditsRemaining ?? 0);
            }
            setStep('success');
          } catch { setError('Payment verification error. Please contact support.'); }
          finally { setLoading(false); }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (e: any) { setError(e.message || 'Payment failed. Please try again.'); setLoading(false); }
  };

  const handleTestPay = async () => {
    setLoading(true); setError('');
    try {
      const token = sessionStorage.getItem('accessToken') || '';
      const res = await fetch(`${API}/contacts/test-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ advisorId }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Test payment failed'); setLoading(false); return; }
      setInvoiceData({ invoiceNo: `BS-TEST-${Date.now().toString().slice(-8)}`, paymentId: 'test_pay_mode', orderId: 'test_order_mode', paidAt: new Date() });
      if (data.phoneNumber) {
        setRevealed({ phone: data.phoneNumber, email: data.email || '' });
        setCreditsLeft(data.creditsRemaining ?? 0);
        onUnlockSuccess(data.phoneNumber, data.email || '', data.creditsRemaining ?? 0);
      }
      setStep('success');
    } catch (e: any) { setError(e.message || 'Test payment error'); }
    finally { setLoading(false); }
  };

  const downloadInvoice = () => {
    if (!invoiceData) return;
    const user     = JSON.parse(sessionStorage.getItem('user') || '{}');
    const dateStr  = invoiceData.paidAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Tax Invoice — BrokerSaab — ${invoiceData.invoiceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;padding:0;}
  .page{max-width:794px;margin:0 auto;padding:36px 40px;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid #D4AF37;}
  .logo-box{width:44px;height:44px;background:#0B1F3A;border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .logo-box span{color:#D4AF37;font-weight:900;font-size:14px;}
  .company-name{font-size:20px;font-weight:900;color:#0B1F3A;}
  .inv-title h1{font-size:18px;font-weight:900;color:#D4AF37;text-transform:uppercase;letter-spacing:1px;}
  .inv-title p{font-size:11px;color:#6b7280;margin-top:3px;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
  .box{border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;}
  .box-label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px;}
  table{width:100%;border-collapse:collapse;margin-bottom:0;}
  thead tr{background:#0B1F3A;}
  thead th{padding:10px 14px;color:#D4AF37;font-size:10px;font-weight:800;text-transform:uppercase;text-align:left;}
  thead th:last-child{text-align:right;}
  tbody td{padding:12px 14px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6;}
  tbody td:last-child{text-align:right;font-weight:600;}
  .total-section{border:2px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-top:20px;}
  .total-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:12px;}
  .total-row.discount{color:#059669;}
  .total-row.grand{background:#0B1F3A;color:#D4AF37;font-size:15px;font-weight:900;padding:12px 16px;}
  .guarantee{background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:12px;margin-top:20px;font-size:11px;color:#166534;}
  .footer{margin-top:24px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;}
  @media print{.page{padding:24px 28px;}}
</style></head><body><div class="page">

<div class="header">
  <div style="display:flex;align-items:center;gap:10px;">
    <div class="logo-box"><span>BS</span></div>
    <div>
      <div class="company-name">BrokerSaab</div>
      <div style="font-size:11px;color:#6b7280;">BrokerSaab Technology Pvt. Ltd.</div>
      <div style="font-size:11px;color:#6b7280;">GSTIN: 27AABCB1234A1Z5 | PAN: AABCB1234A | SAC: 9983</div>
    </div>
  </div>
  <div class="inv-title" style="text-align:right;">
    <h1>Tax Invoice</h1>
    <p><strong>Invoice No:</strong> ${invoiceData.invoiceNo}</p>
    <p><strong>Date:</strong> ${dateStr}</p>
    <p><strong>Payment ID:</strong> ${invoiceData.paymentId}</p>
    <p><strong>Order ID:</strong> ${invoiceData.orderId}</p>
    <span style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B48C22);color:#0B1F3A;font-size:9px;font-weight:900;padding:3px 10px;border-radius:20px;margin-top:4px;">PAID ✓</span>
  </div>
</div>

<div class="two-col">
  <div class="box">
    <div class="box-label">From (Seller)</div>
    <strong>BrokerSaab Technology Pvt. Ltd.</strong>
    <p style="font-size:11px;color:#6b7280;margin-top:4px;">GSTIN: 27AABCB1234A1Z5<br/>SAC Code: 9983<br/>Mumbai, Maharashtra — 400001, India</p>
  </div>
  <div class="box">
    <div class="box-label">Bill To (Buyer)</div>
    <strong>${user.fullName || 'User'}</strong>
    <p style="font-size:11px;color:#6b7280;margin-top:4px;">${user.phoneNumber || ''}</p>
  </div>
</div>

<table>
  <thead><tr>
    <th style="width:50%">Description</th>
    <th>HSN/SAC</th><th>Qty</th><th>Unit Price (₹)</th><th>Taxable Amt (₹)</th>
  </tr></thead>
  <tbody><tr>
    <td>
      <strong>Contact Unlock Pack — 20 Advisor Contacts</strong><br/>
      <span style="font-size:10px;color:#6b7280;">Access to 20 advisor phone/email contacts · 1 Year Validity</span>
    </td>
    <td>9983</td><td>1</td><td>₹${BASE_PRICE.toFixed(2)}</td><td>₹${BASE_PRICE.toFixed(2)}</td>
  </tr></tbody>
</table>

<div class="total-section">
  <div class="total-row" style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
    <span>MRP / Original Price</span><span>₹${ORIGINAL_PRICE.toFixed(2)}</span>
  </div>
  <div class="total-row discount" style="border-bottom:1px solid #e5e7eb;">
    <span>Promotional Discount (90.09% off)</span><span>− ₹${DISCOUNT_AMT.toFixed(2)}</span>
  </div>
  <div class="total-row" style="font-weight:700;border-bottom:1px solid #e5e7eb;">
    <span>Taxable Amount (after discount)</span><span>₹${BASE_PRICE.toFixed(2)}</span>
  </div>
  <div class="total-row" style="border-bottom:1px solid #e5e7eb;">
    <span>CGST @ 9% (Central GST)</span><span>₹${CGST_AMT.toFixed(2)}</span>
  </div>
  <div class="total-row" style="border-bottom:1px solid #e5e7eb;">
    <span>SGST @ 9% (State GST — Maharashtra)</span><span>₹${SGST_AMT.toFixed(2)}</span>
  </div>
  <div class="total-row grand">
    <span>TOTAL AMOUNT PAID (Inclusive of GST)</span><span>₹${TOTAL_PAYABLE.toFixed(2)}</span>
  </div>
</div>

<div class="guarantee">
  <strong>100% Refund Policy:</strong> If you are unhappy with your purchase within 7 days, the full amount of ₹${TOTAL_PAYABLE.toFixed(2)} will be refunded to your original payment method. No questions asked.
</div>

<div class="footer">
  <div>
    <p>Computer-generated invoice. No signature required.</p>
    <p style="margin-top:4px;">BrokerSaab Technology Pvt. Ltd. · CIN: U72900MH2024PTC000000</p>
  </div>
  <div style="text-align:right;">
    <p>Generated: ${dateStr}</p>
    <p style="margin-top:4px;font-weight:700;color:#0B1F3A;">Thank you for using BrokerSaab!</p>
  </div>
</div>
</div></body></html>`;

    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      <div
        className="relative w-full animate-popIn flex flex-col"
        style={{
          maxWidth: '520px',
          maxHeight: '92dvh',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #071527 0%, #050e1b 60%, #04111c 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
        }}
      >
        {/* Rainbow bar */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,#EF5350,#FF9800,#FFD600,#4CAF50,#2196F3,#9C27B0,#E91E63)' }} />

        {step === 'offer' ? (
          <div className="overflow-y-auto p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-white font-black text-lg">🔓 Unlock Contact Details</h2>
                <p className="text-white/50 text-xs mt-0.5">Get direct access to <strong className="text-white/70">{advisorName}</strong>'s phone & email</p>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Offer card */}
            <div className="rounded-2xl border-2 p-4" style={{ borderColor: '#D4AF37', background: 'linear-gradient(135deg,#0B1F3A,#1a3a5c)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-white text-sm">Contact Unlock Pack</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-navy-800" style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>90% OFF</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-white/40 text-xs line-through">₹{ORIGINAL_PRICE}/year</span>
                <span className="text-gold-400 font-black text-2xl">₹{BASE_PRICE}</span>
                <span className="text-white/50 text-xs">/year</span>
              </div>
              <div className="flex gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-400" /> 20 advisor contacts</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-400" /> 1-year validity</span>
              </div>
            </div>

            {/* Money-back guarantee */}
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5">
              <ShieldCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300 leading-relaxed">
                <strong>100% Money-Back Guarantee.</strong> If you're unhappy within 7 days, we'll refund every rupee — no questions asked.
              </p>
            </div>

            {/* Proforma invoice */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Award size={13} className="text-gold-400" />
                <span className="text-xs font-black uppercase tracking-wider text-gold-400">Proforma Invoice</span>
              </div>
              <div className="p-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>MRP / Original Price</span><span>₹{ORIGINAL_PRICE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount (90.09% off)</span><span>− ₹{DISCOUNT_AMT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-white/10 pt-1.5 mt-1">
                  <span>Taxable Amount (Base)</span><span>₹{BASE_PRICE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>CGST @ 9%</span><span>₹{CGST_AMT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>SGST @ 9%</span><span>₹{SGST_AMT.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-base border-t-2 border-white/20 pt-2 mt-1" style={{ color: '#D4AF37' }}>
                  <span>Total Payable (Incl. GST)</span><span>₹{TOTAL_PAYABLE.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-400 text-xs">
                <X size={13} className="shrink-0" />{error}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527', boxShadow: '0 6px 20px rgba(212,175,55,0.3)', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><ShieldCheck size={16} /> Pay ₹{TOTAL_PAYABLE.toFixed(2)} — Secure Checkout</>}
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleTestPay}
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <>🧪</>} Test Mode — Skip Payment (Dev Only)
            </button>
            <p className="text-[10px] text-white/30 text-center">Secured by Razorpay · UPI, Cards, Net Banking · 100% refund guarantee</p>
          </div>
        ) : (
          /* Success view */
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-white font-black text-lg">✅ Contact Revealed!</h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Contact card */}
            <div className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4 space-y-3">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">{advisorName}</p>
              {revealedContact?.phone && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gold-500/15 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-gold-400" />
                  </div>
                  <span className="text-white font-mono text-sm">{revealedContact.phone}</span>
                  <CopyButton text={revealedContact.phone} />
                </div>
              )}
              {revealedContact?.email && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gold-500/15 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-gold-400" />
                  </div>
                  <span className="text-white text-sm truncate">{revealedContact.email}</span>
                  <CopyButton text={revealedContact.email} />
                </div>
              )}
            </div>

            {/* Credits remaining */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300"><strong className="text-emerald-400">{creditsLeft}</strong> contacts remaining in your pack</span>
            </div>

            {/* Invoice download */}
            {invoiceData && (
              <button onClick={downloadInvoice}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a3a5c)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                <Download size={15} /> Download GST Invoice (PDF)
              </button>
            )}

            <button onClick={handleClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
