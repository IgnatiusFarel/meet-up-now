import { PrismaClient } from '@prisma/client';
import { JWTUtils } from '#utils/jwt';
import { googleOAuthConfig } from '#config/oauth';

const prisma = new PrismaClient();

export class AuthService {
  static async exchangeCodeForTokens(code) {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleOAuthConfig.clientId,
          client_secret: googleOAuthConfig.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: googleOAuthConfig.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      return await tokenResponse.json();
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  static async getGoogleUserInfo(accessToken) {
    try {
      const userResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!userResponse.ok) {
        const error = await userResponse.text();
        throw new Error(`Failed to fetch user info: ${error}`);
      }

      return await userResponse.json();
    } catch (error) {
      console.error('Get user info error:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  static async findOrCreateUser(googleUserData) {
    try {
      const { id: providerId, email, name, picture: avatarUrl } = googleUserData;

      // Cek apakah user sudah ada
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { 
              AND: [
                { provider: 'google' },
                { providerId }
              ]
            }
          ]
        }
      });

      if (user) {
        // Update user info jika ada perubahan
        user = await prisma.user.update({
          where: { userId: user.userId },
          data: {
            email,
            name,
            avatarUrl,
            provider: 'google',
            providerId,
            updatedAt: new Date()
          }
        });
      } else {
        // Buat user baru
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatarUrl,
            provider: 'google',
            providerId
          }
        });
      }

      return user;
    } catch (error) {
      console.error('Database operation error:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  static generateTokens(user) {
    const payload = {
      userId: user.userId,
      email: user.email,
      name: user.name
    };

    const accessToken = JWTUtils.generateAccessToken(payload);
    const refreshToken = JWTUtils.generateRefreshToken({ userId: user.userId });

    return { accessToken, refreshToken };
  }

  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      const user = await prisma.user.findUnique({
        where: { userId: decoded.userId },
        select: {
          userId: true,
          email: true,
          name: true,
          avatarUrl: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const payload = {
        userId: user.userId,
        email: user.email,
        name: user.name
      };

      const newAccessToken = JWTUtils.generateAccessToken(payload);
      
      return { 
        accessToken: newAccessToken, 
        user 
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  static async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { userId },
        select: {
          userId: true,
          email: true,
          name: true,
          avatarUrl: true,
          provider: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
}