import { VideoCameraIcon, MicrophoneIcon } from "@heroicons/react/24/outline";

const ParticipantCard = ({ participant }) => {
  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-md">
      {/* Video/Avatar */}
      {participant.isCameraOn ? (
        <video
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="w-full h-40 object-cover bg-black"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-40 bg-gray-800 text-white">
          {participant.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info & Status */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 flex justify-between items-center">
        <span>{participant.name}</span>
        <span>
          {participant.isMicOn ? (
            <MicrophoneIcon className="w-5 h-5" />
          ) : (
            <MicrophoneIcon className="w-5 h-5 text-red-500" />
          )}
        </span>
      </div>
    </div>
  );
};

export default ParticipantCard;
