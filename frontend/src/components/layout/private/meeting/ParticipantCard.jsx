import { Button, Avatar } from "antd";
import {
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon,
} from "@heroicons/react/24/solid";
import { MicrophoneSlashIcon } from "@sidekickicons/react/24/outline";
import { PushpinOutlined } from "@ant-design/icons";

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

export default ParticipantCard;