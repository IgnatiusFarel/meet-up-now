import { Button, Input, message } from "antd";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import useChatStore from "@/stores/ChatStore";
import useMeetingStore from "@/stores/MeetingStore";
import { useEffect, useState } from "react";

const SidebarChat = ({ meetingId }) => {
  const {
    messages,
    isFetchingMessages,
    isSendingMessage,
    getMessages,
    sendMessage,
    deleteMessage,
    initSocket,
    disconnectSocket,
  } = useChatStore();

  const { currentMeeting } = useMeetingStore();
  const actualMeetingId = meetingId || currentMeeting?.meetingId;

  const [input, setInput] = useState("");

  useEffect(() => {
    if (actualMeetingId) {
      getMessages(actualMeetingId);
      initSocket(actualMeetingId);
    }

    return () => {
      disconnectSocket();
    };
  }, [actualMeetingId]);

  const handleSend = async () => {
    if (!input.trim() || isSendingMessage) return;
    if (!actualMeetingId) {
      message.error("No active meeting found");
      return;
    }
    try {
      await sendMessage(actualMeetingId, input.trim());
      setInput("");
    } catch (err) {
      message.error(
        err.response?.data?.message || err.message || "Failed to send message"
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isFetchingMessages) return <div>Loading Chat...</div>;

  return (
    <div className="flex flex-col h-screen"> {/* full height */}
      {/* Pesan */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No messages yet. Send the first message!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.messageId} className="flex items-start">
              {/* Avatar */}
              <img
                src={msg.sender?.avatarUrl}
                className="w-10 h-10 rounded-full object-cover"
                alt={msg.sender?.name}
              />

              {/* Konten pesan */}
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="font-semibold text-sm">
                    {msg.sender?.name ?? "Unknown User"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="mt-1 text-sm break-words">{msg.content}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Chat */}
      <div className="border-t pt-3 p-3">
        <div className="flex space-x-2">
          <Input
            placeholder="Send message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSendingMessage || !actualMeetingId}
            maxLength={1000}
          />
          <Button
            type="primary"
            className="px-4"
            onClick={handleSend}
            loading={isSendingMessage}
            disabled={!input.trim() || isSendingMessage || !actualMeetingId}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Character counter */}
        <div className="text-xs text-gray-400 mt-1 text-right">
          {input.length}/1000
        </div>
      </div>
    </div>
  );
};

export default SidebarChat;
