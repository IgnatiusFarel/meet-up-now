import { MeetingService } from '#services/meetingService';
import { ApiResponse } from '#utils/response';

export class MeetingController {
  static async create(req, res) {
    try {
      const { title } = req.body;
      const ownerId = req.user.userId;

      const meeting = await MeetingService.createMeeting(ownerId, title);
      return res.status(201).json(ApiResponse.success(meeting, 'Meeting created successfully!'));
    } catch (error) {
      return res.status(500).json(ApiResponse.error('Failed to create meeting!', 500, error.message));
    }
  }

  static async getByCode(req, res) {
    try {
      const { code } = req.params;

      const meeting = await MeetingService.getMeetingByCode(code);

      if (!meeting) {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }

      // Check if meeting is expired
      const expiredCheck = await MeetingService.checkMeetingExpiry(code);
      if (expiredCheck && expiredCheck.expired) {
        return res.status(410).json(ApiResponse.error('Meeting has expired!', 410));
      }

      return res.status(200).json(ApiResponse.success(meeting, 'Meeting fetched successfully!'));
    } catch (error) {
      return res.status(500).json(ApiResponse.error('Failed to fetch meeting!', 500, error.message));
    }
  }

  static async join(req, res) {
    try {
      const { code } = req.body; // Changed to get code from body
      const userId = req.user.userId;

      const participant = await MeetingService.joinMeeting(userId, code);
      return res.status(200).json(ApiResponse.success(participant, 'Joined meeting successfully!'));
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Meeting has ended') {
        return res.status(410).json(ApiResponse.error('Meeting has ended!', 410));
      }
      return res.status(500).json(ApiResponse.error('Failed to join meeting!', 500, error.message));
    }
  }

  static async leave(req, res) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.userId;

      await MeetingService.leaveMeeting(userId, meetingId);
      return res.status(200).json(ApiResponse.success(null, 'Left meeting successfully!'));
    } catch (error) {
      return res.status(500).json(ApiResponse.error('Failed to leave meeting!', 500, error.message));
    }
  }

  static async end(req, res) {
    try {
      const { meetingId } = req.params;
      const ownerId = req.user.userId;

      const meeting = await MeetingService.endMeeting(meetingId, ownerId);
      return res.status(200).json(ApiResponse.success(meeting, 'Meeting ended successfully!'));
    } catch (error) {
      if (error.message === 'Meeting not found') {
        return res.status(404).json(ApiResponse.notFound('Meeting not found!', 404));
      }
      if (error.message === 'Only meeting owner can end the meeting') {
        return res.status(403).json(ApiResponse.error('Forbidden: Only meeting owner can end the meeting!', 403));
      }
      if (error.message === 'Meeting already ended') {
        return res.status(400).json(ApiResponse.badRequest('Meeting already ended!', 400));
      }
      return res.status(500).json(ApiResponse.error('Failed to end meeting!', 500, error.message));
    }
  }

  static async updateStatus(req, res) {
    try {
      const { meetingId } = req.params;
      const { isMicOn, isCameraOn, isScreenShare } = req.body;
      const userId = req.user.userId;

      const updates = {};
      if (typeof isMicOn === 'boolean') updates.isMicOn = isMicOn;
      if (typeof isCameraOn === 'boolean') updates.isCameraOn = isCameraOn;
      if (typeof isScreenShare === 'boolean') updates.isScreenShare = isScreenShare;

      await MeetingService.updateParticipantStatus(userId, meetingId, updates);
      return res.status(200).json(ApiResponse.success(null, 'Status updated successfully!'));
    } catch (error) {
      return res.status(500).json(ApiResponse.error('Failed to update status!', 500, error.message));
    }
  }

  static async getActiveMeetings(req, res) {
    try {
      const userId = req.user.userId;
      const meetings = await MeetingService.getActiveMeetings(userId);
      return res.status(200).json(ApiResponse.success(meetings, 'Active meetings fetched successfully!'));
    } catch (error) {
      return res.status(500).json(ApiResponse.error('Failed to fetch active meetings!', 500, error.message));
    }
  }
}