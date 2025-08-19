import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ChatService {
  static async sendMessage(meetingId, senderId, content) {
    // Verify user is participant in the meeting
    const participant = await prisma.meetingParticipant.findFirst({
      where: {
        meetingId,
        userId: senderId,
        leftAt: null, // Still in meeting
      },
    });

    if (!participant) {
      throw new Error('User is not a participant in this meeting');
    }

    // Verify meeting is still active
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { endedAt: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.endedAt) {
      throw new Error('Cannot send message to ended meeting');
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        meetingId,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return message;
  }

  static async getMeetingMessages(meetingId, userId, limit = 50, cursor = null) {
    // Verify user is participant in the meeting
    const participant = await prisma.meetingParticipant.findFirst({
      where: {
        meetingId,
        userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error('User is not a participant in this meeting');
    }

    const whereClause = { meetingId };
    const orderBy = { createdAt: 'desc' };

    // Pagination with cursor
    if (cursor) {
      whereClause.messageId = {
        lt: cursor,
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      take: limit,
      orderBy,
      include: {
        sender: {
          select: {
            userId: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages.reverse(); // Return in chronological order
  }

  static async deleteMessage(messageId, userId) {
    const message = await prisma.chatMessage.findUnique({
      where: { messageId },
      include: {
        meeting: {
          select: { ownerId: true },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only sender or meeting owner can delete message
    if (message.senderId !== userId && message.meeting.ownerId !== userId) {
      throw new Error('Not authorized to delete this message');
    }

    await prisma.chatMessage.delete({
      where: { messageId },
    });

    return { messageId, deleted: true };
  }

  static async getMessageStats(meetingId, userId) {
    // Verify user is participant
    const participant = await prisma.meetingParticipant.findFirst({
      where: {
        meetingId,
        userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error('User is not a participant in this meeting');
    }

    const totalMessages = await prisma.chatMessage.count({
      where: { meetingId },
    });

    const messagesByUser = await prisma.chatMessage.groupBy({
      by: ['senderId'],
      where: { meetingId },
      _count: {
        messageId: true,
      },
    });

    const messagesWithSender = await Promise.all(
      messagesByUser.map(async (item) => {
        const sender = await prisma.user.findUnique({
          where: { userId: item.senderId },
          select: { name: true, email: true },
        });
        return {
          sender,
          count: item._count.messageId,
        };
      })
    );

    return {
      totalMessages,
      messagesByUser: messagesWithSender,
    };
  }

  // Clear all messages when meeting ends
  static async clearMeetingMessages(meetingId, ownerId) {
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      select: { ownerId: true },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    if (meeting.ownerId !== ownerId) {
      throw new Error('Only meeting owner can clear messages');
    }

    const deletedCount = await prisma.chatMessage.deleteMany({
      where: { meetingId },
    });

    return { deletedCount: deletedCount.count };
  }
}