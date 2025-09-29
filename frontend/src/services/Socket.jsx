// Services/Socket.jsx - FIXED VERSION
import { io } from "socket.io-client";
import useAuthStore from "@/stores/AuthStore";

const WS_URL = import.meta.env.VITE_APP_WS_URL || "http://localhost:3000";

let socket = null;
let reconnectInterval = null;

// Fungsi untuk mendapatkan token secara dinamis
const getAuthToken = () => {
  const { token } = useAuthStore.getState();
  return token || localStorage.getItem('authToken') || localStorage.getItem('token');
};

// Fungsi untuk membuat socket connection
const createSocket = () => {
  const token = getAuthToken();
  
  console.log('[Socket] Creating socket connection...', {
    hasToken: !!token,
    tokenLength: token?.length,
    url: WS_URL
  });

  if (!token) {
    console.warn('[Socket] No token available, socket will fail authentication');
  }

  const newSocket = io(WS_URL, {
    auth: { 
      token: token  // Token diambil fresh setiap kali socket dibuat
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    autoConnect: false  // Jangan auto-connect, kita control manual
  });

  // Event listeners
  newSocket.on('connect', () => {
    console.log('[Socket] ✅ Connected successfully!', newSocket.id);
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  });

  newSocket.on('connect_error', (error) => {
    console.error('[Socket] ❌ Connection error:', error.message);
    
    if (error.message.includes('Authentication')) {
      console.error('[Socket] Authentication failed - token may be invalid or expired');
      
      // Coba refresh token
      const authStore = useAuthStore.getState();
      if (authStore.refreshAuthToken) {
        console.log('[Socket] Attempting to refresh token...');
        authStore.refreshAuthToken()
          .then(() => {
            console.log('[Socket] Token refreshed, reconnecting...');
            reconnectSocket();
          })
          .catch((err) => {
            console.error('[Socket] Token refresh failed:', err);
          });
      }
    }
  });

  newSocket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    
    // Auto-reconnect jika bukan manual disconnect
    if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
      console.log('[Socket] Will attempt to reconnect...');
    }
  });

  newSocket.on('error', (error) => {
    console.error('[Socket] Socket error:', error);
  });

  return newSocket;
};

// Fungsi untuk connect socket
export const connectSocket = () => {
  if (!socket) {
    socket = createSocket();
  }
  
  if (!socket.connected) {
    const token = getAuthToken();
    
    if (!token) {
      console.error('[Socket] Cannot connect - no authentication token');
      return socket;
    }
    
    // Update auth dengan token terbaru sebelum connect
    socket.auth = { token };
    
    console.log('[Socket] Connecting to server...');
    socket.connect();
  } else {
    console.log('[Socket] Already connected');
  }
  
  return socket;
};

// Fungsi untuk reconnect dengan token baru
export const reconnectSocket = () => {
  console.log('[Socket] Reconnecting socket with fresh token...');
  
  if (socket) {
    socket.disconnect();
  }
  
  socket = createSocket();
  return connectSocket();
};

// Fungsi untuk disconnect
export const disconnectSocket = () => {
  console.log('[Socket] Disconnecting socket...');
  
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
};

// Fungsi untuk get socket instance
export const getSocket = () => {
  if (!socket) {
    socket = createSocket();
  }
  return socket;
};

// Export default socket (lazy initialization)
export default new Proxy({}, {
  get(target, prop) {
    if (!socket) {
      socket = createSocket();
    }
    return socket[prop];
  }
});