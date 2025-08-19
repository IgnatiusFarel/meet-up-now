import { JWTUtils } from '#utils/jwt';
import { ApiResponse } from '#utils/response';
import { AuthService } from '#services/authService';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        ApiResponse.unauthorized('Access token is required')
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = JWTUtils.verifyAccessToken(token);
      
      // Ambil user data terbaru dari database
      const user = await AuthService.getUserById(decoded.userId);
      
      req.user = user;
      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json(
        ApiResponse.unauthorized('Invalid or expired access token')
      );
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json(
      ApiResponse.error('Authentication failed', 500, error.message)
    );
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JWTUtils.verifyAccessToken(token);
      const user = await AuthService.getUserById(decoded.userId);
      req.user = user;
    } catch (tokenError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};
