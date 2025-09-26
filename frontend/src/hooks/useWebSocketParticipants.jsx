// hooks/useWebSocketParticipants.js
import { useEffect, useRef } from 'react';
import socket from '@/Services/Socket'; // Use your existing socket instance
import useParticipantStore from '@/stores/ParticipantStore';
import useAuthStore from '@/stores/AuthStore';

const useWebSocketParticipants = (meetingCode, isActive = true) => {
  const socketRef = useRef(socket);
  const user = useAuthStore(s => s.user);
  const { 
    addParticipant, 
    removeParticipant, 
    updateParticipant,
    setParticipants,
    clearParticipants 
  } = useParticipantStore();

  useEffect(() => {
    if (!meetingCode || !isActive || !user?.userId) {
      return;
    }

    console.log(`[WebSocket] Connecting to meeting: ${meetingCode}`);

    const currentSocket = socketRef.current;

    // Join meeting room - matching your backend event
    currentSocket.emit('join-meeting', { meetingCode });

    // Listen for events from your backend
    const handleMeetingJoined = (data) => {
      console.log('[WebSocket] Meeting joined:', data);
    };

    const handleUserJoined = (data) => {
      console.log('[WebSocket] User joined:', data);
      if (data.user && data.user.userId !== user.userId) {
        addParticipant({
          user: data.user,
          joinedAt: data.timestamp,
          isMicOn: true,
          isCameraOn: true,
          isOwner: false,
          status: 'active'
        });
      }
    };

    const handleUserLeft = (data) => {
      console.log('[WebSocket] User left:', data);
      if (data.user && data.user.userId !== user.userId) {
        removeParticipant(data.user.userId);
      }
    };

    const handleUserDisconnected = (data) => {
      console.log('[WebSocket] User disconnected:', data);
      if (data.user && data.user.userId !== user.userId) {
        removeParticipant(data.user.userId);
      }
    };

    const handleParticipantsUpdate = (participants) => {
      console.log('[WebSocket] Participants update:', participants);
      setParticipants(participants);
    };

    const handleParticipantStatusUpdate = (data) => {
      console.log('[WebSocket] Participant status updated:', data);
      if (data.userId !== user.userId) {
        updateParticipant(data.userId, {
          isMicOn: data.isMicOn,
          isCameraOn: data.isCameraOn,
          isScreenShare: data.isScreenShare
        });
      }
    };

    const handleMeetingEnded = (data) => {
      console.log('[WebSocket] Meeting ended:', data);
      clearParticipants();
    };

    const handleError = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    // Register event listeners
    currentSocket.on('meeting-joined', handleMeetingJoined);
    currentSocket.on('user-joined', handleUserJoined);
    currentSocket.on('user-left', handleUserLeft);
    currentSocket.on('user-disconnected', handleUserDisconnected);
    currentSocket.on('participants-update', handleParticipantsUpdate);
    currentSocket.on('participant-status-updated', handleParticipantStatusUpdate);
    currentSocket.on('meeting-ended', handleMeetingEnded);
    currentSocket.on('error', handleError);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up listeners and leaving meeting');
      
      // Remove event listeners
      currentSocket.off('meeting-joined', handleMeetingJoined);
      currentSocket.off('user-joined', handleUserJoined);
      currentSocket.off('user-left', handleUserLeft);
      currentSocket.off('user-disconnected', handleUserDisconnected);
      currentSocket.off('participants-update', handleParticipantsUpdate);
      currentSocket.off('participant-status-updated', handleParticipantStatusUpdate);
      currentSocket.off('meeting-ended', handleMeetingEnded);
      currentSocket.off('error', handleError);

      // Leave meeting room
      // Note: We don't need meetingId here since backend tracks it
      currentSocket.emit('leave-meeting', { meetingCode });
    };
  }, [meetingCode, isActive, user?.userId]);

  // Helper functions to interact with backend
  const updateMyMediaStatus = (meetingId, mediaStatus) => {
    if (socketRef.current && user?.userId) {
      console.log('[WebSocket] Updating my media status:', mediaStatus);
      socketRef.current.emit('update-participant-status', {
        meetingId,
        ...mediaStatus
      });
    }
  };

  const endMeeting = (meetingId) => {
    if (socketRef.current) {
      console.log('[WebSocket] Ending meeting:', meetingId);
      socketRef.current.emit('end-meeting', { meetingId });
    }
  };

  const sendChatMessage = (meetingId, content) => {
    if (socketRef.current) {
      console.log('[WebSocket] Sending chat message:', content);
      socketRef.current.emit('send-message', { meetingId, content });
    }
  };

  const startTyping = (meetingId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-start', { meetingId });
    }
  };

  const stopTyping = (meetingId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-stop', { meetingId });
    }
  };

  return {
    updateMyMediaStatus,
    endMeeting,
    sendChatMessage,
    startTyping,
    stopTyping,
    isConnected: socketRef.current?.connected || false
  };
};

export default useWebSocketParticipants;