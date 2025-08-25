import { useEffect, useRef, useState, useCallback } from "react";
import { 
  VideoCameraOutlined,
  UserOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const Preview = () => {
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
  const [debugInfo, setDebugInfo] = useState([]);

  // Add debug log
  const addDebugLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`].slice(-10));
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
        audio: true 
      });
      
      addDebugLog("✅ Permission granted");
      setPermissionGranted(true);
      
      // Clean up permission test stream immediately
      stream.getTracks().forEach(track => track.stop());
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
      
      addDebugLog(`Found: ${cameras.length} cameras, ${microphones.length} mics`);
      
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

  // Start camera stream - FIXED VERSION
  const startStream = useCallback(async () => {
    try {
      if (!permissionGranted) {
        addDebugLog("❌ No permission, skipping stream start");
        return;
      }
      
      addDebugLog(`Starting stream - cam: ${camOn}, mic: ${micOn}`);
      setLoading(true);
      setError(null);

      // Always stop existing stream first
      stopAllTracks();
      
      // Longer delay to ensure proper cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      if (camOn) {
        addDebugLog("Creating new stream...");
        
        const constraints = {
          video: {
            deviceId: selected.camera ? { exact: selected.camera } : undefined,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          },
          audio: micOn ? {
            deviceId: selected.microphone ? { exact: selected.microphone } : undefined
          } : false
        };

        addDebugLog(`Constraints: video=${!!constraints.video}, audio=${!!constraints.audio}`);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        addDebugLog(`✅ Stream created with ${stream.getTracks().length} tracks`);
        
        // Store stream reference first
        streamRef.current = stream;
        
        // Then set to video element with additional delay and error handling
        if (videoRef.current) {
          // Small delay before assigning to video element
          await new Promise(resolve => setTimeout(resolve, 100));
          
          videoRef.current.srcObject = stream;
          addDebugLog("Stream assigned to video element");
          
          // Force video to load and play
          try {
            await videoRef.current.play();
            addDebugLog("Video playback started");
          } catch (playErr) {
            addDebugLog(`Video play warning: ${playErr.message}`);
            // This is usually not critical for autoplay videos
          }
        }
        
        // Handle audio track state
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = micOn;
          addDebugLog(`Audio track enabled: ${micOn}`);
        }
        
      } else {
        addDebugLog("Camera off - no stream created");
        // Make sure video element is cleared when camera is off
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
      
    } catch (err) {
      addDebugLog(`❌ Stream error: ${err.name} - ${err.message}`);
      
      // Enhanced fallback strategy
      try {
        addDebugLog("Trying fallback with basic constraints...");
        
        // Stop any partially created streams
        stopAllTracks();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (camOn) {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: micOn
          });
          
          addDebugLog("✅ Fallback stream created");
          
          streamRef.current = fallbackStream;
          
          if (videoRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
            videoRef.current.srcObject = fallbackStream;
            try {
              await videoRef.current.play();
            } catch (playErr) {
              addDebugLog(`Fallback video play warning: ${playErr.message}`);
            }
          }
          
          setError("Menggunakan pengaturan default");
        }
        
      } catch (fallbackErr) {
        addDebugLog(`❌ Fallback failed: ${fallbackErr.message}`);
        setError(`Tidak dapat mengakses kamera: ${fallbackErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [permissionGranted, camOn, micOn, selected.camera, selected.microphone, addDebugLog, stopAllTracks]);

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

  // FIXED: Only restart stream when necessary
  useEffect(() => {
    if (permissionGranted) {
      addDebugLog("Camera/mic settings changed, restarting stream...");
      startStream();
    }
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
    setCamOn(prev => !prev);
    // The useEffect will handle restarting/stopping the stream
  }, [camOn, addDebugLog]);

  // Retry function
  const retry = useCallback(() => {
    addDebugLog("User clicked retry");
    setError(null);
    stopAllTracks();
    requestPermissions();
  }, [addDebugLog, stopAllTracks]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
            <VideoCameraOutlined className="text-white text-lg" />
          </div>
          <div className="text-2xl font-bold">
            <span className="text-gray-800">Meet Up Now</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex flex-col text-right">
            <p className="text-sm text-gray-600">emailuser@gmail.com</p>
            <button className="text-xs text-red-500 hover:text-red-700">
              Logout
            </button>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer">
            <UserOutlined className="text-lg" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 p-6 space-x-6">
        {/* Preview Kamera */}
        <div className="w-1/2 bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
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

          {camOn && !loading && !error ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover rounded-xl" 
            />
          ) : !loading && !error ? (
            <div className="text-white text-xl text-center">
              <VideoCameraOutlined className="text-6xl mb-4 opacity-50" />
              <p>Kamera nonaktif</p>
            </div>
          ) : null}

          {/* Control Buttons */}
          <div className="absolute bottom-4 flex space-x-4 justify-center w-full">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                micOn 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {micOn ? <AudioOutlined /> : <AudioMutedOutlined />}
            </button>
            
            <button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                camOn 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <VideoCameraOutlined />
            </button>
          </div>
        </div>

        {/* Join Section */}
        <div className="w-1/2 flex flex-col justify-center bg-white rounded-xl p-8">
          <h2 className="text-3xl font-semibold mb-4 text-gray-800">Siap bergabung?</h2>
          <p className="text-gray-500 mb-6">Tidak ada orang lain di sini</p>
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg text-lg mb-8 transition-colors disabled:bg-gray-400"
            disabled={!permissionGranted || error}
          >
            Gabung Sekarang
          </button>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mikrofon
              </label>
              <select
                value={selected.microphone || ''}
                onChange={(e) => setSelected(s => ({ ...s, microphone: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={devices.microphones.length === 0}
              >
                <option value="">Pilih Mikrofon</option>
                {devices.microphones.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speaker
              </label>
              <select
                value={selected.speaker || ''}
                onChange={(e) => setSelected(s => ({ ...s, speaker: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={devices.speakers.length === 0}
              >
                <option value="">Pilih Speaker</option>
                {devices.speakers.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kamera
              </label>
              <select
                value={selected.camera || ''}
                onChange={(e) => setSelected(s => ({ ...s, camera: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={devices.cameras.length === 0}
              >
                <option value="">Pilih Kamera</option>
                {devices.cameras.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm mb-3">
              <div className={`w-3 h-3 rounded-full ${
                permissionGranted ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-gray-600">
                Status: {permissionGranted ? 'Terhubung' : 'Tidak terhubung'}
              </span>
            </div>
            
            {devices.cameras.length > 0 && (
              <p className="text-xs text-gray-500 mb-3">
                Ditemukan {devices.cameras.length} kamera, {devices.microphones.length} mikrofon
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
                    <div key={index} className="font-mono text-xs mb-1">{log}</div>
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