import { JWTUtils } from "#utils/jwt";
import { PrismaClient } from "@prisma/client";
import { googleOAuthConfig } from "#config/oauth";

const prisma = new PrismaClient();

export class AuthService {
  static async exchangeCodeForTokens(code) {
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: googleOAuthConfig.clientId,
          client_secret: googleOAuthConfig.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: googleOAuthConfig.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      return await tokenResponse.json();
    } catch (error) {
      console.error("Token exchange error:", error);
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
      console.error("Get user info error:", error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  static async findOrCreateUser(googleUserData) {
    const { id: providerId, email, name, picture: avatarUrl } = googleUserData;

    try {
      const user = await prisma.$transaction(async (tx) => {
        // Cek apakah user sudah ada
        let existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              {
                AND: [{ provider: "google" }, { providerId }],
              },
            ],
          },
        });

        if (existingUser) {
          // Update user info jika ada perubahan
          const needsUpdate =
            existingUser.name !== name ||
            existingUser.avatarUrl !== avatarUrl ||
            existingUser.provider !== "google" ||
            existingUser.providerId !== providerId;

          if (needsUpdate) {
            return await tx.user.update({
              where: { userId: existingUser.userId },
              data: {
                name,
                avatarUrl,
                provider: "google",
                providerId,
                lastLoginAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }
          return await tx.user.update({
            where: { userId: existingUser.userId },
            data: { lastLoginAt: new Date(), updatedAt: new Date() },
          });
        }

        return await tx.user.create({
          data: {
            email,
            name,
            avatarUrl,
            provider: "google",
            providerId,
            emailVerified: true,
            lastLoginAt: new Date(),
          },
        });
      });
      console.error(`User ${user.email} logged in successfully`);
      return user;
    } catch (error) {
      console.error("Database operation error:", error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  static generateTokens(user) {
    const payload = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    };

    const accessToken = JWTUtils.generateAccessToken(payload);
    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user.userId,
      tokenVersion: user.tokenVersion || 0,
    });

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
          avatarUrl: true,
          role: true,
          tokenVersion: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new Error("User not found or inactive.");
      }

      if (user.tokenVersion !== decoded.tokenVersion) {
        throw new Error("Token has been revoked.");
      }

      const payload = {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const newAccessToken = JWTUtils.generateAccessToken(payload);

      return {
        accessToken: newAccessToken,
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  static async revokeUserTokens(userId) {
    try {
      await prisma.user.update({
        where: { userId },
        data: { tokenVersion: { increment: 1 } },
      });
    } catch (error) {
      console.error("Revoke tokens error:", error);
      throw new Error("Failed to revoke tokens");
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
          role: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new Error("User not found or inactive.");
      }

      return user;
    } catch (error) {
      console.error("Get user error:", error);
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }
}
