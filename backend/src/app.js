// app.js
import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '#routes/authRoutes';
import meetingRoutes from '#routes/meetingRoutes';
import participantRoutes from '#routes/participantRoutes';
import chatRoutes from '#routes/chatRoutes';
import { ApiResponse } from '#utils/response';
import { WebSocketService } from '#services/websocketService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Add WebSocket instance to request for controllers
app.use((req, res, next) => {
  req.io = wsService.io;
  req.wsService = wsService;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json(
    ApiResponse.success(
      {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        websocket: 'Active'
      },
      'Server is healthy'
    )
  );
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meetings/:meetingId/participants', participantRoutes);
app.use('/api/chat', chatRoutes);

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  res.json(
    ApiResponse.success(
      {
        connected: wsService.io.engine.clientsCount,
        uptime: process.uptime()
      },
      'WebSocket status'
    )
  );
});

// Get meeting connection count
app.get('/api/meetings/:meetingId/connections', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const count = await wsService.getMeetingConnectionCount(meetingId);
    
    res.json(
      ApiResponse.success(
        { connectionCount: count },
        'Connection count retrieved'
      )
    );
  } catch (error) {
    res.status(500).json(
      ApiResponse.error('Failed to get connection count', 500, error.message)
    );
  }
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json(
    ApiResponse.notFound(`Route ${req.method} ${req.originalUrl} not found`)
  );
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      ApiResponse.badRequest('Validation failed', err.message)
    );
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json(
      ApiResponse.badRequest('Invalid data format', err.message)
    );
  }
  
  return res.status(err.statusCode || 500).json(
    ApiResponse.error(
      err.message || 'Internal server error',
      err.statusCode || 500,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`📹 Meeting routes: http://localhost:${PORT}/api/meetings`);
  console.log(`👥 Participant routes: http://localhost:${PORT}/api/meetings/:meetingId/participants`);
  console.log(`💬 Chat routes: http://localhost:${PORT}/api/chat`);
  console.log(`🔌 WebSocket: Active on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;