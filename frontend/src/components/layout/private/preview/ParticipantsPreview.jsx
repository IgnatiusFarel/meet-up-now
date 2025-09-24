import {
  UserOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";

const ParticipantsPreview = ({ participants }) => {
  if (!participants || participants.length === 0) {
    return (
      <p className="font-medium text-[#717171] mb-6">
        There's no one else here!
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex -space-x-2">
        {participants.slice(0, 3).map((p, idx) => (
          <Avatar
            key={p.user?.userId || idx}
            className="bg-blue-500 border-2 border-white"
            src={p.user?.avatarUrl}
            icon={<UserOutlined />}
            title={p.user?.name || "Participant"}
          >
            {p.user?.name?.[0] || "U"}
          </Avatar>
        ))}
        {participants.length > 3 && (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-sm font-medium text-gray-600 border-2 border-white">
            +{participants.length - 3}
          </div>
        )}
      </div>
      <p className="text-sm text-[#717171]">
        {participants.length}{" "}
        {participants.length === 1 ? "person" : "people"} already here
      </p>
    </div>
  );
};

export default ParticipantsPreview;
