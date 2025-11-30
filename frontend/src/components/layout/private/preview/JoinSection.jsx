import { Button } from "antd";
import StatusInfo from "./StatusInfo.jsx";
import DeviceSettings from "./DeviceSettings.jsx";
import ParticipantsPreview from "./ParticipantsPreview.jsx";

const JoinSection = ({
  participants,
  permissionGranted,
  error,
  joining,
  handleJoinNow,
  devices,
  selected,
  setSelected,
  isConnected,
  joinCheckResult,
  debugInfo
}) => {
  return (
    <div className="w-1/2 flex flex-col p-8">
      {/* Bagian teks di tengah */}
      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <h2 className="text-3xl font-medium mb-4 text-[#171717]">
          Ready to Join?
        </h2>
        <ParticipantsPreview participants={participants} />
      </div>

      <Button
        type="primary"
        className="transition-colors disabled:bg-gray-400 mb-8"
        disabled={!permissionGranted || error || joining}
        loading={joining}
        onClick={handleJoinNow}
      >
        {joining ? "Joining..." : "Join Now"}
      </Button>

      <DeviceSettings 
        devices={devices}
        selected={selected}
        setSelected={setSelected}
      />

      <StatusInfo 
        permissionGranted={permissionGranted}
        isConnected={isConnected}
        joinCheckResult={joinCheckResult}
        devices={devices}
        participants={participants}
        debugInfo={debugInfo}
      />
    </div>
  );
};

export default JoinSection;