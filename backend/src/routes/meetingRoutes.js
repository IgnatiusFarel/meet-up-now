// routes/meetingRoutes.js
import express from 'express';
import { authenticateToken } from '#middleware/auth';
import { MeetingController } from '#controllers/meetingController';

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

// Cleanup (for cron jobs or admin)
router.post('/cleanup/expired', authenticateToken, MeetingController.cleanupExpiredMeetings);

export default router;