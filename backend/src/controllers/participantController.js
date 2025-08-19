import { ParticipantService } from '#services/participantService';
import { ApiResponse } from '#utils/response';

export class ParticipantController {
  static async getActiveParticipants(req, res) {
    try {
      const { meetingId } = req.params;
      
      const participants = await ParticipantService.getActiveParticipants(meetingId);
      
      return res.status(200).json(
        ApiResponse.success(participants, 'Active participants fetched successfully')
      );
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Failed to fetch participants', 500, error.message)
      );
    }
  }

  static async updateMediaStatus(req, res) {
    try {
      const { meetingId } = req.params;
      const { isMicOn, isCameraOn, isScreenShare } = req.body;
      const userId = req.user.userId;

      const updates = {};
      if (typeof isMicOn === 'boolean') updates.isMicOn = isMicOn;
      if (typeof isCameraOn === 'boolean') updates.isCameraOn = isCameraOn;
      if (typeof isScreenShare === 'boolean') updates.isScreenShare = isScreenShare;

      const participant = await ParticipantService.updateParticipantMediaStatus(
        userId, 
        meetingId, 
        updates
      );

      // Broadcast status update via WebSocket
      if (req.io) {
        req.io.to(`meeting-${meetingId}`).emit('participant-status-updated', {
          participantId: participant.participantId,
          userId: participant.userId,
          user: participant.user,
          isMicOn: participant.isMicOn,
          isCameraOn: participant.isCameraOn,
          isScreenShare: participant.isScreenShare,
          timestamp: new Date()
        });
      }

      return res.status(200).json(
        ApiResponse.success(participant, 'Media status updated successfully')
      );
    } catch (error) {
      if (error.message === 'No valid updates provided') {
        return res.status(400).json(
          ApiResponse.badRequest('No valid updates provided')
        );
      }
      if (error.message === 'Participant not found or not active in meeting') {
        return res.status(404).json(
          ApiResponse.notFound('Participant not found in meeting')
        );
      }
      return res.status(500).json(
        ApiResponse.error('Failed to update media status', 500, error.message)
      );
    }
  }

  static async getParticipantStatus(req, res) {
    try {
      const { meetingId, userId } = req.params;
      
      const participant = await ParticipantService.getParticipantStatus(userId, meetingId);
      
      return res.status(200).json(
        ApiResponse.success(participant, 'Participant status fetched successfully')
      );
    } catch (error) {
      if (error.message === 'Participant not found') {
        return res.status(404).json(
          ApiResponse.notFound('Participant not found')
        );
      }
      return res.status(500).json(
        ApiResponse.error('Failed to fetch participant status', 500, error.message)
      );
    }
  }

  static async kickParticipant(req, res) {
    try {
      const { meetingId, participantUserId } = req.params;
      const ownerId = req.user.userId;

      const result = await ParticipantService.kickParticipant(
        ownerId, 
        meetingId, 
        participantUserId
      );

      // Broadcast kick event via WebSocket
      if (req.io) {
        req.io.to(`meeting-${meetingId}`).emit('participant-kicked', {
          kickedUserId: participantUserId,
          kickedBy: req.user,
          timestamp: new Date()
        });

        // Send direct message to kicked user
        const kickedUserSockets = await req.io.in(`meeting-${meetingId}`).fetchSockets();
        kickedUserSockets.forEach(socket => {
          if (socket.userId === participantUserId) {
            socket.emit('you-were-kicked', {
              kickedBy: req.user,
              reason: 'Removed by meeting owner',
              timestamp: new Date()
            });
            socket.leave(`meeting-${meetingId}`);
          }
        });
      }

      return res.status(200).json(
        ApiResponse.success(result, 'Participant kicked successfully')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(
          ApiResponse.notFound('Meeting not found')
        );
      }
      if (error.message === 'Only meeting owner can kick participants') {
        return res.status(403).json(
          ApiResponse.error('Forbidden: Only meeting owner can kick participants', 403)
        );
      }
      if (error.message === 'Owner cannot kick themselves') {
        return res.status(400).json(
          ApiResponse.badRequest('Owner cannot kick themselves')
        );
      }
      if (error.message === 'Participant not found or already left') {
        return res.status(404).json(
          ApiResponse.notFound('Participant not found or already left')
        );
      }
      return res.status(500).json(
        ApiResponse.error('Failed to kick participant', 500, error.message)
      );
    }
  }

  static async toggleParticipantMute(req, res) {
    try {
      const { meetingId, participantUserId } = req.params;
      const { forceState } = req.body; // true to mute, false to unmute, null to toggle
      const ownerId = req.user.userId;

      const participant = await ParticipantService.toggleParticipantMute(
        ownerId,
        meetingId,
        participantUserId,
        forceState
      );

      // Broadcast mute update via WebSocket
      if (req.io) {
        req.io.to(`meeting-${meetingId}`).emit('participant-muted-by-owner', {
          participantUserId,
          isMicOn: participant.isMicOn,
          mutedBy: req.user,
          timestamp: new Date()
        });
      }

      return res.status(200).json(
        ApiResponse.success(participant, 'Participant mute status updated successfully')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(
          ApiResponse.notFound('Meeting not found')
        );
      }
      if (error.message === 'Only meeting owner can control participant audio') {
        return res.status(403).json(
          ApiResponse.error('Forbidden: Only meeting owner can control participant audio', 403)
        );
      }
      return res.status(500).json(
        ApiResponse.error('Failed to update participant mute status', 500, error.message)
      );
    }
  }

  static async getMeetingStats(req, res) {
    try {
      const { meetingId } = req.params;
      
      const stats = await ParticipantService.getMeetingStats(meetingId);
      
      return res.status(200).json(
        ApiResponse.success(stats, 'Meeting statistics fetched successfully')
      );
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Failed to fetch meeting statistics', 500, error.message)
      );
    }
  }

  static async checkCanJoin(req, res) {
    try {
      const { meetingCode } = req.params;
      const userId = req.user.userId;
      
      const result = await ParticipantService.canUserJoinMeeting(userId, meetingCode);
      
      if (!result.canJoin) {
        return res.status(400).json(
          ApiResponse.badRequest(result.reason)
        );
      }
      
      return res.status(200).json(
        ApiResponse.success(result, 'User can join meeting')
      );
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Failed to check join eligibility', 500, error.message)
      );
    }
  }

  static async getParticipantHistory(req, res) {
    try {
      const { meetingId } = req.params;
      
      const history = await ParticipantService.getParticipantHistory(meetingId);
      
      return res.status(200).json(
        ApiResponse.success(history, 'Participant history fetched successfully')
      );
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Failed to fetch participant history', 500, error.message)
      );
    }
  }

  // Cleanup endpoint (can be called by cron job)
  static async cleanupExpiredMeetings(req, res) {
    try {
      const result = await ParticipantService.cleanupExpiredMeetings();
      
      return res.status(200).json(
        ApiResponse.success(result, 'Expired meetings cleaned up successfully')
      );
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Failed to cleanup expired meetings', 500, error.message)
      );
    }
  }
}