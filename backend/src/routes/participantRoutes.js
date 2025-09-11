// routes/participantRoutes.js
import express from 'express';
import { authenticateToken } from '#middleware/auth';
import { ParticipantController } from '#controllers/participantController';

const router = express.Router();

// All routes here are prefixed with /meetings/:meetingId/participants
// So the full path would be /api/meetings/:meetingId/participants/*

// Participant Management Routes
router.get('/', authenticateToken, ParticipantController.getActiveParticipants);
router.patch('/status', authenticateToken, ParticipantController.updateMediaStatus);
router.get('/:userId/status', authenticateToken, ParticipantController.getParticipantStatus);
router.delete('/:participantUserId/kick', authenticateToken, ParticipantController.kickParticipant);
router.patch('/:participantUserId/mute', authenticateToken, ParticipantController.toggleParticipantMute);

// Meeting Statistics and History (participant-related data)
router.get('/stats', authenticateToken, ParticipantController.getMeetingStats);
router.get('/history', authenticateToken, ParticipantController.getParticipantHistory);

export default router;