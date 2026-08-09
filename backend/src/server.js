require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB, checkDBConnected } = require('./config/db');
const { setupSocketHandlers } = require('./socket/socketHandler');
const { initQueue } = require('./services/queueService');

const authRoutes = require('./routes/authRoutes');
const masterRoutes = require('./routes/masterRoutes');
const questionRoutes = require('./routes/questionRoutes');
const paperRoutes = require('./routes/paperRoutes');
const roomRoutes = require('./routes/roomRoutes');
const studentRoutes = require('./routes/studentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach io to app for access in route handlers
app.set('io', io);

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate Limiting for Run/Submit endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: { message: 'Too many requests, please try again shortly.' }
});
app.use('/api/', apiLimiter);

// DB Readiness Check Middleware
app.use('/api/', checkDBConnected);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/submissions', submissionRoutes);

// Root Status & Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: '🚀 LeetEval Multi-Language Assessment Platform Backend API Server is Live & Operational',
    version: '1.0.0',
    healthCheck: '/health',
    timestamp: new Date()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// Initialize Socket.IO and Execution Queue
setupSocketHandlers(io);
initQueue(io);

const { autoSeedMaster } = require('./seed/seedMaster');

// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  await autoSeedMaster();
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 [Coding Assessment Platform API Server Running]`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Worker Concurrency: ${process.env.WORKER_CONCURRENCY || 2}`);
    console.log(`=======================================================`);
  });
});
