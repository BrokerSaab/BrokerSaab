'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { io as ioClient, Socket } from 'socket.io-client';
import {
  ArrowLeft, Send, Loader2, Lock, MessageSquare, Circle,
  Calendar, Clock, BadgeCheck,
} from 'lucide-react';

const API      = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const WS_URL   = process.env.NEXT_PUBLIC_WS_URL  || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com');
const BACKEND  = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '');
const resolveImg = (url?: string | null) => !url ? null : url.startsWith('http') ? url : `${BACKEND}${url.startsWith('/') ? url : `/${url}`}`;

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderRole: string;
  content: string;
  createdAt: string;
}

interface Participant {
  user: { id: string; fullName: string; avatarUrl?: string | null; role: string };
}

interface RoomInfo {
  id: string;
  booking: {
    bookingNumber: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    status: string;
    mode: string;
    advisor: { fullName: string; businessName?: string };
    client: { id: string; fullName: string };
  };
  participants: Participant[];
}

const MODE_LABEL: Record<string, string> = {
  PHONE: 'Phone Call', VIDEO: 'Video Call', CHAT: 'Chat', PHYSICAL: 'In-person',
};

function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function ChatPage() {
  const params    = useParams();
  const roomId    = params.roomId as string;
  const router    = useRouter();
  const { user, isLoggedIn, authReady } = useAuth();

  const [room,      setRoom]      = useState<RoomInfo | null>(null);
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [connected, setConnected] = useState(false);
  const [error,     setError]     = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const token = () => sessionStorage.getItem('accessToken') || '';

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load room info + message history
  const loadRoom = useCallback(async () => {
    if (!roomId || !token()) return;
    setLoading(true);
    try {
      const [roomRes, msgRes] = await Promise.all([
        fetch(`${API}/chat/${roomId}`,          { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/chat/${roomId}/messages`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const roomData = await roomRes.json();
      const msgData  = await msgRes.json();
      if (roomData.success) setRoom(roomData.room);
      else setError('You do not have access to this chat room.');
      if (msgData.success) setMessages(msgData.messages);
    } catch {
      setError('Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) { router.push('/'); return; }
    loadRoom();
  }, [authReady, isLoggedIn, loadRoom]);

  // Socket.IO connection
  useEffect(() => {
    if (!isLoggedIn || !user?.id || !roomId) return;

    const socket = ioClient(WS_URL, { transports: ['websocket'], autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', roomId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('recv_msg', (msg: ChatMessage) => {
      setMessages(prev => {
        // Deduplicate by id
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => { socket.disconnect(); };
  }, [isLoggedIn, user?.id, roomId]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !user?.id || sending) return;
    setInput('');
    setSending(true);
    try {
      socketRef.current?.emit('send_msg', {
        roomId,
        senderId: user.id,
        content,
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Derive other participant's info
  const otherParticipant = room?.participants.find(p => p.user.id !== user?.id);
  const myName = room?.participants.find(p => p.user.id === user?.id)?.user.fullName ?? user?.fullName ?? '';

  if (!authReady || loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <Loader2 size={26} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <Lock size={22} className="text-red-400" />
        </div>
        <p className="text-slate-700 font-semibold text-sm text-center">{error}</p>
        <button onClick={() => router.back()} className="text-indigo-500 text-sm font-medium hover:underline">Go back</button>
      </div>
    );
  }

  const booking = room?.booking;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
            <ArrowLeft size={18} />
          </button>

          {otherParticipant && (
            <Avatar name={otherParticipant.user.fullName} src={resolveImg(otherParticipant.user.avatarUrl)} size={36} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-800 truncate">
                {otherParticipant?.user.fullName ?? 'Consultation Chat'}
              </p>
              {otherParticipant?.user.role === 'ADVISOR' && (
                <BadgeCheck size={13} className="text-indigo-500 shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {booking ? `${booking.bookingNumber} · ${MODE_LABEL[booking.mode] ?? booking.mode}` : 'Loading…'}
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Circle
              size={7}
              className={connected ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300 fill-slate-300'}
            />
            <span className="text-[10px] text-slate-400 hidden sm:block">{connected ? 'Live' : 'Connecting…'}</span>
          </div>
        </div>

        {/* Booking context bar */}
        {booking && (
          <div className="border-t border-slate-50 bg-indigo-50/60">
            <div className="max-w-2xl mx-auto px-4 py-1.5 flex items-center gap-4 text-[10px] text-indigo-700 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {booking.startTime} – {booking.endTime}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <Lock size={9} className="text-indigo-400" />
                Private &amp; encrypted
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">

          {/* Intro notice */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 bg-white border border-indigo-100 rounded-full px-4 py-1.5 shadow-sm">
              <Lock size={11} className="text-indigo-400" />
              <span className="text-[10px] text-slate-500 font-medium">
                This is a private consultation chat. Messages are only visible to you and {otherParticipant?.user.fullName ?? 'the advisor'}.
              </span>
            </div>
          </div>

          {messages.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={20} className="text-indigo-400" />
              </div>
              <p className="text-slate-500 text-sm font-semibold">No messages yet</p>
              <p className="text-slate-400 text-xs mt-1">Start the conversation below</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.senderId === user?.id;
            const showAvatar = !isOwn && (i === 0 || messages[i - 1].senderId !== msg.senderId);
            const showName   = showAvatar;
            const time = new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar placeholder to keep alignment */}
                {!isOwn && (
                  <div className="shrink-0 w-7">
                    {showAvatar && (
                      <Avatar name={msg.senderName} src={resolveImg(msg.senderAvatar)} size={28} />
                    )}
                  </div>
                )}

                <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {showName && (
                    <p className="text-[10px] text-slate-400 mb-1 ml-1">{msg.senderName}</p>
                  )}
                  <div
                    className="px-4 py-2.5 text-sm leading-relaxed"
                    style={{
                      background:        isOwn ? '#6366f1' : 'white',
                      color:             isOwn ? 'white' : '#1e293b',
                      borderRadius:      isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border:            isOwn ? 'none' : '1px solid rgba(99,102,241,0.15)',
                      boxShadow:         '0 1px 4px rgba(0,0,0,0.07)',
                      wordBreak:         'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[9px] text-slate-300 mt-1 px-1">{time}</p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-slate-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            maxLength={2000}
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending || !connected}
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
          >
            {sending
              ? <Loader2 size={16} className="text-white animate-spin" />
              : <Send size={16} className="text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
