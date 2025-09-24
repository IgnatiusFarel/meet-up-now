import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ParticipantService {
  // Get all active participants in a meeting
  static async getActiveParticipants(meetingId, requesterId) {
    // First verify the meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { 
        meetingId: true, 
        ownerId: true,
        endedAt: true 
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.endedAt) {
      throw new Error('Meeting has ended');
    }

    // Check if requester is participant or owner
    const requesterIsParticipant = await prisma.meetingParticipant.findFirst({
      where: {
        meetingId,
        userId: requesterId,
        leftAt: null, // Only active participants
      },
    });

    if (!requesterIsParticipant && meeting.ownerId !== requesterId) {
      throw new Error('Not authorized to view participants');
    }

    // Get unique active participants (eliminate duplicates)
    const participants = await prisma.meetingParticipant.findMany({
      where: {
        meetingId,
        leftAt: null, // Only active participants
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc', // Most recent join first
      },
    });

    // Remove duplicates by keeping only the most recent entry per user
    const uniqueParticipants = [];
    const seenUserIds = new Set();

    for (const participant of participants) {
      if (!seenUserIds.has(participant.userId)) {
        uniqueParticipants.push(participant);
        seenUserIds.add(participant.userId);
      }
    }

    return uniqueParticipants;
  }
  // Update participant media status (mic, camera, screen share)
 static async updateMediaStatus(meetingId, userId, updates) {
    // Validate meeting exists and is active
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { endedAt: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.endedAt) {
      throw new Error('Meeting has ended');
    }

    // Validate updates
    const allowedUpdates = ['isMicOn', 'isCameraOn', 'isScreenShare'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && typeof value === 'boolean') {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }

    // Get the most recent active participant record for this user
    const activeParticipant = await prisma.meetingParticipant.findFirst({
      where: {
        userId,
        meetingId,
        leftAt: null,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    if (!activeParticipant) {
      throw new Error('Participant not found in meeting');
    }

    // Special handling for screen share - only one person can share at a time
    if (filteredUpdates.isScreenShare === true) {
      // Turn off screen share for all other participants
      await prisma.meetingParticipant.updateMany({
        where: {
          meetingId,
          userId: { not: userId },
          leftAt: null,
        },
        data: { isScreenShare: false },
      });
    }

    // Update the specific participant record
    const updated = await prisma.meetingParticipant.update({
      where: {
        participantId: activeParticipant.participantId,
      },
      data: {
        ...filteredUpdates,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updated;
  }

  static async cleanupDuplicateParticipants(meetingId) {
    const participants = await prisma.meetingParticipant.findMany({
      where: { meetingId },
      orderBy: {
        joinedAt: 'asc', // Keep oldest entries
      },
    });

    const userParticipantMap = new Map();
    const duplicatesToDelete = [];

    participants.forEach(participant => {
      if (userParticipantMap.has(participant.userId)) {
        // This is a duplicate, mark for deletion
        duplicatesToDelete.push(participant.participantId);
      } else {
        // First occurrence, keep it
        userParticipantMap.set(participant.userId, participant);
      }
    });

    if (duplicatesToDelete.length > 0) {
      await prisma.meetingParticipant.deleteMany({
        where: {
          participantId: { in: duplicatesToDelete },
        },
      });
    }

    return {
      duplicatesRemoved: duplicatesToDelete.length,
      uniqueParticipants: userParticipantMap.size,
    };
  }

  // Get specific participant status
  static async getParticipantStatus(userId, meetingId) {
    const participant = await prisma.meetingParticipant.findFirst({
      where: {
        userId,
        meetingId,
        leftAt: null,
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    return participant;
  }

  // Kick participant from meeting (owner only)
  static async kickParticipant(ownerId, meetingId, participantUserId) {
    // Verify owner
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { ownerId: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.ownerId !== ownerId) {
      throw new Error('Only meeting owner can kick participants');
    }

    if (meeting.ownerId === participantUserId) {
      throw new Error('Owner cannot kick themselves');
    }

    // Remove participant
    const updated = await prisma.meetingParticipant.updateMany({
      where: {
        userId: participantUserId,
        meetingId,
        leftAt: null,
      },
      data: { leftAt: new Date() },
    });

    if (updated.count === 0) {
      throw new Error('Participant not found or already left');
    }

    return { kicked: true, participantUserId };
  }

  // Mute/unmute participant (owner only)
  static async toggleParticipantMute(ownerId, meetingId, participantUserId, forceState = null) {
    // Verify owner
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { ownerId: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.ownerId !== ownerId) {
      throw new Error('Only meeting owner can control participant audio');
    }

    // Get current participant status
    const participant = await this.getParticipantStatus(participantUserId, meetingId);
    
    const newMicState = forceState !== null ? forceState : !participant.isMicOn;

    return this.updateParticipantMediaStatus(participantUserId, meetingId, {
      isMicOn: newMicState
    });
  }

  // Get meeting statistics
  static async getMeetingStats(meetingId) {
    const [
      totalParticipants,
      activeParticipants,
      participantsWithMicOn,
      participantsWithCameraOn,
      screenShareParticipant
    ] = await Promise.all([
      prisma.meetingParticipant.count({
        where: { meetingId }
      }),
      prisma.meetingParticipant.count({
        where: { meetingId, leftAt: null }
      }),
      prisma.meetingParticipant.count({
        where: { meetingId, leftAt: null, isMicOn: true }
      }),
      prisma.meetingParticipant.count({
        where: { meetingId, leftAt: null, isCameraOn: true }
      }),
      prisma.meetingParticipant.findFirst({
        where: { meetingId, leftAt: null, isScreenShare: true },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    return {
      totalParticipants,
      activeParticipants,
      participantsWithMicOn,
      participantsWithCameraOn,
      screenShareParticipant: screenShareParticipant?.user || null,
      isScreenShareActive: !!screenShareParticipant
    };
  }

  // Check if user can join meeting
  static async canUserJoinMeeting(userId, meetingCode) {
    const meeting = await prisma.meeting.findUnique({
      where: { meetingCode },
      select: {
        meetingId: true,
        endedAt: true,
        participants: {
          where: { leftAt: null },
          select: { userId: true }
        }
      }
    });

    if (!meeting) {
      return { canJoin: false, reason: 'Meeting not found' };
    }

    if (meeting.endedAt) {
      return { canJoin: false, reason: 'Meeting has ended' };
    }

    // Check if user is already in meeting
    const isAlreadyParticipant = meeting.participants.some(p => p.userId === userId);
    if (isAlreadyParticipant) {
      return { canJoin: false, reason: 'Already in meeting' };
    }

    // Check participant limit (optional)
    const MAX_PARTICIPANTS = process.env.MAX_MEETING_PARTICIPANTS || 50;
    if (meeting.participants.length >= MAX_PARTICIPANTS) {
      return { canJoin: false, reason: 'Meeting is full' };
    }

    return { canJoin: true, meetingId: meeting.meetingId };
  }

  // Auto-cleanup expired meetings
  static async cleanupExpiredMeetings() {
    // Find meetings with no active participants
    const expiredMeetings = await prisma.meeting.findMany({
      where: {
        endedAt: null,
        participants: {
          none: {
            leftAt: null
          }
        }
      },
      select: { meetingId: true, meetingCode: true }
    });

    if (expiredMeetings.length === 0) {
      return { cleanedUp: 0, meetings: [] };
    }

    // Mark these meetings as ended
    const meetingIds = expiredMeetings.map(m => m.meetingId);
    
    await prisma.meeting.updateMany({
      where: {
        meetingId: { in: meetingIds }
      },
      data: {
        endedAt: new Date()
      }
    });

    return {
      cleanedUp: expiredMeetings.length,
      meetings: expiredMeetings.map(m => m.meetingCode)
    };
  }

  // Get participant join/leave history
  static async getParticipantHistory(meetingId) {
    const allParticipants = await prisma.meetingParticipant.findMany({
      where: { meetingId },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return allParticipants.map(participant => ({
      ...participant,
      duration: participant.leftAt 
        ? Math.floor((new Date(participant.leftAt) - new Date(participant.joinedAt)) / 1000)
        : Math.floor((new Date() - new Date(participant.joinedAt)) / 1000),
      isActive: !participant.leftAt
    }));
  }
}