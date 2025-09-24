import { useRef, useState, useCallback, useEffect } from "react";

const useMediaDevices = (addDebugLog) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
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
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("prompt"); // 'granted', 'denied', 'prompt'

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const cameraPermission = await navigator.permissions.query({
          name: "camera",
        });
        const microphonePermission = await navigator.permissions.query({
          name: "microphone",
        });

        addDebugLog(`Camera permission: ${cameraPermission.state}`);
        addDebugLog(`Microphone permission: ${microphonePermission.state}`);

        if (
          cameraPermission.state === "granted" &&
          microphonePermission.state === "granted"
        ) {
          setPermissionStatus("granted");
          setPermissionGranted(true);
        } else if (
          cameraPermission.state === "denied" ||
          microphonePermission.state === "denied"
        ) {
          setPermissionStatus("denied");
          setPermissionGranted(false);
        } else {
          setPermissionStatus("prompt");
          setPermissionGranted(false);
        }
      }
    } catch (err) {
      addDebugLog(`Permission check error: ${err.message}`);
      // Fallback: try to get stream to check permissions
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        testStream.getTracks().forEach((track) => track.stop());
        setPermissionStatus("granted");
        setPermissionGranted(true);
      } catch (streamErr) {
        setPermissionStatus("denied");
        setPermissionGranted(false);
      }
    }
  }, [addDebugLog]);

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

  // Request initial permissions with enhanced error handling
  const requestPermissions = async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);
      addDebugLog(
        isRetry ? "Retrying permissions..." : "Requesting permissions..."
      );

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung getUserMedia");
      }

      // If this is a retry and permission was previously denied,
      // show instructions for manual permission
      if (isRetry && permissionStatus === "denied") {
        throw new Error(
          "Permission ditolak. Silakan klik ikon kamera di address bar browser atau buka Settings untuk mengizinkan akses kamera dan microphone."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      addDebugLog("✅ Permission granted");
      setPermissionGranted(true);
      setPermissionStatus("granted");

      // Clean up permission test stream immediately
      stream.getTracks().forEach((track) => track.stop());
      addDebugLog("Permission test stream cleaned up");

      // Load devices after permission
      await loadDevices();
    } catch (err) {
      addDebugLog(`❌ Permission error: ${err.name} - ${err.message}`);

      let errorMessage = "";

      if (err.name === "NotAllowedError") {
        setPermissionStatus("denied");
        errorMessage =
          "Permission ditolak. Klik ikon kamera di address bar untuk mengizinkan akses.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "Kamera atau microphone tidak ditemukan.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Kamera atau microphone sedang digunakan aplikasi lain.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Pengaturan kamera tidak didukung.";
      } else if (err.name === "SecurityError") {
        errorMessage = "Akses ditolak karena alasan keamanan.";
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
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
      setError("Unable to load device list");
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
        setError(`Cannot access camera: ${fallbackErr.message}`);
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

  // Enhanced retry function
  const retry = useCallback(() => {
    addDebugLog("User clicked retry");
    setError(null);
    stopAllTracks();

    // Check permission status first, then request permissions
    checkPermissionStatus().then(() => {
      requestPermissions(true); // Pass true to indicate this is a retry
    });
  }, [addDebugLog, stopAllTracks, checkPermissionStatus]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  return {
    videoRef,
    streamRef,
    devices,
    selected,
    setSelected,
    micOn,
    camOn,
    error,
    loading,
    permissionGranted,
    permissionStatus,
    requestPermissions,
    startStream,
    toggleMic,
    toggleCam,
    retry,
    stopAllTracks,
    checkPermissionStatus,
  };
};

export default useMediaDevices;
