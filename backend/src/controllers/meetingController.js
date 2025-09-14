import { ApiResponse } from '#utils/response';
import { MeetingService } from '#services/meetingService';

export class MeetingController {
  static async create(req, res) {
    try {
      const { title } = req.body;
      const ownerId = req.user.userId;

      // Validate title
      if (!title || title.trim().length === 0) {
        return res.status(400).json(
          ApiResponse.badRequest('Meeting title is required!')
        );
      }

      if (title.length > 100) {
        return res.status(400).json(
          ApiResponse.badRequest('Meeting title too long! Maximum 100 characters.')
        );
      }

      const meeting = await MeetingService.createMeeting(ownerId, title.trim());
      
      // Emit WebSocket event for real-time updates
      if (req.wsService) {
        req.wsService.emitToMeeting(meeting.meetingId, 'meeting:created', meeting);
      }

      return res.status(201).json(
        ApiResponse.success(meeting, 'Meeting created successfully!')
      );
    } catch (error) {
      console.error('Create meeting error:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to create meeting!', 500, error.message)
      );
    }
  }

  static async getByCode(req, res) {
    try {
      const { code } = req.params;

      // Validate meeting code format
      if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
        return res.status(400).json(
          ApiResponse.badRequest('Invalid meeting code format!')
        );
      }

      const meeting = await MeetingService.getMeetingByCode(code);

      if (!meeting) {
        return res.status(404).json(
          ApiResponse.notFound('Meeting not found!')
        );
      }

      // Check if meeting is expired
      const expiredCheck = await MeetingService.checkMeetingExpiry(code);
      if (expiredCheck && expiredCheck.expired) {
        return res.status(410).json(
          ApiResponse.error('Meeting has expired!')
        );
      }

      return res.status(200).json(
        ApiResponse.success(meeting, 'Meeting fetched successfully!')
      );
    } catch (error) {
      console.error('Get meeting by code error:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to fetch meeting!', 500, error.message)
      );
    }
  }

  static async join(req, res) {
    try {
      const { code } = req.body;
      const userId = req.user.userId;

      // Validate meeting code
      if (!code || !/^[A-Z0-9]{6}$/.test(code)) {
        return res.status(400).json(
          ApiResponse.badRequest('Invalid meeting code format!')
        );
      }

      const participant = await MeetingService.joinMeeting(userId, code);
      
      // Emit WebSocket events
      if (req.wsService && participant.meetingId) {
        // Notify all participants in the meeting
        req.wsService.emitToMeeting(participant.meetingId, 'participant:joined', {
          participant,
          message: `${participant.user.name} joined the meeting!`
        });
      }

      return res.status(200).json(
        ApiResponse.success(participant, 'Joined meeting successfully!')
      );
    } catch (error) {
      console.error('Join meeting error:', error);
      
      if (error.message === 'Meeting not found') {
        return res.status(404).json(
          ApiResponse.notFound('Meeting not found!')
        );
      }
      if (error.message === 'Meeting has ended') {
        return res.status(410).json(
          ApiResponse.error('Meeting has ended!')
        );
      }
      return res.status(500).json(
        ApiResponse.error('Failed to join meeting!', 500, error.message)
      );
    }
  }

  static async leave(req, res) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.userId;

      // Validate meetingId (assuming UUID format)
      if (!meetingId) {
        return res.status(400).json(
          ApiResponse.badRequest('Meeting ID is required!')
        );
      }

      const result = await MeetingService.leaveMeeting(userId, meetingId);
      
      // Emit WebSocket events
      if (req.wsService && result.count > 0) {
        req.wsService.emitToMeeting(meetingId, 'participant:left', {
          userId,
          message: `User left the meeting`
        });
      }

      return res.status(200).json(
        ApiResponse.success(null, 'Left meeting successfully!')
      );
    } catch (error) {
      console.error('Leave meeting error:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to leave meeting!', 500, error.message)
      );
    }
  }

  static async end(req, res) {
    try {
      const { meetingId } = req.params;
      const ownerId = req.user.userId;

      if (!meetingId) {
        return res.status(400).json(
          ApiResponse.badRequest('Meeting ID is required!')
        );
      }

      const meeting = await MeetingService.endMeeting(meetingId, ownerId);
      
      // Emit WebSocket events
      if (req.wsService) {
        req.wsService.emitToMeeting(meetingId, 'meeting:ended', {
          meeting,
          message: 'Meeting has been ended by the host'
        });
      }

      return res.status(200).json(
        ApiResponse.success(meeting, 'Meeting ended successfully!')
      );
    } catch (error) {
      console.error('End meeting error:', error);
      
      if (error.message === 'Meeting not found') {
        return res.status(404).json(
          ApiResponse.notFound('Meeting not found!')
        );
      }
      if (error.message === 'Only meeting owner can end the meeting') {
        return res.status(403).json(
          ApiResponse.error('Forbidden: Only meeting owner can end the meeting!')
        );
      }
      if (error.message === 'Meeting already ended') {
        return res.status(400).json(
          ApiResponse.badRequest('Meeting already ended!')
        );
      }
      return res.status(500).json(
        ApiResponse.error('Failed to end meeting!', 500, error.message)
      );
    }
  }

  static async getActiveMeetings(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;
      
      const meetings = await MeetingService.getActiveMeetings(
        userId, 
        parseInt(page), 
        parseInt(limit)
      );
      
      return res.status(200).json(
        ApiResponse.success(meetings, 'Active meetings fetched successfully!')
      );
    } catch (error) {
      console.error('Get active meetings error:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to fetch active meetings!', 500, error.message)
      );
    }
  }

  // Add missing methods that were referenced in the routes
  static async checkCanJoin(req, res) {
    try {
      const { meetingCode } = req.params;
      const userId = req.user.userId;

      if (!meetingCode || !/^[A-Z0-9]{6}$/.test(meetingCode)) {
        return res.status(400).json(
          ApiResponse.badRequest('Invalid meeting code format, Please enter a valid 6-character code!')
        );
      }

      console.log(`Checking if user ${userId} can join meeting ${meetingCode}`);      

      const result = await MeetingService.checkCanJoin(userId, meetingCode);

     
      if (!result.canJoin) { 
        switch (result.reason) {
          case 'Meeting not found!': 
          return res.status(404).json(
            ApiResponse.notFound('Meeting not found, Please check the room code!')
          );

          case 'Meeting has ended!': 
          return res.status(410).json(
            ApiResponse.error('This meeting has already ended!', 410)
          );

          case 'Meeting expired!': 
          return res.status(410).json(
            ApiResponse.error('This meeting has expired due to inactivity!', 410)
          ); 

          case 'Invalid meeting code format': 
          return res.status(400).json(
            ApiResponse.badRequest('Invalid meeting code format!')
          )
          
          default: 
          return res.status(400).json(
            ApiResponse.badRequest(result.reason || 'Cannot join this meeting!')
          )
        }
      }

       const responseMessage = result.isAlreadyParticipant ? 'You can rejoin this meeting!' : 'You can join this meeting!';      
      
      return res.status(200).json(
        ApiResponse.success(result, responseMessage)
      );
    } catch (error) {
      console.error('Check can join error:', error);      
      
       return res.status(500).json(
        ApiResponse.error('Unable to verify meeting status, please try again!', 500, error.message)
      );
    }
  }

  static async cleanupExpiredMeetings(req, res) {
    try {
      // This should typically be an admin-only endpoint
      // Add admin check here if needed
      
      const result = await MeetingService.cleanupExpiredMeetings();
      
      return res.status(200).json(
        ApiResponse.success(result, 'Cleanup completed successfully!')
      );
    } catch (error) {
      console.error('Cleanup expired meetings error:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to cleanup expired meetings!', 500, error.message)
      );
    }
  }

}