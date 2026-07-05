'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Wallet as WalletIcon, TrendingUp, CheckCircle2,
  Loader2, AlertCircle, X, Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface WithdrawalRecord {
  id: string; amount: string; netAmount: string; status: string; createdAt: string;
}

interface WalletData {
  walletBalance: number;
  pendingWithdrawals: WithdrawalRecord[];
  recentWithdrawals: WithdrawalRecord[];
  bankDetails: {
    bankAccountNumber?: string | null;
    bankIfsc?: string | null;
    bankAccountHolder?: string | null;
    bankAccountType?: string | null;
  } | null;
}

export default function ClientWalletPage() {
  const { isLoggedIn, authReady, user, openLoginModal } = useAuth();
  const router = useRouter();

  const [wallet,  setWallet]  = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const [bankForm,   setBankForm]   = useState({ bankAccountHolder: '', bankAccountNumber: '', bankIfsc: '' });
  const [savingBank, setSavingBank] = useState(false);
  const [bankSaved,  setBankSaved]  = useState(false);
  const [bankError,  setBankError]  = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount,    setWithdrawAmount]    = useState('');
  const [withdrawing,       setWithdrawing]       = useState(false);
  const [withdrawError,     setWithdrawError]     = useState('');
  const [withdrawSuccess,   setWithdrawSuccess]   = useState(false);

  const fetchWallet = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res  = await fetch(`${API}/users/wallet`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setWallet(data.data);
        setBankForm({
          bankAccountHolder: data.data.bankDetails?.bankAccountHolder ?? '',
          bankAccountNumber: data.data.bankDetails?.bankAccountNumber ?? '',
          bankIfsc:          data.data.bankDetails?.bankIfsc ?? '',
        });
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) { openLoginModal(() => router.push('/wallet')); return; }
    if (user?.role !== 'CLIENT') { router.push('/'); return; }
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn]);

  const saveBankDetails = async () => {
    setBankError(''); setBankSaved(false);
    if (!bankForm.bankAccountHolder.trim() || !bankForm.bankAccountNumber.trim() || !bankForm.bankIfsc.trim()) {
      setBankError('All bank detail fields are required'); return;
    }
    setSavingBank(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res  = await fetch(`${API}/users/bank-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (data.success) { setBankSaved(true); setTimeout(() => setBankSaved(false), 3000); }
      else setBankError(data.message || 'Failed to save bank details');
    } catch { setBankError('Network error. Please try again.'); }
    finally { setSavingBank(false); }
  };

  const submitWithdraw = async () => {
    setWithdrawError('');
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { setWithdrawError('Enter a valid amount'); return; }
    if (wallet && amount > wallet.walletBalance) { setWithdrawError('Amount exceeds your wallet balance'); return; }
    setWithdrawing(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res  = await fetch(`${API}/users/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, ...bankForm }),
      });
      const data = await res.json();
      if (data.success) { setWithdrawSuccess(true); fetchWallet(); }
      else setWithdrawError(data.message || 'Failed to submit withdrawal request');
    } catch { setWithdrawError('Network error. Please try again.'); }
    finally { setWithdrawing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );

  const hasBankDetails = !!(bankForm.bankAccountHolder && bankForm.bankAccountNumber && bankForm.bankIfsc);

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-black text-white">My Wallet</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Balance card */}
        <div className="rounded-2xl overflow-hidden bg-white border border-emerald-100 shadow-sm">
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)' }}>
            <div className="flex items-center gap-2">
              <WalletIcon size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Wallet Balance</span>
            </div>
            <button
              onClick={() => { setShowWithdrawModal(true); setWithdrawSuccess(false); setWithdrawAmount(''); setWithdrawError(''); }}
              disabled={!wallet || wallet.walletBalance <= 0 || wallet.pendingWithdrawals.length > 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
              <TrendingUp size={12} /> Withdraw
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="text-2xl font-black text-emerald-700">
              ₹{(wallet?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Refunds from cancelled work items are credited here instantly. Withdraw anytime to your bank account.
            </p>
            {wallet && wallet.pendingWithdrawals.length > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
                <Clock size={13} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700">
                  A withdrawal of ₹{Number(wallet.pendingWithdrawals[0].amount).toLocaleString('en-IN')} is pending admin approval.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bank details */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Bank Details</p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Account Holder Name</label>
              <input
                type="text"
                placeholder="As per bank records"
                value={bankForm.bankAccountHolder}
                onChange={e => setBankForm(f => ({ ...f, bankAccountHolder: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Bank Account Number</label>
              <input
                type="text"
                placeholder="Account number"
                value={bankForm.bankAccountNumber}
                onChange={e => setBankForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={bankForm.bankIfsc}
                onChange={e => setBankForm(f => ({ ...f, bankIfsc: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {bankError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {bankError}</p>
            )}
            {bankSaved && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Bank details saved</p>
            )}
            <button
              onClick={saveBankDetails}
              disabled={savingBank}
              className="w-full py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-60 flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)' }}>
              {savingBank ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Save Bank Details
            </button>
          </div>
        </div>

        {/* Recent withdrawals */}
        {wallet && wallet.recentWithdrawals.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Withdrawal History</p>
            <div className="space-y-2">
              {wallet.recentWithdrawals.map(w => (
                <div key={w.id} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-700">₹{Number(w.netAmount).toLocaleString('en-IN')}</span>
                    <span className="text-gray-400 ml-2">{new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    w.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                    w.status === 'FAILED'  ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{w.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Funds Modal */}
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
                      ₹{(wallet?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 block">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter amount to withdraw"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {!hasBankDetails && (
                    <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> Save your bank details above before withdrawing.
                    </p>
                  )}

                  {withdrawError && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {withdrawError}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Withdrawal requests are processed by BrokerSaab within 2-3 business days.
                  </p>

                  <button
                    onClick={submitWithdraw}
                    disabled={withdrawing || !hasBankDetails}
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
    </div>
  );
}
