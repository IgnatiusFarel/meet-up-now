import { AuthService } from '#services/authService';
import { ApiResponse } from '#utils/response';
import { googleOAuthConfig } from '#config/oauth';

export class AuthController {
  static async getAuthUrl(req, res) {
    try {
      const authUrl = googleOAuthConfig.getAuthUrl();
      
      return res.status(200).json(
        ApiResponse.success(
          { authUrl }, 
          'Google OAuth URL generated successfully'
        )
      );
    } catch (error) {
      console.error('Get auth URL error:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to generate auth URL', 500, error.message)
      );
    }
  }

  static async googleCallback(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json(
          ApiResponse.badRequest('Authorization code is required')
        );
      }

      // Exchange code for tokens
      const tokens = await AuthService.exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUserData = await AuthService.getGoogleUserInfo(tokens.access_token);
      
      // Find or create user in database
      const user = await AuthService.findOrCreateUser(googleUserData);
      
      // Generate JWT tokens
      const { accessToken, refreshToken } = AuthService.generateTokens(user);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json(
        ApiResponse.success(
          {
            user: {
              userId: user.userId,
              email: user.email,
              name: user.name,
              avatarUrl: user.avatarUrl
            },
            accessToken
          },
          'Login successful'
        )
      );
    } catch (error) {
      console.error('Google callback error:', error);
      return res.status(500).json(
        ApiResponse.error('Authentication failed', 500, error.message)
      );
    }
  }

  static async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json(
          ApiResponse.unauthorized('Refresh token is required')
        );
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      return res.status(200).json(
        ApiResponse.success(
          {
            user: result.user,
            accessToken: result.accessToken
          },
          'Token refreshed successfully'
        )
      );
    } catch (error) {
      console.error('Refresh token error:', error);
      
      // Clear invalid refresh token
      res.clearCookie('refreshToken');
      
      return res.status(401).json(
        ApiResponse.unauthorized('Invalid or expired refresh token')
      );
    }
  }

  static async logout(req, res) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      return res.status(200).json(
        ApiResponse.success(null, 'Logout successful')
      );
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json(
        ApiResponse.error('Logout failed', 500, error.message)
      );
    }
  }

  static async getMe(req, res) {
    try {
      // req.user sudah di-set oleh authenticateToken middleware
      return res.status(200).json(
        ApiResponse.success(
          req.user,
          'User profile retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Get me error:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to get user profile', 500, error.message)
      );
    }
  }
}