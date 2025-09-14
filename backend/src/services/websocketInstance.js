import { WebSocketService } from "./websocketService.js";

let wsService;

export const initWsService = (server) => {
    wsService = new WebSocketService(server);
    return wsService;
}

export const getWsService = () => wsService;