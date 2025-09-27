import { io } from "socket.io-client";
import useAuthStore from "@/stores/AuthStore";

const WS_URL = import.meta.env.VITE_APP_WS_URL || "http://localhost:3000";

const { token } = useAuthStore.getState();

const socket = io(WS_URL, {
  auth: { token }, 
  transports: ["websocket"],
  withCredentials: true
});

export default socket;
