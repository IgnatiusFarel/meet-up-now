import { useState } from "react";
import useCurrentTime from "@/hooks/useCurrentTime";
import ControlBar from "./ControlBar";
import Sidebar from "./sidebar/Sidebar";
import VideoArea from "./VideoArea";

const Meeting = () => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [shareScreen, setShareScreen] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState(null); // 'participants', 'chat', 'artboard', or null
  const { time } = useCurrentTime();
  const [pinnedParticipantId, setPinnedParticipantId] = useState(1);
  const [viewMode, setViewMode] = useState("gallery");

  // Dummy participants data - you can change this array to test different counts
  const participants = [
    {
      id: 1,
      name: "John Doe",
      isPresenter: true,
      micOn: true,
      camOn: true,
      isMe: true,
    },
    {
      id: 2,
      name: "Sarah Wilson",
      isPresenter: false,
      micOn: true,
      camOn: true,
      isMe: false,
    },
    {
      id: 3,
      name: "Mike Chen",
      isPresenter: false,
      micOn: false,
      camOn: true,
      isMe: false,
    },
    // { id: 4, name: "Emily", isPresenter: false, micOn: true, camOn: false, isMe: false },
    // { id: 5, name: "David", isPresenter: false, micOn: true, camOn: true, isMe: false },
    // { id: 6, name: "Lisa", isPresenter: false, micOn: false, camOn: true, isMe: false },
    // { id: 7, name: "Tom", isPresenter: false, micOn: true, camOn: true, isMe: false },
    // { id: 8, name: "Anna", isPresenter: false, micOn: true, camOn: false, isMe: false },
  ];

  // Function to handle sidebar toggles
  const toggleSidebar = (sidebarType) => {
    setActiveSidebar(activeSidebar === sidebarType ? null : sidebarType);
  };

  // Function to pin/unpin participant
  const togglePin = (participantId) => {
    setPinnedParticipantId(participantId);
    // Auto switch to focus mode when pinning someone
    if (viewMode === "gallery") {
      setViewMode("focus");
    }
  };

  // Function to toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === "gallery" ? "focus" : "gallery");
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Main Video Area */}
        <VideoArea
          viewMode={viewMode}
          participants={participants}
          pinnedParticipantId={pinnedParticipantId}
          togglePin={togglePin}
        />

        {/* Right Sidebar - Chat/Participants/Artboard */}
        <Sidebar
          activeSidebar={activeSidebar}
          toggleSidebar={toggleSidebar}
          participants={participants}
        />
      </div>

      {/* Bottom Control Bar */}
      <ControlBar
        micOn={micOn}
        setMicOn={setMicOn}
        camOn={camOn}
        setCamOn={setCamOn}
        shareScreen={shareScreen}
        setShareScreen={setShareScreen}
        viewMode={viewMode}
        toggleViewMode={toggleViewMode}
        activeSidebar={activeSidebar}
        toggleSidebar={toggleSidebar}
        time={time}
      />
    </div>
  );
};

export default Meeting;