import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

// Load Environment Variables
dotenv.config();

// Importers
import authRoutes from './routes/auth';
import advisorRoutes from './routes/advisors';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import subscriptionRoutes, { webhookHandler } from './routes/subscriptions';
import contactRoutes, { contactWebhookHandler } from './routes/contacts';
import supportRoutes from './routes/support';
import prisma from './config/db';

const app = express();
const server = http.createServer(app);

// Socket.IO Setup for Realtime Messaging
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: true,          // reflects request origin — required when credentials: true
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Razorpay webhooks need raw body BEFORE express.json()
app.post('/api/v1/subscriptions/webhook', express.raw({ type: '*/*' }), webhookHandler);
app.post('/api/v1/contacts/webhook', express.raw({ type: '*/*' }), contactWebhookHandler);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded KYC files
app.use('/uploads', express.static('uploads'));

// Routing API endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/advisors', advisorRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/support', supportRoutes);

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BrokerSaab Express REST Core'
  });
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // Room coordinator joining
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket client joined room: ${roomId}`);
  });

  // Message dispatcher
  socket.on('send_msg', (data: { roomId: string; senderId: string; content: string }) => {
    io.to(data.roomId).emit('recv_msg', {
      senderId: data.senderId,
      content: data.content,
      createdAt: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Centralized Express Custom Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error. Please contact backend administrators.'
  });
});

/* ── Startup: ensure Super Admin exists in DB ── */
async function ensureAdminUser() {
  try {
    const existing = await prisma.adminUsers.findUnique({ where: { email: 'admin@brokersaab.com' } });
    if (!existing) {
      const passwordHash = await bcrypt.hash('BrokerAdmin123', 10);
      await prisma.adminUsers.create({
        data: {
          email: 'admin@brokersaab.com',
          fullName: 'BrokerSaab Super Admin',
          passwordHash,
          role: 'SUPER_ADMIN' as any,
        }
      });
      console.log('[Startup] Super Admin created: admin@brokersaab.com');
    } else {
      console.log('[Startup] Super Admin already exists.');
    }
  } catch (err) {
    console.error('[Startup] Admin seed failed (non-fatal):', err);
  }
}

// Launch server instance
ensureAdminUser().then(() => {
  server.listen(PORT, () => {
    console.log(`BrokerSaab Server is online on port ${PORT} in ${process.env.NODE_ENV} mode.`);
  });
});

export { app, server, io };
