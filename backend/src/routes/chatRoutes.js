import express from 'express';
import { ChatController } from '#controllers/chatController';
import { authenticateToken } from '#middleware/auth';

const router = express.Router();

// Send message to meeting
router.post('/:meetingId/messages', authenticateToken, ChatController.sendMessage);

// Get meeting messages with pagination
router.get('/:meetingId/messages', authenticateToken, ChatController.getMessages);

// Delete specific message
router.delete('/messages/:messageId', authenticateToken, ChatController.deleteMessage);

// Get message statistics for meeting
router.get('/:meetingId/messages/stats', authenticateToken, ChatController.getMessageStats);

// Clear all messages in meeting (owner only)
router.delete('/:meetingId/messages', authenticateToken, ChatController.clearMessages);

export default router;