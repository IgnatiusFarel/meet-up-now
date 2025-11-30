// hooks/useWebRTC.js
import { useEffect, useRef, useCallback } from "react";
import socket from "@/services/Socket.jsx";

const useWebRTC = (
  meetingId,
  localStream,
  onRemoteStream,
  onParticipantLeft
) => {
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(localStream);

  // WebRTC Configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Add TURN servers for production
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'your-username',
      //   credential: 'your-password'
      // }
    ],
  };

  // Update local stream ref when prop changes
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Create peer connection for a specific participant
  const createPeerConnection = useCallback(
    (participantId) => {
      console.log(`📡 Creating peer connection for: ${participantId}`);

      const peerConnection = new RTCPeerConnection(rtcConfig);

      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`🧊 Sending ICE candidate to: ${participantId}`);
          socket.emit("ice-candidate", {
            meetingId,
            targetParticipant: participantId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log(`📹 Received remote stream from: ${participantId}`);
        const [remoteStream] = event.streams;
        if (onRemoteStream) {
          onRemoteStream(participantId, remoteStream);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(
          `🔗 Connection state for ${participantId}: ${peerConnection.connectionState}`
        );

        if (
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "closed"
        ) {
          cleanupPeerConnection(participantId);
        }
      };

      peerConnectionsRef.current.set(participantId, peerConnection);
      return peerConnection;
    },
    [meetingId, onRemoteStream]
  );

  // Cleanup peer connection
  const cleanupPeerConnection = useCallback(
    (participantId) => {
      console.log(`🧹 Cleaning up peer connection for: ${participantId}`);

      const peerConnection = peerConnectionsRef.current.get(participantId);
      if (peerConnection) {
        peerConnection.close();
        peerConnectionsRef.current.delete(participantId);
      }

      if (onParticipantLeft) {
        onParticipantLeft(participantId);
      }
    },
    [onParticipantLeft]
  );

  // Handle new participant joining
  const handleParticipantJoined = useCallback(
    async (participantId) => {
      console.log(`👋 Participant joined: ${participantId}`);

      if (peerConnectionsRef.current.has(participantId)) {
        console.log(`⚠️ Peer connection already exists for: ${participantId}`);
        return;
      }

      const peerConnection = createPeerConnection(participantId);

      try {
        // Create and send offer
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await peerConnection.setLocalDescription(offer);

        console.log(`📤 Sending offer to: ${participantId}`);
        socket.emit("webrtc-offer", {
          meetingId,
          targetParticipant: participantId,
          offer: offer,
        });
      } catch (error) {
        console.error(`❌ Error creating offer for ${participantId}:`, error);
        cleanupPeerConnection(participantId);
      }
    },
    [meetingId, createPeerConnection, cleanupPeerConnection]
  );

  // Handle receiving offer
  const handleOffer = useCallback(
    async (participantId, offer) => {
      console.log(`📥 Received offer from: ${participantId}`);

      let peerConnection = peerConnectionsRef.current.get(participantId);
      if (!peerConnection) {
        peerConnection = createPeerConnection(participantId);
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        // Create and send answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        console.log(`📤 Sending answer to: ${participantId}`);
        socket.emit("webrtc-answer", {
          meetingId,
          targetParticipant: participantId,
          answer: answer,
        });
      } catch (error) {
        console.error(`❌ Error handling offer from ${participantId}:`, error);
        cleanupPeerConnection(participantId);
      }
    },
    [createPeerConnection, cleanupPeerConnection, meetingId]
  );

  // Handle receiving answer
  const handleAnswer = useCallback(
    async (participantId, answer) => {
      console.log(`📥 Received answer from: ${participantId}`);

      const peerConnection = peerConnectionsRef.current.get(participantId);
      if (!peerConnection) {
        console.error(`❌ No peer connection found for: ${participantId}`);
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error(`❌ Error handling answer from ${participantId}:`, error);
        cleanupPeerConnection(participantId);
      }
    },
    [cleanupPeerConnection]
  );

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (participantId, candidate) => {
    console.log(`🧊 Received ICE candidate from: ${participantId}`);

    const peerConnection = peerConnectionsRef.current.get(participantId);
    if (!peerConnection) {
      console.error(`❌ No peer connection found for: ${participantId}`);
      return;
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error(
        `❌ Error adding ICE candidate from ${participantId}:`,
        error
      );
    }
  }, []);

  // Update local stream for all peer connections
  const updateLocalStream = useCallback((newStream) => {
    console.log(`🔄 Updating local stream for all peer connections`);

    localStreamRef.current = newStream;

    peerConnectionsRef.current.forEach((peerConnection, participantId) => {
      // Remove old tracks
      peerConnection.getSenders().forEach((sender) => {
        peerConnection.removeTrack(sender);
      });

      // Add new tracks
      if (newStream) {
        newStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, newStream);
        });
      }
    });
  }, []);

  // Enable/disable audio track
  const toggleAudio = useCallback((enabled) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }, []);

  // Enable/disable video track
  const toggleVideo = useCallback((enabled) => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }, []);

  // Cleanup all peer connections
  const cleanupAllConnections = useCallback(() => {
    console.log(`🧹 Cleaning up all peer connections`);

    peerConnectionsRef.current.forEach((peerConnection, participantId) => {
      peerConnection.close();
    });

    peerConnectionsRef.current.clear();
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!meetingId) return;

    console.log(`🔌 Setting up WebRTC listeners for meeting: ${meetingId}`);

    // WebRTC signaling event handlers
    const handleParticipantJoinedEvent = (data) => {
      if (data.meetingId === meetingId && data.participantId) {
        handleParticipantJoined(data.participantId);
      }
    };

    const handleParticipantLeftEvent = (data) => {
      if (data.meetingId === meetingId && data.participantId) {
        cleanupPeerConnection(data.participantId);
      }
    };

    const handleOfferEvent = (data) => {
      if (data.meetingId === meetingId && data.fromParticipant && data.offer) {
        handleOffer(data.fromParticipant, data.offer);
      }
    };

    const handleAnswerEvent = (data) => {
      if (data.meetingId === meetingId && data.fromParticipant && data.answer) {
        handleAnswer(data.fromParticipant, data.answer);
      }
    };

    const handleIceCandidateEvent = (data) => {
      if (
        data.meetingId === meetingId &&
        data.fromParticipant &&
        data.candidate
      ) {
        handleIceCandidate(data.fromParticipant, data.candidate);
      }
    };

    // Register event listeners
    socket.on("participant-joined-webrtc", handleParticipantJoinedEvent);
    socket.on("participant-left-webrtc", handleParticipantLeftEvent);
    socket.on("webrtc-offer", handleOfferEvent);
    socket.on("webrtc-answer", handleAnswerEvent);
    socket.on("ice-candidate", handleIceCandidateEvent);

    // Cleanup on unmount
    return () => {
      console.log(`🔌 Removing WebRTC listeners for meeting: ${meetingId}`);

      socket.off("participant-joined-webrtc", handleParticipantJoinedEvent);
      socket.off("participant-left-webrtc", handleParticipantLeftEvent);
      socket.off("webrtc-offer", handleOfferEvent);
      socket.off("webrtc-answer", handleAnswerEvent);
      socket.off("ice-candidate", handleIceCandidateEvent);

      cleanupAllConnections();
    };
  }, [
    meetingId,
    handleParticipantJoined,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupPeerConnection,
    cleanupAllConnections,
  ]);

  return {
    // Connection management
    handleParticipantJoined,
    cleanupPeerConnection,
    cleanupAllConnections,

    // Stream management
    updateLocalStream,
    toggleAudio,
    toggleVideo,

    // State
    peerConnections: peerConnectionsRef.current,
    connectedParticipants: Array.from(peerConnectionsRef.current.keys()),
  };
};

export default useWebRTC;
