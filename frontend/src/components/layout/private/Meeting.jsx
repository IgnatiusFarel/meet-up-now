import { Button, Avatar } from "antd";
import { useState } from "react";
import useCurrentTime from "@/hooks/useCurrentTime";
import {
  StopIcon,
  Squares2X2Icon,
  UserGroupIcon,
  PaintBrushIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  PaperAirplaneIcon,
  ComputerDesktopIcon,
  VideoCameraSlashIcon,
  ChatBubbleOvalLeftIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon,
  PhoneXMarkIcon,
  UserGroupIcon as UserGroupSolidIcon,
  PaintBrushIcon as PaintBrushSolidIcon,
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftSolidIcon,
} from "@heroicons/react/24/solid";
import { MicrophoneSlashIcon } from "@sidekickicons/react/24/outline";
import { PushpinOutlined } from "@ant-design/icons";

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

  // Get pinned participant (displayed in main screen)
  const pinnedParticipant =
    participants.find((p) => p.id === pinnedParticipantId) || participants[0];
  // Get other participants (displayed in sidebar)
  const otherParticipants = participants.filter(
    (p) => p.id !== pinnedParticipantId
  );

  // Function to get flexible grid layout with max 32 participants and overflow handling
  const getGalleryLayoutClasses = (count) => {
    // Handle overflow - if more than 32, show only 32 with "X+ others" indicator
    const displayCount = Math.min(count, 32);

    if (displayCount <= 4) {
      return "grid-cols-4 grid-rows-1";
    } else if (displayCount <= 8) {
      return "grid-cols-4 grid-rows-2";
    } else if (displayCount <= 12) {
      return "grid-cols-4 grid-rows-3";
    } else if (displayCount <= 16) {
      return "grid-cols-4 grid-rows-4";
    } else if (displayCount <= 20) {
      return "grid-cols-4 grid-rows-5";
    } else if (displayCount <= 24) {
      return "grid-cols-4 grid-rows-6";
    } else if (displayCount <= 28) {
      return "grid-cols-4 grid-rows-7";
    } else {
      return "grid-cols-4 grid-rows-8";
    }
  };

  // Function to get participants to display (max 32, with overflow handling)
  const getDisplayParticipants = () => {
    if (participants.length <= 32) {
      return participants;
    }

    // Show first 31 participants + overflow indicator
    return participants.slice(0, 31);
  };

  // Function to get special positioning for odd numbers in last row
  const getSpecialPositioning = (index, totalDisplayed) => {
    const remainder = totalDisplayed % 4;
    const lastRowStart = Math.floor(totalDisplayed / 4) * 4;

    // If we're in the last row and it has odd numbers
    if (index >= lastRowStart && remainder > 0) {
      const positionInLastRow = index - lastRowStart;

      if (remainder === 1) {
        // 1 item: center it across all 4 columns
        return positionInLastRow === 0
          ? "col-span-4 justify-self-center max-w-sm"
          : "";
      } else if (remainder === 2) {
        // 2 items: center them in the middle 2 columns
        if (positionInLastRow === 0) return "col-start-2";
        if (positionInLastRow === 1) return "col-start-3";
      } else if (remainder === 3) {
        // 3 items: center them in columns 1, 2, 3 (skipping column 4)
        if (positionInLastRow === 0) return "col-start-1";
        if (positionInLastRow === 1) return "col-start-2";
        if (positionInLastRow === 2) return "col-start-3";
      }
    }

    return "";
  };

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

  const ParticipantCard = ({
    participant,
    isMain = false,
    onPin,
    isGalleryMode = false,
    specialClass = "",
    totalParticipants = 1,
    isOverflowCard = false,
  }) => {
    // Calculate responsive height for gallery mode
    const getGalleryHeight = () => {
      if (!isGalleryMode) return isMain ? "h-full" : "h-32";

      if (totalParticipants <= 4) return "h-48";
      if (totalParticipants <= 8) return "h-40";
      if (totalParticipants <= 16) return "h-36";
      if (totalParticipants <= 24) return "h-32";
      return "h-28";
    };

    // Overflow card for showing "X+ others"
    if (isOverflowCard) {
      const overflowCount = totalParticipants - 31;
      return (
        <div
          className={`relative bg-gray-700 rounded-xl overflow-hidden ${getGalleryHeight()} ${specialClass} 
          flex items-center justify-center cursor-default`}
        >
          <div className="text-center text-white">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-sm font-medium">+{overflowCount} others</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative bg-gray-900 rounded-xl overflow-hidden ${getGalleryHeight()} ${specialClass} 
          group hover:ring-2 hover:ring-blue-500 transition-all duration-200 cursor-pointer`}
      >
        {participant.camOn ? (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
            <div className="text-white text-center">
              <div
                className={`${
                  isMain && !isGalleryMode
                    ? "text-8xl"
                    : totalParticipants <= 4 && isGalleryMode
                    ? "text-6xl"
                    : totalParticipants <= 8 && isGalleryMode
                    ? "text-4xl"
                    : "text-3xl"
                } mb-2`}
              >
                <UserGroupIcon className="w-5 h-5" />
              </div>
              {((isMain && !isGalleryMode) ||
                (totalParticipants <= 4 && isGalleryMode)) && (
                <p className="text-base opacity-80">Camera Active</p>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div
                className={`${
                  isMain && !isGalleryMode
                    ? "text-8xl"
                    : totalParticipants <= 4 && isGalleryMode
                    ? "text-6xl"
                    : totalParticipants <= 8 && isGalleryMode
                    ? "text-4xl"
                    : "text-3xl"
                } mb-2`}
              >
                📷
              </div>
              <p
                className={`${
                  (isMain && !isGalleryMode) ||
                  (totalParticipants <= 4 && isGalleryMode)
                    ? "text-base"
                    : "text-sm"
                }`}
              >
                Camera Off
              </p>
            </div>
          </div>
        )}

        {/* Pin/Unpin Button */}
        {(!isMain || isGalleryMode) && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="small"
              className="bg-black bg-opacity-70 text-white border-none hover:bg-opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                onPin(participant.id);
              }}
            >
              <PushpinOutlined className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Pinned Indicator */}
        {isMain && !isGalleryMode && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1">
            <span>
              <PushpinOutlined />
            </span>
            <span>Pinned</span>
          </div>
        )}

        {/* Name Overlay */}
        <div className="absolute bottom-2 left-2 px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur-xl border border-white/20 text-white shadow-lg">
          <div className="flex items-center space-x-2">
            <Avatar
              size={
                isMain && !isGalleryMode ? 24 : totalParticipants <= 8 ? 20 : 16
              }
              className="bg-blue-600"
            >
              {participant.name.charAt(0)}
            </Avatar>
            <span
              className={`${
                (isMain && !isGalleryMode) ||
                (totalParticipants <= 8 && isGalleryMode)
                  ? "text-sm"
                  : "text-xs"
              } font-medium`}
            >
              {totalParticipants > 16
                ? participant.name.split(" ")[0]
                : participant.name}{" "}
              {participant.isMe ? "(You)" : ""}
            </span>
            {!participant.micOn && (
              <span className="text-red-400 text-xs">
                <MicrophoneSlashIcon className="w-5 h-5" />
              </span>
            )}
          </div>
        </div>

        {/* Presenter Badge */}
        {participant.isPresenter && (!isMain || isGalleryMode) && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-green-600/40 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-md flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-300" />
            <span>Host</span>
          </div>
        )}

        {/* Speaking Indicator */}
        {participant.micOn && (
          <div
            className={`absolute ${
              isMain && !isGalleryMode ? "top-4 left-4" : "top-2 left-2"
            } ${
              participant.isPresenter && (!isMain || isGalleryMode)
                ? "top-8 left-2"
                : ""
            }`}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse">
              Test
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-6">
          <div className="h-full flex">
            {viewMode === "focus" ? (
              <>
                {/* Focus Mode: Main Presenter View */}
                <div className="flex-1 pr-4">
                  <ParticipantCard
                    participant={pinnedParticipant}
                    isMain={true}
                  />
                </div>

                {/* Participants Sidebar */}
                <div className="w-48 grid grid-cols-1 gap-3 max-h-full overflow-y-auto">
                  {otherParticipants.map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      onPin={togglePin}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* Gallery Mode: Flexible grid layout with overflow handling */
              <div
                className={`w-full grid gap-3 place-items-stretch overflow-y-auto p-2 ${getGalleryLayoutClasses(
                  participants.length
                )}`}
              >
                {getDisplayParticipants().map((participant, index) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onPin={togglePin}
                    isGalleryMode={true}
                    specialClass={getSpecialPositioning(
                      index,
                      Math.min(participants.length, 32)
                    )}
                    totalParticipants={participants.length}
                  />
                ))}

                {/* Overflow indicator for 33+ participants */}
                {participants.length > 32 && (
                  <ParticipantCard
                    isOverflowCard={true}
                    isGalleryMode={true}
                    totalParticipants={participants.length}
                    specialClass={getSpecialPositioning(31, 32)}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Chat/Participants/Artboard */}
        {activeSidebar && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Sidebar Header */}
            <div className="flex border-b">
              <button
                onClick={() => toggleSidebar("participants")}
                className={`flex-1 px-4 py-3 text-sm font-medium flex flex-col items-center justify-center ${
                  activeSidebar === "participants"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <UserGroupSolidIcon className="w-5 h-5" /> Participants (
                {participants.length})
              </button>
              <button
                onClick={() => toggleSidebar("chat")}
                className={`flex-1 px-4 py-3 text-sm font-medium flex flex-col items-center justify-center ${
                  activeSidebar === "chat"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <ChatBubbleOvalLeftSolidIcon className="w-5 h-5" />{" "}
                <span>Chat</span>
              </button>
              <button
                onClick={() => toggleSidebar("artboard")}
                className={`flex-1 px-4 py-3 text-sm font-medium flex flex-col items-center justify-center ${
                  activeSidebar === "artboard"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <PaintBrushSolidIcon className="w-5 h-5" /> Artboard
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 p-4">
              {activeSidebar === "participants" && (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar size={32} className="bg-blue-600">
                          {participant.name.charAt(0)}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {participant.name}
                          </p>
                          {participant.isPresenter && (
                            <p className="text-xs text-green-600">Presenter</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <span
                          className={
                            participant.micOn
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {participant.micOn ? (
                            <MicrophoneIcon className="w-5 h-5" />
                          ) : (
                            <MicrophoneSlashIcon className="w-5 h-5" />
                          )}
                        </span>
                        <span
                          className={
                            participant.camOn
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {participant.camOn ? (
                            <VideoCameraIcon className="w-5 h-5" />
                          ) : (
                            <VideoCameraSlashIcon className="w-5 h-5" />
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSidebar === "chat" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 mb-4">
                    <p className="text-gray-500 text-sm text-center py-8">
                      No messages yet
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button type="primary" className="px-4">
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSidebar === "artboard" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-6xl mb-4">🎨</div>
                        <p className="text-lg font-medium mb-2">
                          Collaborative Artboard
                        </p>
                        <p className="text-sm">
                          Draw, sketch, and collaborate with participants
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col grid grid-cols-2 gap-2">
                    <Button size="small">
                      ✏️ Pen
                    </Button>
                    <Button size="small">
                      🖍️ Marker
                    </Button>
                    <Button size="small">
                      🧽 Eraser
                    </Button>
                    <Button size="small">
                      🗑️ Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <span className="text-sm text-gray-600">
            <span>
              {time} <span>|</span> 123-456-789
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
              {shareScreen ? (
                <ComputerDesktopIcon className="w-5 h-5" />
              ) : (
                <ComputerDesktopIcon className="w-5 h-5" />
              )}
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
              className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700"
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
            >
              <PhoneXMarkIcon className="w-5 h-5 text-red-600" /> End Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
