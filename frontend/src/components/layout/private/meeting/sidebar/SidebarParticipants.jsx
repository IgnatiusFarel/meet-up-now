import { Avatar } from "antd";
import {
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/outline";
import { MicrophoneSlashIcon } from "@sidekickicons/react/24/outline";

const SidebarParticipants = ({ participants }) => {
  return (
    <div className="space-y-3">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
             <Avatar
              size={32}
              className="bg-blue-600"
              src={participant.avatarUrl} 
            >
              {/* fallback kalau tidak ada avatarUrl */}
              {participant.name?.charAt(0)}
            </Avatar>
            <div>
              <p className="text-sm font-medium">{participant.name}</p>
              {participant.isPresenter && (
                <p className="text-xs text-green-600">Presenter</p>
              )}
            </div>
          </div>
          <div className="flex space-x-1">
            <span className={participant.micOn ? "text-green-500" : "text-red-500"}>
              {participant.micOn ? (
                <MicrophoneIcon className="w-5 h-5" />
              ) : (
                <MicrophoneSlashIcon className="w-5 h-5" />
              )}
            </span>
            <span className={participant.camOn ? "text-green-500" : "text-red-500"}>
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
  );
};

export default SidebarParticipants;
