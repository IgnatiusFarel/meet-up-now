import { ParticipantService } from '#services/participantService';
import { ApiResponse } from '#utils/response';

export class ParticipantController {
  
  /**
   * Get all active participants in a meeting
   * GET /meetings/:meetingId/participants
   */
  static async getActiveParticipants(req, res) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.userId; // For authorization check

      const participants = await ParticipantService.getActiveParticipants(meetingId, userId);
      
      return res.status(200).json(
        ApiResponse.success(participants, 'Active participants fetched successfully!')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Not authorized to view participants') {
        return res.status(403).json(ApiResponse.error('Forbidden: Not authorized to view participants!', 403));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to fetch participants!', 500, error.message)
      );
    }
  }

  /**
   * Update current user's media status (mic, camera, screen share)
   * PATCH /meetings/:meetingId/participants/status
   */
  static async updateMediaStatus(req, res) {
    try {
      const { meetingId } = req.params;
      const { isMicOn, isCameraOn, isScreenShare } = req.body;
      const userId = req.user.userId;

      // Validate request body
      const updates = {};
      if (typeof isMicOn === 'boolean') updates.isMicOn = isMicOn;
      if (typeof isCameraOn === 'boolean') updates.isCameraOn = isCameraOn;
      if (typeof isScreenShare === 'boolean') updates.isScreenShare = isScreenShare;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json(
          ApiResponse.badRequest('No valid status updates provided!', 400)
        );
      }

      const updatedParticipant = await ParticipantService.updateMediaStatus(
        meetingId, 
        userId, 
        updates
      );
      
      return res.status(200).json(
        ApiResponse.success(updatedParticipant, 'Media status updated successfully!')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Participant not found in meeting') {
        return res.status(404).json(ApiResponse.notFound('You are not a participant in this meeting!', 404));
      }
      if (error.message === 'Meeting has ended') {
        return res.status(410).json(ApiResponse.error('Meeting has ended!', 410));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to update media status!', 500, error.message)
      );
    }
  }

  /**
   * Get specific participant's status
   * GET /meetings/:meetingId/participants/:userId/status
   */
  static async getParticipantStatus(req, res) {
    try {
      const { meetingId, userId: targetUserId } = req.params;
      const requesterId = req.user.userId;

      const participantStatus = await ParticipantService.getParticipantStatus(
        meetingId, 
        targetUserId, 
        requesterId
      );
      
      return res.status(200).json(
        ApiResponse.success(participantStatus, 'Participant status fetched successfully!')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Participant not found') {
        return res.status(404).json(ApiResponse.notFound('Participant not found!', 404));
      }
      if (error.message === 'Not authorized to view participant status') {
        return res.status(403).json(ApiResponse.error('Forbidden: Not authorized to view participant status!', 403));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to fetch participant status!', 500, error.message)
      );
    }
  }

  /**
   * Kick a participant from meeting (owner/admin only)
   * DELETE /meetings/:meetingId/participants/:participantUserId/kick
   */
  static async kickParticipant(req, res) {
    try {
      const { meetingId, participantUserId } = req.params;
      const ownerId = req.user.userId;

      const result = await ParticipantService.kickParticipant(
        meetingId, 
        participantUserId, 
        ownerId
      );
      
      return res.status(200).json(
        ApiResponse.success(result, 'Participant kicked successfully!')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Only meeting owner can kick participants') {
        return res.status(403).json(ApiResponse.error('Forbidden: Only meeting owner can kick participants!', 403));
      }
      if (error.message === 'Participant not found in meeting') {
        return res.status(404).json(ApiResponse.notFound('Participant not found in meeting!', 404));
      }
      if (error.message === 'Cannot kick meeting owner') {
        return res.status(400).json(ApiResponse.badRequest('Cannot kick meeting owner!', 400));
      }
      if (error.message === 'Meeting has ended') {
        return res.status(410).json(ApiResponse.error('Meeting has ended!', 410));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to kick participant!', 500, error.message)
      );
    }
  }

  /**
   * Toggle participant mute (owner/admin only)
   * PATCH /meetings/:meetingId/participants/:participantUserId/mute
   */
  static async toggleParticipantMute(req, res) {
    try {
      const { meetingId, participantUserId } = req.params;
      const { mute } = req.body;
      const ownerId = req.user.userId;

      // Validate mute parameter
      if (typeof mute !== 'boolean') {
        return res.status(400).json(
          ApiResponse.badRequest('Mute parameter must be a boolean!', 400)
        );
      }

      const updatedParticipant = await ParticipantService.toggleParticipantMute(
        meetingId, 
        participantUserId, 
        ownerId, 
        mute
      );
      
      const action = mute ? 'muted' : 'unmuted';
      return res.status(200).json(
        ApiResponse.success(updatedParticipant, `Participant ${action} successfully!`)
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Only meeting owner can mute/unmute participants') {
        return res.status(403).json(ApiResponse.error('Forbidden: Only meeting owner can mute/unmute participants!', 403));
      }
      if (error.message === 'Participant not found in meeting') {
        return res.status(404).json(ApiResponse.notFound('Participant not found in meeting!', 404));
      }
      if (error.message === 'Meeting has ended') {
        return res.status(410).json(ApiResponse.error('Meeting has ended!', 410));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to toggle participant mute!', 500, error.message)
      );
    }
  }

  /**
   * Get meeting statistics
   * GET /meetings/:meetingId/stats
   */
  static async getMeetingStats(req, res) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.userId;

      const stats = await ParticipantService.getMeetingStats(meetingId, userId);
      
      return res.status(200).json(
        ApiResponse.success(stats, 'Meeting statistics fetched successfully!')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Not authorized to view meeting stats') {
        return res.status(403).json(ApiResponse.error('Forbidden: Not authorized to view meeting stats!', 403));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to fetch meeting statistics!', 500, error.message)
      );
    }
  }

  /**
   * Get participant join/leave history for a meeting
   * GET /meetings/:meetingId/history
   */
  static async getParticipantHistory(req, res) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.userId;

      const history = await ParticipantService.getParticipantHistory(meetingId, userId);
      
      return res.status(200).json(
        ApiResponse.success(history, 'Participant history fetched successfully!')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Not authorized to view participant history') {
        return res.status(403).json(ApiResponse.error('Forbidden: Not authorized to view participant history!', 403));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to fetch participant history!', 500, error.message)
      );
    }
  }

  /**
   * Check if user can join a specific meeting
   * GET /meetings/code/:meetingCode/can-join
   */
  static async checkCanJoin(req, res) {
    try {
      const { meetingCode } = req.params;
      const userId = req.user.userId;

      const canJoinResult = await ParticipantService.checkCanJoin(meetingCode, userId);
      
      return res.status(200).json(
        ApiResponse.success(canJoinResult, 'Join validation completed!')
      );
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      
      return res.status(500).json(
        ApiResponse.error('Failed to validate join permission!', 500, error.message)
      );
    }
  }

  /**
   * Cleanup expired meetings (admin/cron job function)
   * POST /meetings/cleanup/expired
   */
  static async cleanupExpiredMeetings(req, res) {
    try {
      const userId = req.user.userId;
      
      // Optional: Add admin role check
      // if (req.user.role !== 'admin') {
      //   return res.status(403).json(ApiResponse.error('Forbidden: Admin access required!', 403));
      // }

      const cleanupResult = await ParticipantService.cleanupExpiredMeetings(userId);
      
      return res.status(200).json(
        ApiResponse.success(cleanupResult, 'Expired meetings cleaned up successfully!')
      );
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Failed to cleanup expired meetings!', 500, error.message)
      );
    }
  }
}