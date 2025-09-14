import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MeetingService {
  static async createMeeting(ownerId, title) {
    // Generate unique meeting code with retry mechanism
    let meetingCode;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      attempts++;

      // Check if code already exists
      const existing = await prisma.meeting.findUnique({
        where: { meetingCode },
        select: { meetingId: true },
      });

      if (!existing) break;

      if (attempts >= maxAttempts) {
        throw new Error("Unable to generate unique meeting code");
      }
    } while (true);

    return prisma.meeting.create({
      data: {
        meetingCode,
        ownerId,
        title,
      },
      include: {
        owner: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
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

  static async getMeetingByCode(meetingCode) {
    const meeting = await prisma.meeting.findUnique({
      where: { meetingCode },
      include: {
        owner: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
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

    // Also return meeting statistics
    if (meeting) {
      meeting.stats = {
        activeParticipants: meeting.participants.length,
        isOwnerPresent: meeting.participants.some(
          (p) => p.userId === meeting.ownerId
        ),
        duration: meeting.createdAt
          ? Math.floor((new Date() - meeting.createdAt) / 60000)
          : 0,
      };
    }

    return meeting;
  }

  static async joinMeeting(userId, meetingCode) {
    // Use transaction for data consistency
    return await prisma.$transaction(async (tx) => {
      // Check if meeting exists and is active
      const meeting = await tx.meeting.findUnique({
        where: { meetingCode },
        select: {
          meetingId: true,
          endedAt: true,
          title: true,
          ownerId: true,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found!");
      }

      if (meeting.endedAt) {
        throw new Error("Meeting has ended!");
      }

      // Check if user is already in the meeting
      const existingParticipant = await tx.meetingParticipant.findFirst({
        where: {
          userId,
          meetingId: meeting.meetingId,
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

      if (existingParticipant) {
        // Update joinedAt to refresh presence
        await tx.meetingParticipant.update({
          where: { participantId: existingParticipant.participantId },
          data: { joinedAt: new Date() },
        });

        return existingParticipant;
      }

      // Create new participant
     return tx.meetingParticipant.upsert({
  where: {
    userId_meetingId: {
      userId,
      meetingId: meeting.meetingId,
    },
  },
  update: {
    joinedAt: new Date(),
    leftAt: null, // kalau sebelumnya sudah left, reset
  },
  create: {
    userId,
    meetingId: meeting.meetingId,
    isMicOn: true,
    isCameraOn: false,
    isScreenShare: false,
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
    meeting: {
      select: {
        meetingId: true,
        meetingCode: true,
        title: true,
        ownerId: true,
      },
    },
  },
});

    });
  }

  static async leaveMeeting(userId, meetingId) {
    return await prisma.$transaction(async (tx) => {
      // Update participant to mark as left
      const result = await tx.meetingParticipant.updateMany({
        where: {
          userId,
          meetingId,
          leftAt: null,
        },
        data: { leftAt: new Date() },
      });

      // Check if there are any active participants left
      const activeParticipants = await tx.meetingParticipant.count({
        where: {
          meetingId,
          leftAt: null,
        },
      });

      // If no active participants and meeting owner left, auto-end meeting
      if (activeParticipants === 0) {
        await tx.meeting.update({
          where: { meetingId },
          data: { endedAt: new Date() },
        });
      }

      return result;
    });
  }

  static async endMeeting(meetingId, ownerId) {
    return await prisma.$transaction(async (tx) => {
      // Verify owner
      const meeting = await tx.meeting.findUnique({
        where: { meetingId },
        select: { ownerId: true, endedAt: true, meetingCode: true },
      });

      if (!meeting) {
        throw new Error("Meeting not found!");
      }

      if (meeting.ownerId !== ownerId) {
        throw new Error("Only meeting owner can end the meeting!");
      }

      if (meeting.endedAt) {
        throw new Error("Meeting already ended!");
      }

      // End meeting and remove all participants
      await tx.meetingParticipant.updateMany({
        where: {
          meetingId,
          leftAt: null,
        },
        data: { leftAt: new Date() },
      });

      return tx.meeting.update({
        where: { meetingId },
        data: { endedAt: new Date() },
        include: {
          owner: {
            select: { userId: true, name: true, email: true },
          },
        },
      });
    });
  }

  static async updateParticipantStatus(userId, meetingId, updates) {
    // Validate the meeting is still active
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { endedAt: true },
    });

    if (!meeting) {
      throw new Error("Meeting not found!");
    }

    if (meeting.endedAt) {
      throw new Error("Cannot update status: Meeting has ended!");
    }

    return prisma.meetingParticipant.updateMany({
      where: {
        userId,
        meetingId,
        leftAt: null,
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  static async getActiveMeetings(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
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
            select: {
              userId: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.meeting.count({
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
      }),
    ]);

    return {
      meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  static async checkMeetingExpiry(meetingCode) {
    return await prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.findUnique({
        where: { meetingCode },
        include: {
          participants: {
            where: { leftAt: null },
          },
        },
      });

      if (!meeting) return null;

      // Consider meeting expired if:
      // 1. No active participants for more than 30 minutes
      // 2. Or created more than 24 hours ago with no recent activity
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const shouldExpire =
        (meeting.participants.length === 0 &&
          meeting.updatedAt < thirtyMinutesAgo &&
          !meeting.endedAt) ||
        (meeting.createdAt < twentyFourHoursAgo && !meeting.endedAt);

      if (shouldExpire) {
        await tx.meeting.update({
          where: { meetingId: meeting.meetingId },
          data: { endedAt: new Date() },
        });
        return { ...meeting, endedAt: new Date(), expired: true };
      }

      return { ...meeting, expired: false };
    });
  }

  // New method for checking if user can join
  static async checkCanJoin(userId, meetingCode) {
    try {
      if (!meetingCode || !/^[A-Z0-9]{6}$/.test(meetingCode)) {
        return {
          canJoin: false,
          reason: "Invalid meeting code format",
          meeting: null,
        };
      }

      const meeting = await prisma.meeting.findUnique({
        where: { meetingCode },
        include: {
          owner: {
            select: {
              userId: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
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

      if (!meeting) {
        return {
          canJoin: false,
          reason: "Meeting not found!",
          meeting: null,
        };
      }

      if (meeting.endedAt) {
        return {
          canJoin: false,
          reason: "Meeting has ended",
          meeting: {
            meetingCode: meeting.meetingCode,
            title: meeting.title,
            owner: meeting.owner,
            endedAt: meeting.endedAt,
          },
        };
      }

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const isExpiredByInActivity =
        meeting.participants.length === 0 &&
        meeting.updatedAt < thirtyMinutesAgo;

      const isExpiredByAge = meeting.createdAt < twentyFourHoursAgo;

      if (isExpiredByInActivity || isExpiredByAge) {
        await prisma.meeting.update({
          where: { meetingId: meeting.meetingId },
          data: { endedAt: new Date() },
        });

        return {
          canJoin: false,
          reason: "Meeting expired",
          meeting: {
            meetingCode: meeting.meetingCode,
            title: meeting.title,
            owner: meeting.owner,
            expiredReason: isExpiredByAge
              ? "Meeting too old (24h+)"
              : "No activity for 30+ minutes",
          },
        };
      }

      const existingParticipant = meeting.participants.find(
        (p) => p.userId === userId
      );

      const duration = Math.floor((new Date() - meeting.createdAt) / 60000);

      let meetingStatus = "waiting";

      if (meeting.participants.length > 0) {
        const ownerPresent = meeting.participants.some(
          (p) => p.userId === meeting.ownerId
        );
        meetingStatus = ownerPresent ? "active" : "active_no_host";
      }

      return {
        canJoin: true,
        isAlreadyParticipant: !!existingParticipant,
        meeting: {
          meetingCode: meeting.meetingCode,
          title: meeting.title,
          owner: meeting.owner,
          participantCount: meeting.participants.length,
          duration,
          status: meetingStatus,
          isOwner: meeting.ownerId === userId,
          createdAt: meeting.createdAt,
        },
      };
    } catch (error) {
      console.error("Error is checkCanJoin:", error);
      return {
        canJoin: false,
        reason: "Failed to check meeting status!",
        meeting: null,
        error: error.message,
      };
    }
  }

  // Enhanced cleanup with better logic
  static async cleanupExpiredMeetings() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      // Find meetings that should be cleaned up
      const expiredMeetings = await tx.meeting.findMany({
        where: {
          OR: [
            // Meetings older than 24 hours
            {
              endedAt: null,
              createdAt: { lte: twentyFourHoursAgo },
            },
            // Meetings with no participants for over an hour
            {
              endedAt: null,
              updatedAt: { lte: oneHourAgo },
              participants: {
                none: { leftAt: null },
              },
            },
          ],
        },
        select: { meetingId: true, meetingCode: true, title: true },
      });

      if (expiredMeetings.length === 0) {
        return {
          cleanedCount: 0,
          message: "No expired meetings found!",
        };
      }

      // Mark participants as left
      await tx.meetingParticipant.updateMany({
        where: {
          meetingId: { in: expiredMeetings.map((m) => m.meetingId) },
          leftAt: null,
        },
        data: { leftAt: new Date() },
      });

      // Mark meetings as ended
      const result = await tx.meeting.updateMany({
        where: {
          meetingId: { in: expiredMeetings.map((m) => m.meetingId) },
        },
        data: { endedAt: new Date() },
      });

      return {
        cleanedCount: result.count,
        cleanedMeetings: expiredMeetings,
        message: `${result.count} expired meetings cleaned up successfully!`,
      };
    });
  }

  // Get meeting statistics
  static async getMeetingStatistics(meetingId) {
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      include: {
        participants: {
          include: {
            user: {
              select: { userId: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new Error("Meeting not found!");
    }

    const now = new Date();
    const duration = meeting.endedAt
      ? Math.floor((meeting.endedAt - meeting.createdAt) / 60000)
      : Math.floor((now - meeting.createdAt) / 60000);

    const activeParticipants = meeting.participants.filter((p) => !p.leftAt);
    const totalParticipants = meeting.participants.length;

    return {
      meetingId: meeting.meetingId,
      meetingCode: meeting.meetingCode,
      title: meeting.title,
      duration,
      status: meeting.endedAt ? "ended" : "active",
      activeParticipants: activeParticipants.length,
      totalParticipants,
      createdAt: meeting.createdAt,
      endedAt: meeting.endedAt,
    };
  }
}
