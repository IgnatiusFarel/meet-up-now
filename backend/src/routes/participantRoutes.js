import express from 'express';
import { authenticateToken } from '#middleware/auth';
import { ParticipantController } from '#controllers/participantController';

// PENTING: mergeParams: true agar bisa akses :meetingId dari parent route
const router = express.Router({ mergeParams: true });

// ============ PARTICIPANT ROUTES ============
// Semua route ini akan diprefix dengan /api/meetings/:meetingId/participants

// GET /api/meetings/:meetingId/participants/
router.get('/', authenticateToken, ParticipantController.getActiveParticipants);

// PATCH /api/meetings/:meetingId/participants/status
router.patch('/status', authenticateToken, ParticipantController.updateMediaStatus);

// GET /api/meetings/:meetingId/participants/stats
router.get('/stats', authenticateToken, ParticipantController.getMeetingStats);

// GET /api/meetings/:meetingId/participants/history
router.get('/history', authenticateToken, ParticipantController.getParticipantHistory);

// GET /api/meetings/:meetingId/participants/:userId/status
router.get('/:userId/status', authenticateToken, ParticipantController.getParticipantStatus);

// DELETE /api/meetings/:meetingId/participants/:participantUserId/kick
router.delete('/:participantUserId/kick', authenticateToken, ParticipantController.kickParticipant);

// PATCH /api/meetings/:meetingId/participants/:participantUserId/mute
router.patch('/:participantUserId/mute', authenticateToken, ParticipantController.toggleParticipantMute);

export default router;