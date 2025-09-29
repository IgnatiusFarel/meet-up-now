// hooks/useWebSocketParticipants.js
import { useEffect, useRef } from 'react';
import socket from '@/services/Socket'; 
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
    clearParticipants,
    handleParticipantUpdate
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
      
      // Notify participant store
      handleParticipantUpdate({
        type: 'meeting:joined',
        data
      });
    };

    const handleUserJoined = (data) => {
      console.log('[WebSocket] User joined:', data);
      if (data.user && data.user.userId !== user.userId) {
        // Add to participant store
        addParticipant({
          user: data.user,
          joinedAt: data.timestamp || new Date().toISOString(),
          isMicOn: data.isMicOn ?? true,
          isCameraOn: data.isCameraOn ?? true,
          isOwner: data.isOwner ?? false,
          status: 'active',
          role: data.role || 'participant'
        });

        // Also trigger WebRTC signaling if needed
        handleParticipantUpdate({
          type: 'participant:joined',
          data: { participant: data }
        });
      }
    };

    const handleUserLeft = (data) => {
      console.log('[WebSocket] User left:', data);
      if (data.user && data.user.userId !== user.userId) {
        removeParticipant(data.user.userId);
        
        // Trigger cleanup
        handleParticipantUpdate({
          type: 'participant:left',
          data: { userId: data.user.userId }
        });
      }
    };

    const handleUserDisconnected = (data) => {
      console.log('[WebSocket] User disconnected:', data);
      if (data.user && data.user.userId !== user.userId) {
        removeParticipant(data.user.userId);
        
        // Trigger cleanup
        handleParticipantUpdate({
          type: 'participant:left',
          data: { userId: data.user.userId }
        });
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
        
        // Trigger participant update
        handleParticipantUpdate({
          type: 'participant:status_changed',
          data: { 
            userId: data.userId,
            updates: {
              isMicOn: data.isMicOn,
              isCameraOn: data.isCameraOn,
              isScreenShare: data.isScreenShare
            }
          }
        });
      }
    };

    const handleMeetingEnded = (data) => {
      console.log('[WebSocket] Meeting ended:', data);
      clearParticipants();
      
      handleParticipantUpdate({
        type: 'meeting:ended',
        data
      });
    };

    const handleError = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    // WebRTC Signaling Event Handlers
    const handleWebRTCOffer = (data) => {
      console.log('[WebSocket] WebRTC Offer received:', data);
      // This will be handled by useWebRTC hook
      currentSocket.emit('webrtc-offer-received', data);
    };

    const handleWebRTCAnswer = (data) => {
      console.log('[WebSocket] WebRTC Answer received:', data);
      // This will be handled by useWebRTC hook
      currentSocket.emit('webrtc-answer-received', data);
    };

    const handleWebRTCIceCandidate = (data) => {
      console.log('[WebSocket] WebRTC ICE Candidate received:', data);
      // This will be handled by useWebRTC hook
      currentSocket.emit('webrtc-ice-candidate-received', data);
    };

    // Register event listeners for participant management
    currentSocket.on('meeting-joined', handleMeetingJoined);
    currentSocket.on('user-joined', handleUserJoined);
    currentSocket.on('user-left', handleUserLeft);
    currentSocket.on('user-disconnected', handleUserDisconnected);
    currentSocket.on('participants-update', handleParticipantsUpdate);
    currentSocket.on('participant-status-updated', handleParticipantStatusUpdate);
    currentSocket.on('meeting-ended', handleMeetingEnded);
    currentSocket.on('error', handleError);

    // Register WebRTC signaling listeners
    currentSocket.on('webrtc-offer', handleWebRTCOffer);
    currentSocket.on('webrtc-answer', handleWebRTCAnswer);
    currentSocket.on('ice-candidate', handleWebRTCIceCandidate);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up listeners and leaving meeting');
      
      // Remove participant management listeners
      currentSocket.off('meeting-joined', handleMeetingJoined);
      currentSocket.off('user-joined', handleUserJoined);
      currentSocket.off('user-left', handleUserLeft);
      currentSocket.off('user-disconnected', handleUserDisconnected);
      currentSocket.off('participants-update', handleParticipantsUpdate);
      currentSocket.off('participant-status-updated', handleParticipantStatusUpdate);
      currentSocket.off('meeting-ended', handleMeetingEnded);
      currentSocket.off('error', handleError);

      // Remove WebRTC signaling listeners
      currentSocket.off('webrtc-offer', handleWebRTCOffer);
      currentSocket.off('webrtc-answer', handleWebRTCAnswer);
      currentSocket.off('ice-candidate', handleWebRTCIceCandidate);

      // Leave meeting room
      currentSocket.emit('leave-meeting', { meetingCode });
    };
  }, [meetingCode, isActive, user?.userId, addParticipant, removeParticipant, updateParticipant, setParticipants, clearParticipants, handleParticipantUpdate]);

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
    if (socketRef.current && content.trim()) {
      console.log('[WebSocket] Sending chat message:', content);
      socketRef.current.emit('send-message', { 
        meetingId, 
        content: content.trim(),
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
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

  // WebRTC Signaling Functions
  const sendWebRTCOffer = (meetingId, targetParticipant, offer) => {
    if (socketRef.current) {
      console.log('[WebSocket] Sending WebRTC offer to:', targetParticipant);
      socketRef.current.emit('webrtc-offer', {
        meetingId,
        targetParticipant,
        offer,
        fromParticipant: user?.userId
      });
    }
  };

  const sendWebRTCAnswer = (meetingId, targetParticipant, answer) => {
    if (socketRef.current) {
      console.log('[WebSocket] Sending WebRTC answer to:', targetParticipant);
      socketRef.current.emit('webrtc-answer', {
        meetingId,
        targetParticipant,
        answer,
        fromParticipant: user?.userId
      });
    }
  };

  const sendWebRTCIceCandidate = (meetingId, targetParticipant, candidate) => {
    if (socketRef.current) {
      console.log('[WebSocket] Sending ICE candidate to:', targetParticipant);
      socketRef.current.emit('ice-candidate', {
        meetingId,
        targetParticipant,
        candidate,
        fromParticipant: user?.userId
      });
    }
  };

  // Connection management
  const reconnect = () => {
    console.log('[WebSocket] Manual reconnection requested');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  const getConnectionStatus = () => {
    return {
      connected: socketRef.current?.connected || false,
      id: socketRef.current?.id,
      transport: socketRef.current?.io?.engine?.transport?.name
    };
  };

  return {
    // Participant management
    updateMyMediaStatus,
    endMeeting,
    
    // Chat functions
    sendChatMessage,
    startTyping,
    stopTyping,
    
    // WebRTC signaling
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendWebRTCIceCandidate,
    
    // Connection management
    reconnect,
    getConnectionStatus,
    isConnected: socketRef.current?.connected || false,
    socket: socketRef.current
  };
};

export default useWebSocketParticipants;