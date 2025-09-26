import { Button } from "antd";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

const SidebarChat = () => {
  return (
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
  );
};

export default SidebarChat;
