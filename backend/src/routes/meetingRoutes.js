import express from 'express';
import { MeetingController } from '#controllers/meetingController';
import { ParticipantController } from '#controllers/participantController';
import { authenticateToken } from '#middleware/auth';

const router = express.Router();

// Meeting Management Routes
router.post('/', authenticateToken, MeetingController.create);
router.get('/code/:code', authenticateToken, MeetingController.getByCode);
router.post('/join', authenticateToken, MeetingController.join);
router.post('/:meetingId/leave', authenticateToken, MeetingController.leave);
router.post('/:meetingId/end', authenticateToken, MeetingController.end);
router.get('/active', authenticateToken, MeetingController.getActiveMeetings);

// Participant Management Routes
router.get('/:meetingId/participants', authenticateToken, ParticipantController.getActiveParticipants);
router.patch('/:meetingId/participants/status', authenticateToken, ParticipantController.updateMediaStatus);
router.get('/:meetingId/participants/:userId/status', authenticateToken, ParticipantController.getParticipantStatus);
router.delete('/:meetingId/participants/:participantUserId/kick', authenticateToken, ParticipantController.kickParticipant);
router.patch('/:meetingId/participants/:participantUserId/mute', authenticateToken, ParticipantController.toggleParticipantMute);
router.get('/:meetingId/stats', authenticateToken, ParticipantController.getMeetingStats);
router.get('/:meetingId/history', authenticateToken, ParticipantController.getParticipantHistory);

// Join Validation
router.get('/code/:meetingCode/can-join', authenticateToken, ParticipantController.checkCanJoin);

// Cleanup (for cron jobs or admin)
router.post('/cleanup/expired', authenticateToken, ParticipantController.cleanupExpiredMeetings);

export default router;