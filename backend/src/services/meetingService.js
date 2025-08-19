import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MeetingService {
  static async createMeeting(ownerId, title) {
    const meetingCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    return prisma.meeting.create({
      data: {
        meetingCode,
        ownerId,
        title,
      },
      include: {
        owner: {
          select: { userId: true, name: true, email: true },
        },
      },
    });
  }

  static async getMeetingByCode(meetingCode) {
    return prisma.meeting.findUnique({
      where: { meetingCode },
      include: {
        owner: {
          select: { userId: true, name: true, email: true },
        },
        participants: {
          where: { leftAt: null }, // Only active participants
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
        },
      },
    });
  }

  // Perbaikan join meeting
  static async joinMeeting(userId, meetingCode) {
    // Check if meeting exists and is active
    const meeting = await this.getMeetingByCode(meetingCode);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    
    if (meeting.endedAt) {
      throw new Error('Meeting has ended');
    }

    // Check if user is already in the meeting
    const existingParticipant = await prisma.meetingParticipant.findFirst({
      where: {
        userId,
        meetingId: meeting.meetingId,
        leftAt: null,
      },
    });

    if (existingParticipant) {
      return existingParticipant;
    }

    // Create new participant
    return prisma.meetingParticipant.create({
      data: {
        userId,
        meetingId: meeting.meetingId,
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
  }

  static async leaveMeeting(userId, meetingId) {
    return prisma.meetingParticipant.updateMany({
      where: { 
        userId, 
        meetingId, 
        leftAt: null 
      },
      data: { leftAt: new Date() },
    });
  }

  static async endMeeting(meetingId, ownerId) {
    // Verify owner
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { ownerId: true, endedAt: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.ownerId !== ownerId) {
      throw new Error('Only meeting owner can end the meeting');
    }

    if (meeting.endedAt) {
      throw new Error('Meeting already ended');
    }

    // End meeting and remove all participants
    await prisma.meetingParticipant.updateMany({
      where: { 
        meetingId, 
        leftAt: null 
      },
      data: { leftAt: new Date() },
    });

    return prisma.meeting.update({
      where: { meetingId },
      data: { endedAt: new Date() },
    });
  }

  static async updateParticipantStatus(userId, meetingId, updates) {
    return prisma.meetingParticipant.updateMany({
      where: { 
        userId, 
        meetingId, 
        leftAt: null 
      },
      data: updates,
    });
  }

  static async getActiveMeetings(userId) {
    return prisma.meeting.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            participants: {
              some: {
                userId,
                leftAt: null,
              },
            },
          },
        ],
        endedAt: null,
      },
      include: {
        owner: {
          select: { userId: true, name: true, email: true },
        },
        participants: {
          where: { leftAt: null },
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
        },
      },
    });
  }

  // Check if meeting room is expired (no active participants)
  static async checkMeetingExpiry(meetingCode) {
    const meeting = await prisma.meeting.findUnique({
      where: { meetingCode },
      include: {
        participants: {
          where: { leftAt: null },
        },
      },
    });

    if (!meeting) return null;

    // If no active participants and meeting hasn't been explicitly ended
    if (meeting.participants.length === 0 && !meeting.endedAt) {
      await prisma.meeting.update({
        where: { meetingId: meeting.meetingId },
        data: { endedAt: new Date() },
      });
      return { ...meeting, endedAt: new Date(), expired: true };
    }

    return { ...meeting, expired: false };
  }
}