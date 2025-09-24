import { useState } from "react";
import VideoArea from "./VideoArea";
import Sidebar from "./Sidebar/Sidebar";

// contoh dummy data
const mockParticipants = [
  { id: "1", name: "Alice", isMicOn: true, isCameraOn: true, isLocal: false },
  { id: "2", name: "Bob", isMicOn: false, isCameraOn: false, isLocal: false },
  { id: "3", name: "You", isMicOn: true, isCameraOn: true, isLocal: true },
];

const mockMessages = [
  { sender: "Alice", text: "Hi everyone!" },
  { sender: "Bob", text: "Hello 👋" },
];

const MeetingPage = () => {
  const [participants] = useState(mockParticipants);
  const [messages] = useState(mockMessages);

  return (
    <div className="flex w-screen h-screen">
      {/* Area video utama */}
      <div className="flex-1">
        <VideoArea participants={participants} />
      </div>

      {/* Sidebar */}
      <Sidebar participants={participants} messages={messages} />
    </div>
  );
};

export default MeetingPage;
