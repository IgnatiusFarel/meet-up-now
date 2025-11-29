import {
  UserGroupIcon as UserGroupSolidIcon,
  PaintBrushIcon as PaintBrushSolidIcon,
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftSolidIcon,
} from "@heroicons/react/24/solid";
import SidebarParticipants from "./SidebarParticipants.jsx";
import SidebarChat from "./SidebarChat.jsx";
import SidebarArtboard from "./SidebarArtboard.jsx";

const Sidebar = ({ activeSidebar, toggleSidebar, participants }) => {
  if (!activeSidebar) return null;

  return (
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
          <UserGroupSolidIcon className="w-5 h-5" /> Participants ({participants.length})
        </button>
        <button
          onClick={() => toggleSidebar("chat")}
          className={`flex-1 px-4 py-3 text-sm font-medium flex flex-col items-center justify-center ${
            activeSidebar === "chat"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600"
          }`}
        >
          <ChatBubbleOvalLeftSolidIcon className="w-5 h-5" /> <span>Chat</span>
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
          <SidebarParticipants participants={participants} />
        )}
        {activeSidebar === "chat" && <SidebarChat />}
        {activeSidebar === "artboard" && <SidebarArtboard />}
      </div>
    </div>
  );
};

export default Sidebar;
