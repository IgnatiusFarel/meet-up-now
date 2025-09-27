// routes/meetingRoutes.js
import express from 'express';
import { authenticateToken } from '#middleware/auth';
import { MeetingController } from '#controllers/meetingController';
import participantRoutes from '#routes/participantRoutes'; // Import participant routes

const router = express.Router();

// Core Meeting Management Routes
router.post('/', authenticateToken, MeetingController.create);
router.get('/code/:code', authenticateToken, MeetingController.getByCode);
router.post('/join', authenticateToken, MeetingController.join);
router.post('/:meetingId/leave', authenticateToken, MeetingController.leave);
router.post('/:meetingId/end', authenticateToken, MeetingController.end);
router.get('/active', authenticateToken, MeetingController.getActiveMeetings);

// Join Validation
router.get('/code/:meetingCode/can-join', authenticateToken, MeetingController.checkCanJoin);

// Meeting Details (untuk fallback strategy di frontend)
router.get('/details/:meetingId', authenticateToken, MeetingController.getByMeetingId);

// Active Users (alternative endpoint untuk fallback)
router.get('/:meetingId/active-users', authenticateToken, MeetingController.getActiveUsers);

// Meeting Details (untuk fallback strategy di frontend)
router.get('/details/:meetingId', authenticateToken, MeetingController.getByMeetingId);

// Active Users (alternative endpoint untuk fallback)
router.get('/:meetingId/active-users', authenticateToken, MeetingController.getActiveUsers);

// Cleanup (for cron jobs or admin)
router.post('/cleanup/expired', authenticateToken, MeetingController.cleanupExpiredMeetings);

// ============ NESTED PARTICIPANT ROUTES ============
// Tambahkan ini agar semua participant routes tersedia
// Route akan menjadi: /api/meetings/:meetingId/participants/*
router.use('/:meetingId/participants', participantRoutes);

export default router;