import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { MeetingService } from '#services/meetingService';
import { ChatService } from '#services/chatService';

export class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          throw new Error('Authentication token required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.user = decoded;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected: ${socket.id}`);

      // Join meeting room
      socket.on('join-meeting', async (data) => {
        try {
          const { meetingCode } = data;
          
          // Verify meeting exists and user can join
          const meeting = await MeetingService.getMeetingByCode(meetingCode);
          if (!meeting) {
            socket.emit('error', { message: 'Meeting not found' });
            return;
          }

          if (meeting.endedAt) {
            socket.emit('error', { message: 'Meeting has ended' });
            return;
          }

          // Join the meeting room
          const roomName = `meeting-${meeting.meetingId}`;
          socket.join(roomName);
          socket.currentMeeting = meeting.meetingId;

          // Notify others that user joined
          socket.to(roomName).emit('user-joined', {
            user: socket.user,
            timestamp: new Date()
          });

          // Send current participants list to the user
          const participants = await this.getMeetingParticipants(meeting.meetingId);
          socket.emit('participants-update', participants);

          // Send meeting info
          socket.emit('meeting-joined', {
            meeting,
            roomId: roomName
          });

          console.log(`User ${socket.user.name} joined meeting ${meetingCode}`);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Leave meeting room
      socket.on('leave-meeting', async (data) => {
        try {
          const { meetingId } = data;
          const roomName = `meeting-${meetingId}`;
          
          socket.leave(roomName);
          
          // Notify others that user left
          socket.to(roomName).emit('user-left', {
            user: socket.user,
            timestamp: new Date()
          });

          // Update participant status in database
          await MeetingService.leaveMeeting(socket.userId, meetingId);

          socket.currentMeeting = null;
          console.log(`User ${socket.user.name} left meeting ${meetingId}`);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle participant status updates (mic, camera, screen share)
      socket.on('update-participant-status', async (data) => {
        try {
          const { meetingId, isMicOn, isCameraOn, isScreenShare } = data;
          
          // Update status in database
          const updates = {};
          if (typeof isMicOn === 'boolean') updates.isMicOn = isMicOn;
          if (typeof isCameraOn === 'boolean') updates.isCameraOn = isCameraOn;
          if (typeof isScreenShare === 'boolean') updates.isScreenShare = isScreenShare;

          await MeetingService.updateParticipantStatus(socket.userId, meetingId, updates);

          // Broadcast status update to all participants
          const roomName = `meeting-${meetingId}`;
          this.io.to(roomName).emit('participant-status-updated', {
            userId: socket.userId,
            user: socket.user,
            ...updates,
            timestamp: new Date()
          });

        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle chat messages
      socket.on('send-message', async (data) => {
        try {
          const { meetingId, content } = data;
          
          // Save message to database
          const message = await ChatService.sendMessage(meetingId, socket.userId, content);
          
          // Broadcast message to all meeting participants
          const roomName = `meeting-${meetingId}`;
          this.io.to(roomName).emit('new-message', message);

        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        const { meetingId } = data;
        const roomName = `meeting-${meetingId}`;
        socket.to(roomName).emit('user-typing', {
          userId: socket.userId,
          user: socket.user,
          isTyping: true
        });
      });

      socket.on('typing-stop', (data) => {
        const { meetingId } = data;
        const roomName = `meeting-${meetingId}`;
        socket.to(roomName).emit('user-typing', {
          userId: socket.userId,
          user: socket.user,
          isTyping: false
        });
      });

      // Handle end meeting (owner only)
      socket.on('end-meeting', async (data) => {
        try {
          const { meetingId } = data;
          
          // End meeting in database
          await MeetingService.endMeeting(meetingId, socket.userId);
          
          // Notify all participants
          const roomName = `meeting-${meetingId}`;
          this.io.to(roomName).emit('meeting-ended', {
            endedBy: socket.user,
            timestamp: new Date()
          });

          // Remove all clients from the room
          const socketsInRoom = await this.io.in(roomName).fetchSockets();
          socketsInRoom.forEach(s => s.leave(roomName));

          console.log(`Meeting ${meetingId} ended by ${socket.user.name}`);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle WebRTC signaling for video/audio
      socket.on('webrtc-offer', (data) => {
        const { meetingId, targetUserId, offer } = data;
        const roomName = `meeting-${meetingId}`;
        
        socket.to(roomName).emit('webrtc-offer', {
          fromUserId: socket.userId,
          fromUser: socket.user,
          targetUserId,
          offer
        });
      });

      socket.on('webrtc-answer', (data) => {
        const { meetingId, targetUserId, answer } = data;
        const roomName = `meeting-${meetingId}`;
        
        socket.to(roomName).emit('webrtc-answer', {
          fromUserId: socket.userId,
          fromUser: socket.user,
          targetUserId,
          answer
        });
      });

      socket.on('webrtc-ice-candidate', (data) => {
        const { meetingId, targetUserId, candidate } = data;
        const roomName = `meeting-${meetingId}`;
        
        socket.to(roomName).emit('webrtc-ice-candidate', {
          fromUserId: socket.userId,
          fromUser: socket.user,
          targetUserId,
          candidate
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`User ${socket.user.name} disconnected: ${socket.id}`);
        
        if (socket.currentMeeting) {
          const roomName = `meeting-${socket.currentMeeting}`;
          
          // Notify others that user disconnected
          socket.to(roomName).emit('user-disconnected', {
            user: socket.user,
            timestamp: new Date()
          });

          // Update database
          try {
            await MeetingService.leaveMeeting(socket.userId, socket.currentMeeting);
          } catch (error) {
            console.error('Error updating participant on disconnect:', error);
          }
        }
      });
    });
  }

  async getMeetingParticipants(meetingId) {
    try {
      const meeting = await MeetingService.getMeetingByCode();
      return meeting?.participants || [];
    } catch (error) {
      console.error('Error fetching meeting participants:', error);
      return [];
    }
  }

  // Helper method to broadcast to specific meeting
  broadcastToMeeting(meetingId, event, data) {
    this.io.to(`meeting-${meetingId}`).emit(event, data);
  }

  // Get connected users count for a meeting
  async getMeetingConnectionCount(meetingId) {
    const roomName = `meeting-${meetingId}`;
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.length;
  }
}