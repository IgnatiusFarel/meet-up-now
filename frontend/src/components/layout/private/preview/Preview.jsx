import { useNavigate, useParams } from "react-router-dom";
import { App } from "antd";
import { useEffect, useState, useCallback, useRef } from "react";
import useMeetingStore from "@/stores/MeetingStore";
import useParticipantStore from "@/stores/ParticipantStore";
import useWebSocketParticipants from "@/hooks/useWebSocketParticipants";
import useMediaDevices from "@/hooks/useMediaDevices";
import Header from "./Header";
import VideoPreview from "./VideoPreview";
import JoinSection from "./JoinSection";

const Preview = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [debugInfo, setDebugInfo] = useState([]);
  const [joining, setJoining] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use refs to prevent unnecessary re-renders
  const meetingRef = useRef(null); 
  const participantRefreshTimeoutRef = useRef(null);
  const streamRestartTimeoutRef = useRef(null);
  const isValidatingRef = useRef(false);

  // Meeting Store
  const { setLocalStream, joinMeeting } = useMeetingStore();
  const checkCanJoin = useMeetingStore((s) => s.checkCanJoin);
  const joinCheckResult = useMeetingStore((s) => s.joinCheckResult);
  const currentMeeting = useMeetingStore((s) => s.currentMeeting);
  const setCurrentUserStatus = useMeetingStore((s) => s.setCurrentUserStatus);

  // Participant Store - Use this instead of meeting store for participants
  const participants = useParticipantStore((s) => s.participants);
  const getActiveParticipants = useParticipantStore(
    (s) => s.getActiveParticipants
  );
  const getParticipantsByCode = useParticipantStore(
    (s) => s.getParticipantsByCode
  );

  const { isConnected } = useWebSocketParticipants(
    code,
    joinCheckResult?.canJoin
  );

  const getMeetingPreview = useParticipantStore((s) => s.getMeetingPreview);

  // Memoized debug log function
  const addDebugLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev, `[${timestamp}] ${message}`].slice(-10));
    console.log(`[DEBUG] ${message}`);
  }, []);

  // Use custom hook for media devices
  const {
    videoRef,
    streamRef,
    devices,
    selected,
    setSelected,
    micOn,
    camOn,
    error,
    loading,
    permissionGranted,
    requestPermissions,
    startStream,
    toggleMic,
    toggleCam,
    retry,
    stopAllTracks,
  } = useMediaDevices(addDebugLog);

  // Memoized validation function
  const validateMeetingAccess = useCallback(async () => {
    if (!code || isValidatingRef.current) return;

    // Validate code format first
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      message.error("Invalid meeting code format");
      navigate("/dashboard", { replace: true });
      return;
    }

    isValidatingRef.current = true;

    try {
      console.log("Validating access to meeting:", code);
      const result = await checkCanJoin(code); // ✅ Perbaikan: definisikan result di sini

      if (!result.canJoin) {
        // Handle different error cases
        switch (result.reason) {
          case "Meeting not found":
          case "Meeting not found!":
            message.error("Meeting not found! Please check the room code.");
            break;
          case "Meeting has ended":
          case "Meeting has ended!":
            message.error("This meeting has already ended.");
            break;
          case "Meeting expired":
            message.error("This meeting has expired.");
            break;
          default:
            message.error(result.reason || "Cannot access this meeting.");
        }
        navigate("/dashboard", { replace: true });
        return;
      }

      console.log("Meeting access validated:", result.meeting);

      // ✅ Perbaikan: Fetch participants menggunakan meetingCode atau meetingId
      if (result.meeting?.meetingId) {
        meetingRef.current = result.meeting.meetingId;
        
        try {
          // Coba fetch participants menggunakan meetingId
          await getActiveParticipants(result.meeting.meetingId);
          console.log("Participants fetched by meetingId for preview");
        } catch (participantError) {
          console.warn("Failed to fetch participants by meetingId, trying by code:", participantError);
          
          // Fallback: coba fetch menggunakan meetingCode
          try {
            await getParticipantsByCode(code);
            console.log("Participants fetched by meetingCode for preview");
          } catch (fallbackError) {
            console.warn("Failed to fetch participants by code as well:", fallbackError);
          }
        }
      }

    } catch (error) {
      console.error("Meeting validation error:", error);
      message.error("Failed to validate meeting access");
      navigate("/dashboard", { replace: true });
    } finally {
      isValidatingRef.current = false;
    }
  }, [code, checkCanJoin, navigate, message, getActiveParticipants, getParticipantsByCode]);

  // Validate meeting code and check if user can join - ONLY ONCE
  useEffect(() => {
    if (!code) {
      message.error("Meeting code is required");
      navigate("/dashboard", { replace: true });
      return;
    }

    validateMeetingAccess();
  }, [code]); // Only depend on code, not the function

  // Fetch participants when meeting data is available - ONLY ONCE per meeting
  useEffect(() => {
    if (currentMeeting?.meetingId && !isValidatingRef.current) {
      console.log("Current meeting available, fetching participants...");
      
      const fetchParticipants = async () => {
        try {
          await getActiveParticipants(currentMeeting.meetingId);
          console.log("Participants successfully fetched for current meeting");
        } catch (err) {
          console.warn("Failed to fetch participants by meetingId, trying by code...", err);
          
          // Fallback to fetching by code
          if (code) {
            try {
              await getParticipantsByCode(code);
              console.log("Participants fetched by code as fallback");
            } catch (fallbackErr) {
              console.warn("Failed to fetch participants by code as well:", fallbackErr);
            }
          }
        }
      };

      fetchParticipants();
    }
  }, [currentMeeting?.meetingId, code]);

  // Periodically refresh participants list - STABLE INTERVAL
  useEffect(() => {
    if (!currentMeeting?.meetingId && !code) return;

    // Clear existing timeout
    if (participantRefreshTimeoutRef.current) {
      clearInterval(participantRefreshTimeoutRef.current);
    }

    participantRefreshTimeoutRef.current = setInterval(async () => {
      try {
        if (currentMeeting?.meetingId) {
          await getActiveParticipants(currentMeeting.meetingId);
        } else if (code) {
          await getParticipantsByCode(code);
        }
      } catch (err) {
        console.warn("Failed to refresh participants:", err);
      }
    }, 10000); // Refresh every 10 seconds

    return () => {
      if (participantRefreshTimeoutRef.current) {
        clearInterval(participantRefreshTimeoutRef.current);
      }
    };
  }, [currentMeeting?.meetingId, code]);

  // Initialize ONLY ONCE on mount
  useEffect(() => {
    if (isInitialized) return;

    addDebugLog("Component mounted, requesting permissions...");
    requestPermissions();
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      addDebugLog("Component unmounting, cleaning up...");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Clear timeouts
      if (participantRefreshTimeoutRef.current) {
        clearInterval(participantRefreshTimeoutRef.current);
      }
      if (streamRestartTimeoutRef.current) {
        clearTimeout(streamRestartTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - run only once

  // Stream restart with proper dependency control
  useEffect(() => {
    if (!permissionGranted || !isInitialized) return;

    addDebugLog("Settings changed, scheduling stream restart...");

    // Clear existing timeout
    if (streamRestartTimeoutRef.current) {
      clearTimeout(streamRestartTimeoutRef.current);
    }

    // Debounce multiple rapid changes
    streamRestartTimeoutRef.current = setTimeout(() => {
      addDebugLog("Executing scheduled stream restart...");
      startStream();
    }, 100);

    return () => {
      if (streamRestartTimeoutRef.current) {
        clearTimeout(streamRestartTimeoutRef.current);
        addDebugLog("Stream restart cancelled (new change detected)");
      }
    };
  }, [
    permissionGranted,
    camOn,
    micOn,
    selected.camera,
    selected.microphone,
    isInitialized,
  ]);
useEffect(() => {
  if (!code) return;

  // Use getMeetingPreview instead for preview screen
  const refreshPreview = async () => {
    try {
      await getMeetingPreview(code);
    } catch (err) {
      console.warn("Failed to refresh preview:", err);
    }
  };

  // Refresh preview every 30 seconds (less frequent for preview)
  const interval = setInterval(refreshPreview, 30000);
  
  return () => clearInterval(interval);
}, [code, getMeetingPreview]);
  

  const handleJoinNow = async () => {
    if (!code) {
      message.error("Meeting code is missing!");
      return;
    }

    if (!permissionGranted) {
      message.error("Please allow camera and microphone access first");
      return;
    }

    setJoining(true);

    try {
      console.log("Joining meeting with code:", code);

      setLocalStream(streamRef.current);

      setCurrentUserStatus({
        isMicOn: micOn,
        isCameraOn: camOn,
        isScreenShare: false,
      });

      const participant = await joinMeeting(code);

      if (participant) {
        console.log("Successfully joined meeting:", participant);
        message.success("Joining meeting...");

        // Refresh participants after joining
        if (currentMeeting?.meetingId) {
          await getActiveParticipants(currentMeeting.meetingId);
        } else if (code) {
          await getParticipantsByCode(code);
        }

        navigate(`/meeting/${code}`, {
          replace: true,
          state: {
            MediaSettings: {
              isMicOn: micOn,
              isCameraOn: camOn,
              selectedDevices: selected,
            },
          },
        });
      } else {
        throw new Error("Failed to join meeting - no participant data");
      }
    } catch (error) {
      console.error("Join meeting error:", error);

      let errorMessage = "Failed to join meeting";

      if (error.response) {
        switch (error.response.status) {
          case 404:
            errorMessage = "Meeting not found, please check the room code!";
            break;
          case 410:
            errorMessage = "This meeting has ended!";
            break;
          default:
            errorMessage =
              error.response.data?.message || "Failed to join meeting";
        }
      } else {
        errorMessage = error.message || "Failed to join meeting";
      }
      message.error(errorMessage);

      if (error.response?.status === 404 || error.response?.status === 410) {
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      {/* Main Content */}
      <div className="flex flex-1 p-6 space-x-6">
        <VideoPreview
          videoRef={videoRef}
          loading={loading}
          error={error}
          camOn={camOn}
          micOn={micOn}
          permissionGranted={permissionGranted}
          toggleMic={toggleMic}
          toggleCam={toggleCam}
          retry={retry}
          addDebugLog={addDebugLog}
        />

        <JoinSection
          participants={participants}
          permissionGranted={permissionGranted}
          error={error}
          joining={joining}
          handleJoinNow={handleJoinNow}
          devices={devices}
          selected={selected}
          setSelected={setSelected}
          isConnected={isConnected}
          joinCheckResult={joinCheckResult}
          debugInfo={debugInfo}
        />
      </div>
    </>
  );
};

export default Preview;