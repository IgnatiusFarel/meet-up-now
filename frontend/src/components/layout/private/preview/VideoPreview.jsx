import { Spin } from "antd";
import MediaControls from "./MediaControls";
import useAuthStore from "@/stores/AuthStore";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  VideoCameraSlashIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const VideoPreview = ({
  videoRef,
  loading,
  error,
  camOn,
  micOn,
  permissionGranted,
  permissionStatus,
  toggleMic,
  toggleCam,
  retry,
  addDebugLog,
}) => {
  const user = useAuthStore((s) => s.user);

  // Function to render different permission states
  const renderPermissionState = () => {
    // Loading state → pakai Spin fullscreen
    if (loading) {
      return (
        <Spin
          spinning={true}
          fullscreen
          tip="Loading..."
          size="large"
          className="custom-spin"
        />
      );
    }

    if (error && !loading) {
      const isPermissionDenied =
        permissionStatus === "denied" ||
        error.includes("Permission ditolak") ||
        error.includes("NotAllowedError");

      return (
        <div
          className={`absolute inset-0 ${
            isPermissionDenied ? "bg-orange-900" : "bg-red-900"
          } bg-opacity-80 flex items-center justify-center z-10`}
        >
          <div className="text-white text-center p-6 max-w-md">
            <div className="flex justify-center mb-4">
              {isPermissionDenied ? (
                <ShieldExclamationIcon className="w-24 h-24" />
              ) : (
                <ExclamationTriangleIcon className="w-24 h-24" />
              )}
            </div>

            <h3 className="text-lg font-semibold mb-3">
              {isPermissionDenied ? "Permission Required" : "Camera Error"}
            </h3>

            <p className="mb-4 text-sm leading-relaxed">{error}</p>

            {isPermissionDenied && (
              <div className="mb-4 p-3 bg-black bg-opacity-30 rounded-lg text-xs">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium mb-1">
                      How to allow camera access:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-200">
                      <li>
                        Click the camera icon in your browser's address bar
                      </li>
                      <li>Select "Always allow" for camera and microphone</li>
                      <li>Refresh the page or click "Try Again"</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

        <button
  onClick={() => {
    // coba request permission ulang
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        // izin diberikan
        retry(); // jalankan retry untuk set state
      })
      .catch(err => {
        // masih denied
        console.error(err);
        retry(); // state error masih denied
      });
  }}
  className={`${
    isPermissionDenied
      ? "bg-orange-500 hover:bg-orange-400"
      : "bg-white hover:bg-gray-100 text-red-900"
  } text-black px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto font-medium`}
>
  <ArrowPathIcon className="w-5 h-5" />
  <span>
    {isPermissionDenied ? "Check Permission" : "Try Again"}
  </span>
</button>

          </div>
        </div>
      );
    }

    // Show permission prompt if not granted and no error
    if (!permissionGranted && !error && !loading) {
      return (
        <div className="absolute inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-white text-center p-6 max-w-md">
            <div className="flex justify-center mb-4">
              <VideoCameraSlashIcon className="w-24 h-24" />
            </div>

            <h3 className="text-lg font-semibold mb-3">
              Camera Access Required
            </h3>

            <p className="mb-4 text-sm leading-relaxed">
              To start your video call, we need permission to access your camera
              and microphone.
            </p>

            <div className="mb-4 p-3 bg-black bg-opacity-30 rounded-lg text-xs">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium mb-1">What happens next:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-200">
                    <li>Click "Allow Access" below</li>
                    <li>Your browser will ask for permission</li>
                    <li>Click "Allow" in the browser popup</li>
                  </ol>
                </div>
              </div>
            </div>

            <button
              onClick={() => retry()}
              className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto font-medium"
            >
              <VideoCameraSlashIcon className="w-5 h-5" />
              <span>Allow Access</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-3/4 bg-gray-900 rounded-3xl flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
        <p className="flex items-center text-sm font-medium">
          <UserCircleIcon className="mr-2 h-5 w-5" />
          {user?.name || "User Name"}
        </p>
      </div>

      {/* Permission and error states */}
      {renderPermissionState()}

      {/* Video content */}
      {camOn && !loading && !error && permissionGranted ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-xl"
          onLoadedMetadata={() =>
            addDebugLog("📺 Video onLoadedMetadata event")
          }
          onPlay={() => addDebugLog("▶️ Video onPlay event")}
          onError={(e) =>
            addDebugLog(
              `❌ Video error: ${e.target.error?.message || "Unknown error"}`
            )
          }
        />
      ) : !loading && !error && permissionGranted ? (
        <div className="text-white text-xl text-center">
          <div className="text-6xl mb-4 opacity-50 flex justify-center">
            <VideoCameraSlashIcon className="w-24 h-24" />
          </div>
          <p>Camera Not Active</p>
        </div>
      ) : null}

      {/* Media Controls - only show when permission is granted */}
      {permissionGranted && (
        <MediaControls
          micOn={micOn}
          camOn={camOn}
          toggleMic={toggleMic}
          toggleCam={toggleCam}
        />
      )}
    </div>
  );
};

export default VideoPreview;
