import { Button } from "antd";
import {
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/outline";
import { MicrophoneSlashIcon } from  "@sidekickicons/react/24/outline";

const MediaControls = ({ micOn, camOn, toggleMic, toggleCam }) => {
  return (
    <div className="absolute bottom-4 flex space-x-4 justify-center w-full">
      <Button
        onClick={toggleMic}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          micOn
            ? "bg-green-700 hover:bg-gray-600 text-white"
            : "bg-red-700 hover:bg-red-600 text-white"
        }`}
      >
        {micOn ? <MicrophoneIcon className="w-5 h-5" />  : <MicrophoneSlashIcon className="w-5 h-5" />}
      </Button>

      <Button
        onClick={toggleCam}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          camOn
            ? "bg-green-700 hover:bg-gray-600 text-white"
            : "bg-red-700 hover:bg-red-600 text-white"
        }`}
      >
        {camOn ? (
          <VideoCameraIcon className="w-5 h-5" />
        ) : (
          <VideoCameraSlashIcon className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
};

export default MediaControls;
