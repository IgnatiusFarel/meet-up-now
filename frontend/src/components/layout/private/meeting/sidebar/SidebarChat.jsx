import { useState } from "react";

const SidebarChat = ({ messages }) => {
  const [newMsg, setNewMsg] = useState("");

  const handleSend = () => {
    if (newMsg.trim() !== "") {
      console.log("Send:", newMsg);
      setNewMsg("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="p-2 bg-gray-100 rounded">
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="flex border-t">
        <input
          type="text"
          className="flex-1 p-2 outline-none"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="px-4 bg-blue-500 text-white">
          Send
        </button>
      </div>
    </div>
  );
};

export default SidebarChat;
