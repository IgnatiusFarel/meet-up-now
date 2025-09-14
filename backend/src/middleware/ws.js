import { getWsService } from "#services/websocketInstance";

export const attacWsService = (req, res, next) => {
  req.wsService = getWsService();
  next();
};
