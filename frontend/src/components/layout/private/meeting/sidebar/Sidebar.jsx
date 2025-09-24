import { useState } from "react";
import SidebarParticipants from "./SidebarParticipants";
import SidebarChat from "./SidebarChat";
import SidebarArtboard from "./SidebarArtboard";
import { UserGroupIcon, ChatBubbleLeftRightIcon, PencilIcon } from "@heroicons/react/24/outline";

const Sidebar = ({ participants, messages }) => {
  const [activeTab, setActiveTab] = useState("participants");

  return (
    <div className="w-80 h-full bg-white border-l flex flex-col">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("participants")}
          className={`flex-1 p-2 ${activeTab === "participants" ? "bg-gray-100" : ""}`}
        >
          <UserGroupIcon className="w-6 h-6 mx-auto" />
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 p-2 ${activeTab === "chat" ? "bg-gray-100" : ""}`}
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6 mx-auto" />
        </button>
        <button
          onClick={() => setActiveTab("artboard")}
          className={`flex-1 p-2 ${activeTab === "artboard" ? "bg-gray-100" : ""}`}
        >
          <PencilIcon className="w-6 h-6 mx-auto" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "participants" && <SidebarParticipants participants={participants} />}
        {activeTab === "chat" && <SidebarChat messages={messages} />}
        {activeTab === "artboard" && <SidebarArtboard />}
      </div>
    </div>
  );
};

export default Sidebar;
