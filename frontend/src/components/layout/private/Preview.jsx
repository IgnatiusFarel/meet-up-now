import {
  UserOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import useAuthStore from "@/stores/AuthStore";
import MeetUpNow from "@/assets/MeetUpNow.png";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Avatar, Select, App } from "antd";
import { useEffect, useRef, useState, useCallback } from "react";
import useMeetingStore from "@/stores/MeetingStore";

const Preview = () => {
  const { code } = useParams();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [devices, setDevices] = useState({
    cameras: [],
    microphones: [],
    speakers: [],
  });
  const [selected, setSelected] = useState({
    camera: null,
    microphone: null,
    speaker: null,
  });
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [joining, setJoining] = useState(false);

  // Auth Store
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Meeting Store
  const setStream = useMeetingStore((state) => state.setStream); 
  const joinMeeting = useMeetingStore((state) => state.joinMeeting);
  const checkCanJoin = useMeetingStore((state) => state.checkCanJoin);
  const joinCheckResult = useMeetingStore((state) => state.joinCheckResult);
  const setCurrentUserStatus = useMeetingStore(
    (state) => state.setCurrentUserStatus
  );

  const handleLogout = async () => {
    try {
      stopAllTracks();

      await logout();
      message.success("You’ve been logged out. See you next time!");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      navigate("/", { replace: true });
    }
  };

  // Validate meeting code and check if user can join
  useEffect(() => {
    const validateMeetingAccess = async () => {
      if (!code) {
        message.error("Meeting code is required");
        navigate("/dashboard", { replace: true });
        return;
      }

      // Validate code format
      if (!/^[A-Z0-9]{6}$/.test(code)) {
        message.error("Invalid meeting code format");
        navigate("/dashboard", { replace: true });
        return;
      }

      try {
        console.log("Validating access to meeting:", code);
        const result = await checkCanJoin(code);

        if (!result.canJoin) {
          // Handle different error cases
          switch (result.reason) {
            case "Meeting not found":
            case "Meeting not found!":
              message.error("Meeting not found! Please check the room code.");
              break;
            case "Meeting has ended":
            case "Meeting has ended!":
              message.error("This meeting has already ended.");
              break;
            case "Meeting expired":
              message.error("This meeting has expired.");
              break;
            default:
              message.error(result.reason || "Cannot access this meeting.");
          }
          navigate("/dashboard", { replace: true });
          return;
        }

        console.log("Meeting access validated:", result.meeting);
      } catch (error) {
        console.error("Meeting validation error:", error);
        message.error("Failed to validate meeting access");
        navigate("/dashboard", { replace: true });
      }
    };

    validateMeetingAccess();
  }, [code, checkCanJoin, navigate, message]);

  // Add debug log
  const addDebugLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev, `[${timestamp}] ${message}`].slice(-10));
    console.log(`[DEBUG] ${message}`);
  }, []);

  // Clean up stream properly
  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      addDebugLog("Stopping all tracks...");
      streamRef.current.getTracks().forEach((track) => {
        addDebugLog(`Stopping track: ${track.kind} - ${track.readyState}`);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [addDebugLog]);

  // Request initial permissions
  const requestPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      addDebugLog("Requesting permissions...");

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung getUserMedia");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      addDebugLog("✅ Permission granted");
      setPermissionGranted(true);

      // Clean up permission test stream immediately
      stream.getTracks().forEach((track) => track.stop());
      addDebugLog("Permission test stream cleaned up");

      // Load devices after permission
      await loadDevices();
    } catch (err) {
      addDebugLog(`❌ Permission error: ${err.name} - ${err.message}`);
      setError(`Tidak dapat mengakses kamera/mikrofon: ${err.message}`);
      setPermissionGranted(false);
    } finally {
      setLoading(false);
    }
  };

  // Load available devices
  const loadDevices = async () => {
    try {
      addDebugLog("Loading devices...");
      const devices = await navigator.mediaDevices.enumerateDevices();

      const cameras = devices.filter((d) => d.kind === "videoinput");
      const microphones = devices.filter((d) => d.kind === "audioinput");
      const speakers = devices.filter((d) => d.kind === "audiooutput");

      addDebugLog(
        `Found: ${cameras.length} cameras, ${microphones.length} mics`
      );

      setDevices({ cameras, microphones, speakers });

      // Set default devices
      setSelected({
        camera: cameras[0]?.deviceId || null,
        microphone: microphones[0]?.deviceId || null,
        speaker: speakers[0]?.deviceId || null,
      });
    } catch (err) {
      addDebugLog(`❌ Device loading error: ${err.message}`);
      setError("Tidak dapat memuat daftar perangkat");
    }
  };

  // Start camera stream - ROBUST VERSION
  const startStream = useCallback(async () => {
    // Prevent double execution
    if (loading) {
      addDebugLog("⚠️ Stream start already in progress, skipping...");
      return;
    }

    try {
      if (!permissionGranted) {
        addDebugLog("❌ No permission, skipping stream start");
        return;
      }

      addDebugLog(`🔄 Starting stream - cam: ${camOn}, mic: ${micOn}`);
      setLoading(true);
      setError(null);

      // Always stop existing stream first
      stopAllTracks();

      // Ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (camOn) {
        addDebugLog("🎥 Creating new video stream...");

        const constraints = {
          video: {
            deviceId: selected.camera ? { exact: selected.camera } : undefined,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: micOn
            ? {
                deviceId: selected.microphone
                  ? { exact: selected.microphone }
                  : undefined,
              }
            : false,
        };

        addDebugLog(
          `📋 Constraints: video=${!!constraints.video}, audio=${!!constraints.audio}`
        );

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        addDebugLog(
          `✅ Stream created with ${stream.getTracks().length} tracks`
        );

        // Verify stream is active
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
          throw new Error("No video tracks in stream");
        }

        addDebugLog(`🎬 Video track state: ${videoTracks[0].readyState}`);

        // Store stream reference
        streamRef.current = stream;

        // Assign to video element with robust error handling
        if (videoRef.current) {
          addDebugLog("📺 Assigning stream to video element...");

          // Clear any existing srcObject first
          videoRef.current.srcObject = null;

          // Small delay then assign new stream
          await new Promise((resolve) => setTimeout(resolve, 150));
          videoRef.current.srcObject = stream;

          addDebugLog("✅ Stream assigned to video element");

          // Set video properties
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.autoplay = true;

          // Wait for loadedmetadata event
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Video metadata load timeout"));
            }, 5000);

            const onLoadedMetadata = () => {
              clearTimeout(timeout);
              videoRef.current.removeEventListener(
                "loadedmetadata",
                onLoadedMetadata
              );
              addDebugLog("📊 Video metadata loaded");
              resolve();
            };

            if (videoRef.current.readyState >= 1) {
              // Metadata already loaded
              clearTimeout(timeout);
              addDebugLog("📊 Video metadata already loaded");
              resolve();
            } else {
              videoRef.current.addEventListener(
                "loadedmetadata",
                onLoadedMetadata
              );
            }
          });

          // Force play
          try {
            await videoRef.current.play();
            addDebugLog("▶️ Video playback started successfully");
          } catch (playErr) {
            addDebugLog(`⚠️ Video play issue: ${playErr.message}`);
            // Try alternative approach
            videoRef.current.muted = true;
            try {
              await videoRef.current.play();
              addDebugLog("▶️ Video playback started (second attempt)");
            } catch (playErr2) {
              addDebugLog(`❌ Video play failed: ${playErr2.message}`);
            }
          }
        } else {
          addDebugLog("❌ Video element not available, will retry...");

          // Store stream and retry assignment after a delay
          const retryAssignment = async () => {
            addDebugLog("🔄 Retrying video element assignment...");
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (videoRef.current && streamRef.current) {
              addDebugLog(
                "📺 Video element now available, assigning stream..."
              );

              videoRef.current.srcObject = streamRef.current;
              videoRef.current.muted = true;
              videoRef.current.playsInline = true;
              videoRef.current.autoplay = true;

              try {
                await videoRef.current.play();
                addDebugLog("▶️ Delayed video assignment successful");
              } catch (playErr) {
                addDebugLog(`⚠️ Delayed video play issue: ${playErr.message}`);
              }
            } else {
              addDebugLog("❌ Video element still not available after retry");
            }
          };

          // Retry in background
          retryAssignment();
        }

        // Handle audio track state
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = micOn;
          addDebugLog(`🎤 Audio track enabled: ${micOn}`);
        }
      } else {
        addDebugLog("📹 Camera off - clearing video element");
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    } catch (err) {
      addDebugLog(`❌ Stream error: ${err.name} - ${err.message}`);

      // Enhanced fallback strategy
      try {
        addDebugLog("🔄 Attempting fallback with basic constraints...");

        // Clean up
        stopAllTracks();
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (camOn) {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: micOn,
          });

          addDebugLog("✅ Fallback stream created");

          streamRef.current = fallbackStream;

          if (videoRef.current) {
            videoRef.current.srcObject = null;
            await new Promise((resolve) => setTimeout(resolve, 200));
            videoRef.current.srcObject = fallbackStream;

            try {
              videoRef.current.muted = true;
              await videoRef.current.play();
              addDebugLog("▶️ Fallback video playing");
            } catch (playErr) {
              addDebugLog(`⚠️ Fallback play warning: ${playErr.message}`);
            }
          }

          setError("Menggunakan pengaturan kamera dasar");
        }
      } catch (fallbackErr) {
        addDebugLog(`❌ Fallback failed: ${fallbackErr.message}`);
        setError(`Tidak dapat mengakses kamera: ${fallbackErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [
    permissionGranted,
    camOn,
    micOn,
    selected.camera,
    selected.microphone,
    loading,
    addDebugLog,
    stopAllTracks,
  ]);

  // Initialize on mount
  useEffect(() => {
    addDebugLog("Component mounted, requesting permissions...");
    requestPermissions();

    // Cleanup on unmount
    return () => {
      addDebugLog("Component unmounting, cleaning up...");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // FIXED: Only restart stream when necessary - with debounce
  useEffect(() => {
    if (!permissionGranted) return;

    addDebugLog("Settings changed, scheduling stream restart...");

    // Debounce multiple rapid changes
    const timeoutId = setTimeout(() => {
      addDebugLog("Executing scheduled stream restart...");
      startStream();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      addDebugLog("Stream restart cancelled (new change detected)");
    };
  }, [permissionGranted, camOn, micOn, selected.camera, selected.microphone]);

  // IMPROVED: Toggle microphone without restarting stream
  const toggleMic = useCallback(() => {
    addDebugLog(`Toggling mic: ${micOn} -> ${!micOn}`);

    const newMicState = !micOn;
    setMicOn(newMicState);

    // If we have a current stream with audio track, just toggle it
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = newMicState;
        addDebugLog(`Audio track toggled to: ${newMicState}`);
        return; // Don't restart stream, just return
      }
    }

    // Only restart stream if we need to add audio track when turning mic on
    if (newMicState && camOn) {
      addDebugLog("Need to restart stream to add audio track");
      // The useEffect will handle restarting the stream
    }
  }, [micOn, camOn, addDebugLog]);

  // IMPROVED: Toggle camera
  const toggleCam = useCallback(() => {
    addDebugLog(`Toggling cam: ${camOn} -> ${!camOn}`);
    setCamOn((prev) => !prev);
    // The useEffect will handle restarting/stopping the stream
  }, [camOn, addDebugLog]);

  // Retry function
  const retry = useCallback(() => {
    addDebugLog("User clicked retry");
    setError(null);
    stopAllTracks();
    requestPermissions();
  }, [addDebugLog, stopAllTracks]);

  const handleJoinNow = async () => {
    if (!code) {
      message.error("Meeting code is missing!");
      return;
    }

    if (!permissionGranted) {
      message.error("Please allow camera and microphone access first");
      return;
    }

    setJoining(true);

    try {
      console.log("Joining meeting with code:", code);

      setStream(streamRef.current);

      setCurrentUserStatus({
        isMicOn: micOn,
        isCameraOn: camOn,
        isScreenShare: false,
      });

      const participant = await joinMeeting(code);

      if (participant) {
        console.log("Successfully joined meeting:", participant);
        message.success("Joining meeting...");

        navigate(`/meeting/${code}`, {
          replace: true,
          state: {            
            MediaSettings: {
              isMicOn: micOn,
              isCameraOn: camOn,
              selectedDevices: selected,
            },
          },
        });
      } else {
        throw new Error("Failed to join meeting - no participant data");
      }
    } catch (error) {
      console.error("Join meeting error:", error);

      let errorMessage = "Failed to join meeting";

      if (error.response) {
        switch (error.response.status) {
          case 404:
            errorMessage = "Meeting not found, please check the room code!";
            break;
          case 410:
            errorMessage = "This meeting has ended!";
            break;
          default:
            errorMessage =
              error.response.data?.message || "Failed to join meeting";
        }
      } else {
        errorMessage = error.message || "Failed to join meeting";
      }
      message.error(errorMessage);

      if (error.response?.status === 404 || error.response?.status === 410) {
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6">
        <Link to="/" className="text-2xl font-bold">
          <img src={MeetUpNow} alt="Meet Up Now Logo" className="w-28" />
        </Link>

        <div className="flex items-center space-x-3">
          <div className="flex flex-col text-right">
            <p className="text-sm font-medium text-gray-800">
              {user?.email || "User Email"}
            </p>
            <Button
              type="text"
              size="small"
              danger
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </div>
          <Avatar
            className="bg-blue-500 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-300"
            size={42}
            src={user?.avatarUrl}
            icon={<UserOutlined />}
            alt={user?.name || "User Avatar"}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 p-6 space-x-6">
        {/* Preview Kamera */}
        <div className="w-3/4 bg-gray-900 rounded-3xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
            <p className="text-sm font-medium">{user?.name || "User Name"}</p>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center z-10">
              <div className="text-white text-center p-4">
                <ExclamationCircleOutlined className="text-4xl mb-4" />
                <p className="mb-4 text-sm">{error}</p>
                <button
                  onClick={retry}
                  className="bg-white text-red-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <ReloadOutlined />
                  <span>Coba Lagi</span>
                </button>
              </div>
            </div>
          )}

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
                  `❌ Video error: ${
                    e.target.error?.message || "Unknown error"
                  }`
                )
              }
            />
          ) : !loading && !error ? (
            <div className="text-white text-xl text-center">
              <p className="text-6xl mb-4 opacity-50">📷🔴</p>
              <p>Camera Not Active</p>
            </div>
          ) : null}

          {/* Control Buttons */}
          <div className="absolute bottom-4 flex space-x-4 justify-center w-full">
            <Button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                micOn
                  ? "bg-green-700 hover:bg-gray-600 text-white"
                  : "bg-red-700 hover:bg-red-600 text-white"
              }`}
            >
              {micOn ? "🎤🟢" : "🎤🔴"}
            </Button>

            <Button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                camOn
                  ? "bg-green-700 hover:bg-gray-600 text-white"
                  : "bg-red-700 hover:bg-red-600 text-white"
              }`}
            >
              {camOn ? "📷🟢" : "📷🔴"}
            </Button>
          </div>
        </div>

        {/* Join Section */}
        <div className="w-1/2 flex flex-col  p-8">
          {/* Bagian teks di tengah */}
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <h2 className="text-3xl font-medium mb-4 text-[#171717]">
              Ready to Join?
            </h2>
            <p className="font-medium text-[#717171] mb-6">
              There's no one else here!
            </p>
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
          <div className="space-y-4">
            {[
              {
                label: "Microphone",
                key: "microphone",
                data: devices.microphones,
              },
              { label: "Speaker", key: "speaker", data: devices.speakers },
              { label: "Camera", key: "camera", data: devices.cameras },
            ].map(({ label, key, data }) => (
              <div key={key}>
                <h3 className="text-sm font-medium text-[#171717] mb-2">
                  {label}
                </h3>
                <Select
                  value={selected[key] || ""}
                  onChange={(value) =>
                    setSelected((s) => ({ ...s, [key]: value }))
                  }
                  placeholder={`Select a ${label.toLowerCase()}`}
                  className="w-full"
                  disabled={data.length === 0}
                >
                  {data.map((device) => (
                    <Select.Option
                      key={device.deviceId}
                      value={device.deviceId}
                    >
                      {device.label ||
                        `${label} ${device.deviceId.slice(0, 5)}`}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          {/* Status Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm mb-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  permissionGranted ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-gray-600">
                Status: {permissionGranted ? "Terhubung" : "Tidak terhubung"}
              </span>
            </div>

            {devices.cameras.length > 0 && (
              <p className="text-xs text-gray-500 mb-3">
                Ditemukan {devices.cameras.length} kamera,
                {devices.microphones.length} mikrofon
              </p>
            )}

            {/* Debug Information */}
            <div className="mt-4">
              <details className="text-xs">
                <summary className="text-gray-600 cursor-pointer hover:text-gray-800">
                  Debug Info ({debugInfo.length} logs)
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-gray-700 max-h-32 overflow-y-auto">
                  {debugInfo.map((log, index) => (
                    <div key={index} className="font-mono text-xs mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
