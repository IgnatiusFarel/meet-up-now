import jwt from 'jsonwebtoken';

export class JWTUtils {
  static generateAccessToken(payload) {
    return jwt.sign(
      payload, 
      process.env.JWT_ACCESS_SECRET, 
      { 
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        issuer: 'meeting-app'
      }
    );
  }

  static generateRefreshToken(payload) {
    return jwt.sign(
      payload, 
      process.env.JWT_REFRESH_SECRET, 
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'meeting-app'
      }
    );
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}