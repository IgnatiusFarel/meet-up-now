import { Button } from "antd";
import {
  StopIcon,
  Squares2X2Icon,
  UserGroupIcon,
  PaintBrushIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  VideoCameraSlashIcon,
  ChatBubbleOvalLeftIcon,
} from "@heroicons/react/24/outline";
import { PhoneXMarkIcon } from "@heroicons/react/24/solid";
import { MicrophoneSlashIcon } from "@sidekickicons/react/24/outline";
import useMeetingStore from "@/stores/MeetingStore";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

const ControlBar = ({
  micOn,
  setMicOn,
  camOn,
  setCamOn,
  shareScreen,
  setShareScreen,
  viewMode,
  toggleViewMode,
  activeSidebar,
  toggleSidebar,
  time,
  meetingCode, // Add this prop to get meeting code from parent
}) => {
  const navigate = useNavigate();
  const params = useParams(); // Get URL params as fallback
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [isFetchingMeeting, setIsFetchingMeeting] = useState(false);

  // Meeting store actions
  const currentMeeting = useMeetingStore((s) => s.currentMeeting);
  const leaveMeeting = useMeetingStore((s) => s.leaveMeeting);
  const endMeeting = useMeetingStore((s) => s.endMeeting);
  const getMeetingByCode = useMeetingStore((s) => s.getMeetingByCode);
  const isLoading = useMeetingStore((s) => s.isLoading);

  // Effect to fetch meeting data if not available
  useEffect(() => {
    const fetchMeetingData = async () => {
      // Skip if meeting data already exists
      if (currentMeeting) return;

      // Get meeting code from props or URL params
      const code = meetingCode || params.code || params.meetingCode;

      if (!code) {
        console.error("No meeting code available to fetch meeting data");
        return;
      }

      setIsFetchingMeeting(true);
      try {
        await getMeetingByCode(code);
        console.log("Meeting data fetched successfully");
      } catch (error) {
        console.error("Failed to fetch meeting data:", error);
        // Optionally redirect to error page or dashboard
        // navigate("/dashboard");
      } finally {
        setIsFetchingMeeting(false);
      }
    };

    fetchMeetingData();
  }, [currentMeeting, meetingCode, params, getMeetingByCode]);

  /**
   * Get meeting code from current meeting or fallback sources
   * @returns {string} Meeting code or 'Loading...' or 'No Code'
   */
  const getMeetingCodeDisplay = () => {
    if (isFetchingMeeting) return "Loading...";

    if (currentMeeting && currentMeeting.code) {
      return currentMeeting.code;
    }

    // Fallback to props or URL params
    const fallbackCode = meetingCode || params.code || params.meetingCode;
    if (fallbackCode) return fallbackCode;

    return "No Code";
  };

  /**
   * Check if current user is the meeting owner
   * @returns {boolean} True if user is owner
   */
  const isCurrentUserOwner = () => {
    if (!currentMeeting) return false;

    // Get current user ID
    const currentUserId = getCurrentUserId();

    // Check different possible field names from backend
    return (
      currentMeeting.ownerId === currentUserId ||
      currentMeeting.owner_id === currentUserId ||
      currentMeeting.created_by === currentUserId ||
      currentMeeting.host_id === currentUserId ||
      currentMeeting.owner?.userId === currentUserId
    );
  };

  /**
   * Get current user ID - implement this based on your auth system
   * @returns {string|number} Current user ID
   */
  const getCurrentUserId = () => {
    // This should be implemented based on your authentication system
    // Examples:
    // return useAuthStore.getState().user?.id;
    // return localStorage.getItem('userId');
    // return JSON.parse(localStorage.getItem('user'))?.id;

    // For now, returning null - you need to implement this
    return null;
  };

  /**
   * Handle end or leave meeting based on user role
   */
  const handleEndOrLeaveMeeting = async () => {
    // If still fetching meeting data, wait or show message
    if (isFetchingMeeting) {
      console.log("Still fetching meeting data, please wait...");
      return;
    }

    if (!currentMeeting) {
      console.error("No current meeting found");

      // Try to navigate away gracefully
      const meetingId =
        currentMeeting?.meetingId ||
        currentMeeting?.id ||
        "f77a8839-30b2-44a8-a2bd-8db26bd7cdb0";
      if (meetingId) {
        // If we have a code but no meeting data, try to fetch first
        console.log("Attempting to fetch meeting data before leaving...");

        try {
          await getMeetingByCode(meetingId);
          // If successful, try again
          if (useMeetingStore.getState().currentMeeting) {
            return handleEndOrLeaveMeeting();
          }
        } catch (error) {
          console.error("Failed to fetch meeting before leaving:", error);
        }
      }

      // If still no meeting data, navigate to dashboard as fallback
      navigate("/dashboard");
      return;
    }

    setIsEndingMeeting(true);

    try {
      const isOwner = isCurrentUserOwner();

      if (isOwner) {
        // Owner ends the meeting
        console.log("Owner ending meeting...");
        await endMeeting(currentMeeting.id);

        // Navigate directly to dashboard for owner
        navigate("/dashboard");
      } else {
        // Regular user leaves the meeting
        console.log("User leaving meeting...");
        await leaveMeeting(currentMeeting.id);

        // Navigate to exit page for non-owner users
        navigate("/exit", {
          state: {
            meetingCode: currentMeeting.code,
            meetingTitle: currentMeeting.title,
          },
        });
      }
    } catch (error) {
      console.error("Error ending/leaving meeting:", error);

      // Even if API call fails, still navigate away for better UX
      if (currentMeeting && isCurrentUserOwner()) {
        navigate("/dashboard");
      } else {
        navigate("/exit", {
          state: {
            error: "Failed to leave meeting properly",
            meetingCode: currentMeeting?.code || getMeetingCodeDisplay(),
          },
        });
      }
    } finally {
      setIsEndingMeeting(false);
    }
  };

  /**
   * Get button text based on user role and loading states
   * @returns {string} Button text
   */
  const getEndButtonText = () => {
    if (isFetchingMeeting) return "Loading...";
    if (isEndingMeeting) {
      return isCurrentUserOwner() ? "Ending..." : "Leaving...";
    }

    // If no meeting data, show generic text
    if (!currentMeeting) return "Leave";

    return isCurrentUserOwner() ? "End Meeting" : "Leave Meeting";
  };

  return (
    <div className="bg-white border-t px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <span className="text-sm text-gray-600">
          <span>
            {time} <span>|</span> {getMeetingCodeDisplay()}
          </span>
        </span>

        {/* Center Controls */}
        <div className="flex items-center space-x-4">
          {/* Microphone */}
          <Button
            onClick={() => setMicOn(!micOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              micOn
                ? "bg-green-200 hover:bg-green-300 text-green-700"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            type="text"
          >
            {micOn ? (
              <MicrophoneIcon className="w-5 h-5" />
            ) : (
              <MicrophoneSlashIcon className="w-5 h-5" />
            )}
          </Button>

          {/* Camera */}
          <Button
            onClick={() => setCamOn(!camOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              camOn
                ? "bg-green-200 hover:bg-green-300 text-green-700"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            type="text"
          >
            {camOn ? (
              <VideoCameraIcon className="w-5 h-5" />
            ) : (
              <VideoCameraSlashIcon className="w-5 h-5" />
            )}
          </Button>

          {/* Share Screen */}
          <Button
            onClick={() => setShareScreen(!shareScreen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              shareScreen
                ? "bg-[#171717] group-hover:bg-[#2C2C2C] text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            type="primary"
          >
            <ComputerDesktopIcon className="w-5 h-5" />
          </Button>

          {/* View Mode Toggle */}
          <Button
            onClick={toggleViewMode}
            className={`h-12 px-4 rounded-full flex items-center space-x-2 transition-all ${
              viewMode === "gallery"
                ? "bg-[#171717] group-hover:bg-[#2C2C2C] text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            type="primary"
            title={
              viewMode === "gallery"
                ? "Switch to Focus Mode"
                : "Switch to Gallery Mode"
            }
          >
            <span>
              {viewMode === "gallery" ? (
                <Squares2X2Icon className="w-5 h-5" />
              ) : (
                <StopIcon className="w-5 h-5" />
              )}
            </span>
            <span className="text-sm font-medium">
              {viewMode === "gallery" ? "Gallery" : "Focus"}
            </span>
          </Button>

          {/* Participants */}
          <Button
            onClick={() => toggleSidebar("participants")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              activeSidebar === "participants"
                ? "bg-[#171717] group-hover:bg-[#2C2C2C] text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            type="primary"
          >
            <UserGroupIcon className="w-5 h-5" />
          </Button>

          {/* Chat */}
          <Button
            onClick={() => toggleSidebar("chat")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              activeSidebar === "chat"
                ? "bg-[#171717] group-hover:bg-[#2C2C2C] text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            type="primary"
          >
            <ChatBubbleOvalLeftIcon className="w-5 h-5" />
          </Button>

          {/* Artboard */}
          <Button
            onClick={() => toggleSidebar("artboard")}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              activeSidebar === "artboard"
                ? "bg-[#171717] group-hover:bg-[#2C2C2C] text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            type="primary"
          >
            <PaintBrushIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-4">
          <Button
            danger
            type="primary"
            className="px-6 py-2 h-12 rounded-full"
            onClick={handleEndOrLeaveMeeting}
            loading={isEndingMeeting || isLoading || isFetchingMeeting}
            disabled={isEndingMeeting || isLoading || isFetchingMeeting}
          >
            <PhoneXMarkIcon className="w-5 h-5 mr-2" />
            {getEndButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
