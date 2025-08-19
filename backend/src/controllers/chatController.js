import { ChatService } from '#services/chatService';
import { ApiResponse } from '#utils/response';

export class ChatController {
  static async sendMessage(req, res) {
    try {
      const { meetingId } = req.params;
      const { content } = req.body;
      const senderId = req.user.userId;

      // Validate content
      if (!content || !content.trim()) {
        return res.status(400).json(ApiResponse.badRequest('Message content is required'));
      }

      if (content.length > 1000) {
        return res.status(400).json(ApiResponse.badRequest('Message too long (max 1000 characters)'));
      }

      const message = await ChatService.sendMessage(meetingId, senderId, content);

      // Emit to WebSocket (will be handled by WebSocket service)
      if (req.io) {
        req.io.to(`meeting-${meetingId}`).emit('new-message', message);
      }

      return res.status(201).json(ApiResponse.success(message, 'Message sent successfully'));
    } catch (error) {
      if (error.message === 'User is not a participant in this meeting') {
        return res.status(403).json(ApiResponse.error('Forbidden: Not a meeting participant', 403));
      }
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found'));
      }
      if (error.message === 'Cannot send message to ended meeting') {
        return res.status(410).json(ApiResponse.error('Meeting has ended', 410));
      }
      return res.status(500).json(ApiResponse.error('Failed to send message', 500, error.message));
    }
  }

  static async getMessages(req, res) {
    try {
      const { meetingId } = req.params;
      const { limit = 50, cursor } = req.query;
      const userId = req.user.userId;

      const messages = await ChatService.getMeetingMessages(
        meetingId, 
        userId, 
        parseInt(limit), 
        cursor
      );

      return res.status(200).json(ApiResponse.success(messages, 'Messages fetched successfully'));
    } catch (error) {
      if (error.message === 'User is not a participant in this meeting') {
        return res.status(403).json(ApiResponse.error('Forbidden: Not a meeting participant', 403));
      }
      return res.status(500).json(ApiResponse.error('Failed to fetch messages', 500, error.message));
    }
  }

  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      const result = await ChatService.deleteMessage(messageId, userId);

      // Emit to WebSocket
      if (req.io) {
        // Get meeting ID for the room
        const message = await prisma.chatMessage.findUnique({
          where: { messageId },
          select: { meetingId: true }
        });
        if (message) {
          req.io.to(`meeting-${message.meetingId}`).emit('message-deleted', result);
        }
      }

      return res.status(200).json(ApiResponse.success(result, 'Message deleted successfully'));
    } catch (error) {
      if (error.message === 'Message not found') {
        return res.status(404).json(ApiResponse.notFound('Message not found'));
      }
      if (error.message === 'Not authorized to delete this message') {
        return res.status(403).json(ApiResponse.error('Forbidden: Cannot delete this message', 403));
      }
      return res.status(500).json(ApiResponse.error('Failed to delete message', 500, error.message));
    }
  }

  static async getMessageStats(req, res) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.userId;

      const stats = await ChatService.getMessageStats(meetingId, userId);

      return res.status(200).json(ApiResponse.success(stats, 'Message statistics fetched successfully'));
    } catch (error) {
      if (error.message === 'User is not a participant in this meeting') {
        return res.status(403).json(ApiResponse.error('Forbidden: Not a meeting participant', 403));
      }
      return res.status(500).json(ApiResponse.error('Failed to fetch message statistics', 500, error.message));
    }
  }

  static async clearMessages(req, res) {
    try {
      const { meetingId } = req.params;
      const ownerId = req.user.userId;

      const result = await ChatService.clearMeetingMessages(meetingId, ownerId);

      // Emit to WebSocket
      if (req.io) {
        req.io.to(`meeting-${meetingId}`).emit('messages-cleared', result);
      }

      return res.status(200).json(ApiResponse.success(result, 'Messages cleared successfully'));
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found'));
      }
      if (error.message === 'Only meeting owner can clear messages') {
        return res.status(403).json(ApiResponse.error('Forbidden: Only meeting owner can clear messages', 403));
      }
      return res.status(500).json(ApiResponse.error('Failed to clear messages', 500, error.message));
    }
  }
}