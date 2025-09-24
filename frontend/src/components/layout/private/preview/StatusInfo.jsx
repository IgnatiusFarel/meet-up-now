const StatusInfo = ({ 
  permissionGranted, 
  isConnected, 
  joinCheckResult, 
  devices, 
  participants, 
  debugInfo 
}) => {
  return (
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

      {/* WebSocket Connection Status */}
      {joinCheckResult && joinCheckResult.canJoin && (
        <div className="flex items-center space-x-2 text-sm mb-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            }`}
          ></div>
          <span className="text-gray-600">
            Realtime: {isConnected ? "Connected" : "Connecting..."}
          </span>
        </div>
      )}

      {devices.cameras.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">
          Ditemukan {devices.cameras.length} kamera,
          {devices.microphones.length} mikrofon
        </p>
      )}

      {/* Participants Debug Info */}
      {participants.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">
          Participants loaded: {participants.length}
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
  );
};

export default StatusInfo;