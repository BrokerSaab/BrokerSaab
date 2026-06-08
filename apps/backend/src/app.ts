import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
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
import quoteRoutes from './routes/quotes';
import userRoutes from './routes/users';
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

// Serve uploaded KYC files — CORP: cross-origin allows Vercel frontend to load images/files
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Routing API endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/advisors', advisorRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/users', userRoutes);

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

  // Room coordinator joining (chat rooms)
  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Socket client joined room: ${roomId}`);
  });

  // Personal notification rooms for quote events
  socket.on('join_user_room',    (userId: string)    => socket.join(`user:${userId}`));
  socket.on('join_advisor_room', (advisorId: string) => socket.join(`advisor:${advisorId}`));

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

/* ── Startup: seed the 19 service categories if missing ── */
const SEED_CATEGORIES = [
  { slug: 'm1',  name: 'Birth, Death & Marriage Papers' },
  { slug: 'm2',  name: 'Identity Cards & Documents' },
  { slug: 'm3',  name: 'Income, Caste & Residence' },
  { slug: 'm4',  name: 'Property & Land Papers' },
  { slug: 'm5',  name: 'Tax / GST Filing' },
  { slug: 'm6',  name: 'Business Registration' },
  { slug: 'm7',  name: 'Brand & IP Protection' },
  { slug: 'm8',  name: 'Bank, Loan & Credit' },
  { slug: 'm9',  name: 'Insurance (Bima)' },
  { slug: 'm10', name: 'Vehicle & RTO Work' },
  { slug: 'm11', name: 'Legal & Court Help' },
  { slug: 'm12', name: 'Job, PF & Labour' },
  { slug: 'm13', name: 'School & College Papers' },
  { slug: 'm14', name: 'Pension & Govt Schemes' },
  { slug: 'm15', name: 'Savings & Investment' },
  { slug: 'm16', name: 'Passport, Visa & Foreign' },
  { slug: 'm17', name: 'Electricity, Water & Gas' },
  { slug: 'm18', name: 'Farmer & Agriculture' },
  { slug: 'm19', name: 'Online Form & Doc Help' },
  { slug: 'm20', name: 'Central Government Schemes' },
  { slug: 'm21', name: 'Study Abroad Consulting' },
  { slug: 'm22', name: 'Domestic College Admission' },
  { slug: 'm23', name: 'Job Placement & Recruitment' },
  { slug: 'm24', name: 'Visa & PR Immigration' },
  { slug: 'm25', name: 'Others / Custom Service' },
  { slug: 'm26', name: 'Tour & Travel' },
];

async function ensureCategories() {
  try {
    for (const cat of SEED_CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: { slug: cat.slug, name: cat.name },
      });
    }
    console.log('[Startup] 25 service categories ensured.');
  } catch (err) {
    console.error('[Startup] Category seed failed (non-fatal):', err);
  }
}

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

// Bind the port immediately so Render / cloud hosts detect it within the timeout window.
// Seeding runs after binding — a seed failure is non-fatal and never blocks the server.
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`BrokerSaab Server is online on port ${PORT} in ${process.env.NODE_ENV} mode.`);
  Promise.all([ensureAdminUser(), ensureCategories()]).catch(err =>
    console.error('[Startup] Seed step failed (non-fatal):', err)
  );
});

export { app, server, io };
