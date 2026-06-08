import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'https://brokersaab-backend.onrender.com';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  activeRooms: string[];

  connect: (token: string) => void;
  disconnect: () => void;
  joinRoom: (bookingId: string) => void;
  leaveRoom: (bookingId: string) => void;
  sendMessage: (bookingId: string, content: string, senderId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  activeRooms: [],

  connect: (token: string) => {
    const existing = get().socket;
    if (existing?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false, activeRooms: [] });
  },

  joinRoom: (bookingId: string) => {
    const { socket, activeRooms } = get();
    if (!socket || activeRooms.includes(bookingId)) return;
    socket.emit('join-room', { bookingId });
    set({ activeRooms: [...activeRooms, bookingId] });
  },

  leaveRoom: (bookingId: string) => {
    const { socket } = get();
    socket?.emit('leave-room', { bookingId });
    set({ activeRooms: get().activeRooms.filter((r) => r !== bookingId) });
  },

  sendMessage: (bookingId: string, content: string, senderId: string) => {
    get().socket?.emit('send-message', { bookingId, content, senderId });
  },
}));
