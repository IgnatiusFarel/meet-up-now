import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { App } from "antd";
import useCurrentTime from "@/hooks/useCurrentTime";
import useMeetingStore from "@/stores/MeetingStore.jsx";
import useParticipantStore from "@/stores/ParticipantStore.jsx";
import useWebSocketParticipants from "@/hooks/useWebSocketParticipants.jsx";
import useWebRTC from "@/hooks/useWebRTC.jsx";
import useAuthStore from "@/stores/AuthStore.jsx";
import ControlBar from "./ControlBar.jsx";
import Sidebar from "./sidebar/Sidebar.jsx";
import VideoArea from "./VideoArea.jsx";

const Meeting = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { time } = useCurrentTime();

  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const participantStreamsRef = useRef(new Map());
  const isInitializedRef = useRef(false);

  // Auth & Meeting stores
  const user = useAuthStore(s => s.user);
  const currentMeeting = useMeetingStore(s => s.currentMeeting);
  const localStream = useMeetingStore(s => s.localStream);
  const setLocalStream = useMeetingStore(s => s.setLocalStream);
  const leaveMeeting = useMeetingStore(s => s.leaveMeeting);

  // Participant store
  const {
    participants,
    getActiveParticipants,
    currentUserStatus,
    setCurrentUserStatus,
    updateMediaStatus,
    clearParticipants
  } = useParticipantStore();

  // Local state
  const [micOn, setMicOn] = useState(currentUserStatus.isMicOn);
  const [camOn, setCamOn] = useState(currentUserStatus.isCameraOn);
  const [shareScreen, setShareScreen] = useState(currentUserStatus.isScreenShare);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [viewMode, setViewMode] = useState("gallery");
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket connection for signaling
  const {
    updateMyMediaStatus,
    endMeeting: wsEndMeeting,
    sendChatMessage,
    isConnected: wsConnected
  } = useWebSocketParticipants(code, true);

  // WebRTC handlers
  const handleRemoteStream = useCallback((participantId, stream) => {
    console.log(`Received remote stream from: ${participantId}`);
    participantStreamsRef.current.set(participantId, stream);
    // Force re-render to update participant with new stream
    setIsLoading(prev => !prev && prev); // Trigger minimal re-render
  }, []);

  const handleParticipantLeft = useCallback((participantId) => {
    console.log(`Cleaning up stream for: ${participantId}`);
    participantStreamsRef.current.delete(participantId);
  }, []);

  // WebRTC connection for media
  const {
    handleParticipantJoined: webrtcParticipantJoined,
    updateLocalStream: webrtcUpdateStream,
    toggleAudio,
    toggleVideo,
    cleanupAllConnections
  } = useWebRTC(
    currentMeeting?.meetingId,
    localStreamRef.current,
    handleRemoteStream,
    handleParticipantLeft
  );

  // Initialize meeting on component mount
  useEffect(() => {
    if (!code || !user?.userId || isInitializedRef.current) return;

    const initializeMeeting = async () => {
      try {
        console.log("Initializing meeting:", code);
        
        // Validate meeting access first
        if (!currentMeeting) {
          message.error("Meeting session not found. Please rejoin.");
          navigate("/dashboard", { replace: true });
          return;
        }

        // Get initial participants
        if (currentMeeting.meetingId) {
          await getActiveParticipants(currentMeeting.meetingId);
        }

        // Initialize media stream
        await initializeMediaStream();
        
        isInitializedRef.current = true;
        setIsLoading(false);
        
      } catch (error) {
        console.error("Failed to initialize meeting:", error);
        message.error("Failed to join meeting");
        navigate("/dashboard", { replace: true });
      }
    };

    initializeMeeting();
  }, [code, user?.userId, currentMeeting]);

  // Initialize media stream
  const initializeMediaStream = useCallback(async () => {
    try {
      console.log("Initializing media stream...");
      
      let stream = localStream;
      
      // Get stream if not available from preview
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: camOn,
          audio: micOn
        });
        setLocalStream(stream);
      }

      // Set up local video
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }
      
      localStreamRef.current = stream;
      
      // Update WebRTC with new stream
      webrtcUpdateStream(stream);
      
      // Update track states
      updateLocalTracks(stream);
      
    } catch (error) {
      console.error("Failed to initialize media stream:", error);
      message.error("Failed to access camera/microphone");
    }
  }, [localStream, micOn, camOn, setLocalStream, webrtcUpdateStream]);

  // Update local media tracks
  const updateLocalTracks = useCallback((stream = localStreamRef.current) => {
    if (!stream) return;
    
    // Use WebRTC methods for track control
    toggleAudio(micOn);
    toggleVideo(camOn);
  }, [micOn, camOn, toggleAudio, toggleVideo]);

  // Watch for new participants to establish WebRTC connections
  useEffect(() => {
    if (!currentMeeting?.meetingId || !user?.userId) return;

    participants.forEach(participant => {
      const participantId = participant.user?.userId;
      if (participantId && participantId !== user.userId) {
        // Check if we already have a connection with this participant
        if (!participantStreamsRef.current.has(participantId)) {
          console.log(`New participant detected, initiating WebRTC: ${participantId}`);
          webrtcParticipantJoined(participantId);
        }
      }
    });
  }, [participants, user?.userId, currentMeeting?.meetingId, webrtcParticipantJoined]);

  // Handle media status changes
  const handleMediaStatusChange = useCallback(async (updates) => {
    try {
      // Update local state
      if ('isMicOn' in updates) {
        setMicOn(updates.isMicOn);
        toggleAudio(updates.isMicOn);
      }
      if ('isCameraOn' in updates) {
        setCamOn(updates.isCameraOn);
        toggleVideo(updates.isCameraOn);
      }
      if ('isScreenShare' in updates) {
        setShareScreen(updates.isScreenShare);
        // TODO: Handle screen sharing
      }
      
      // Update store
      setCurrentUserStatus(updates);
      
      // Notify server
      if (currentMeeting?.meetingId) {
        await updateMediaStatus(currentMeeting.meetingId, updates);
        updateMyMediaStatus(currentMeeting.meetingId, updates);
      }
      
    } catch (error) {
      console.error("Failed to update media status:", error);
      message.error("Failed to update media settings");
    }
  }, [currentMeeting, setCurrentUserStatus, updateMediaStatus, updateMyMediaStatus, toggleAudio, toggleVideo]);

  // Convert participants data format for VideoArea component
  const formatParticipantsForVideo = useCallback(() => {
    const formatted = participants.map(p => {
      const participantId = p.user?.userId || p.userId;
      const isMe = participantId === user?.userId;
      
      return {
        id: participantId,
        name: p.user?.name || p.name || 'Unknown',
        isPresenter: p.isOwner || p.role === 'owner',
        micOn: p.isMicOn || false,
        camOn: p.isCameraOn || false,
        isMe,
        stream: isMe ? localStreamRef.current : participantStreamsRef.current.get(participantId),
        avatarUrl: p.user?.avatarUrl
      };
    });
    
    // Add current user if not in participants list
    const currentUserInList = formatted.find(p => p.isMe);
    if (!currentUserInList && user) {
      formatted.unshift({
        id: user.userId,
        name: user.name,
        isPresenter: currentMeeting?.ownerId === user.userId,
        micOn,
        camOn,
        isMe: true,
        stream: localStreamRef.current,
        avatarUrl: user.avatarUrl
      });
    }
    
    return formatted;
  }, [participants, user, currentMeeting, micOn, camOn]);

  // Function to handle sidebar toggles
  const toggleSidebar = useCallback((sidebarType) => {
    setActiveSidebar(current => current === sidebarType ? null : sidebarType);
  }, []);

  // Function to pin/unpin participant
  const togglePin = useCallback((participantId) => {
    setPinnedParticipantId(current => {
      const newPinned = current === participantId ? null : participantId;
      
      // Auto switch to focus mode when pinning someone
      if (newPinned && viewMode === "gallery") {
        setViewMode("focus");
      }
      
      return newPinned;
    });
  }, [viewMode]);

  // Function to toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode(current => current === "gallery" ? "focus" : "gallery");
  }, []);

  // Handle leaving meeting
  const handleLeaveMeeting = useCallback(async () => {
    try {
      console.log("Leaving meeting...");
      
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close WebRTC connections
      cleanupAllConnections();
      
      // Clear streams
      participantStreamsRef.current.clear();
      
      // Leave via API
      if (currentMeeting?.meetingId) {
        await leaveMeeting(currentMeeting.meetingId);
      }
      
      // Clear participant data
      clearParticipants();
      
      // Navigate back
      navigate("/dashboard", { replace: true });
      
    } catch (error) {
      console.error("Error leaving meeting:", error);
      // Navigate anyway
      navigate("/dashboard", { replace: true });
    }
  }, [currentMeeting, leaveMeeting, clearParticipants, navigate, cleanupAllConnections]);

  // Handle ending meeting (host only)
  const handleEndMeeting = useCallback(async () => {
    try {
      if (currentMeeting?.meetingId) {
        await wsEndMeeting(currentMeeting.meetingId);
        message.success("Meeting ended successfully");
      }
      handleLeaveMeeting();
    } catch (error) {
      console.error("Error ending meeting:", error);
      message.error("Failed to end meeting");
      handleLeaveMeeting();
    }
  }, [currentMeeting, wsEndMeeting, handleLeaveMeeting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Cleaning up meeting component...");
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      cleanupAllConnections();
      participantStreamsRef.current.clear();
    };
  }, [cleanupAllConnections]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Joining meeting...</p>
        </div>
      </div>
    );
  }

  const formattedParticipants = formatParticipantsForVideo();

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Hidden local video element for preview */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Main Video Area */}
        <VideoArea
          viewMode={viewMode}
          participants={formattedParticipants}
          pinnedParticipantId={pinnedParticipantId}
          togglePin={togglePin}
          currentUserId={user?.userId}
        />

        {/* Right Sidebar - Chat/Participants/Artboard */}
        <Sidebar
          activeSidebar={activeSidebar}
          toggleSidebar={toggleSidebar}
          participants={formattedParticipants}
          currentUserId={user?.userId}
          meetingId={currentMeeting?.meetingId}
          sendChatMessage={sendChatMessage}
        />
      </div>

      {/* Bottom Control Bar */}
      <ControlBar
        micOn={micOn}
        setMicOn={(value) => handleMediaStatusChange({ isMicOn: value })}
        camOn={camOn}
        setCamOn={(value) => handleMediaStatusChange({ isCameraOn: value })}
        shareScreen={shareScreen}
        setShareScreen={(value) => handleMediaStatusChange({ isScreenShare: value })}
        viewMode={viewMode}
        toggleViewMode={toggleViewMode}
        activeSidebar={activeSidebar}
        toggleSidebar={toggleSidebar}
        time={time}
        onLeaveMeeting={handleLeaveMeeting}
        onEndMeeting={handleEndMeeting}
        isHost={currentMeeting?.ownerId === user?.userId}
        isConnected={wsConnected}
        participantCount={formattedParticipants.length}
      />
    </div>
  );
};

export default Meeting;