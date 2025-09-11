import { ApiResponse } from "#utils/response";
import { googleOAuthConfig } from "#config/oauth";
import { AuthService } from "#services/authService";

export class AuthController {
  static async getAuthUrl(req, res) {
    try {
      const authUrl = googleOAuthConfig.getAuthUrl();

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { authUrl },
            "Google OAuth URL generated successfully!"
          )
        );
    } catch (error) {
      console.error("Get auth URL error:", error);
      return res
        .status(500)
        .json(
          ApiResponse.error("Failed to generate auth URL!", 500, error.message)
        );
    }
  }

  // Alternative: Return JSON instead of redirect // Perbaiki AuthController.googleCallback dengan logging
  static async googleCallback(req, res) {
    try {
      console.log("🔄 Google callback received:", req.query);

      const { code } = req.query;

      if (!code) {
        console.error("❌ No code parameter received");
        return res.redirect("http://localhost:5173/");
      }

      console.log(
        "📝 Processing authorization code:",
        code.substring(0, 20) + "..."
      );

      const tokens = await AuthService.exchangeCodeForTokens(code);
      console.log("🎫 Tokens received from Google");

      const googleUserData = await AuthService.getGoogleUserInfo(
        tokens.access_token
      );
      console.log("👤 User data received:", googleUserData.email);

      const user = await AuthService.findOrCreateUser(googleUserData);
      console.log("💾 User found/created:", user.email);

      const { accessToken, refreshToken } = AuthService.generateTokens(user);
      console.log("🔐 JWT tokens generated");

      // Set cookie refresh token
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      console.log("🍪 Refresh token cookie set");

      // CRITICAL: Log redirect URL
      const redirectUrl = `http://localhost:5173/auth/callback?accessToken=${accessToken}`;
      console.log("🚀 Redirecting to:", redirectUrl);

      // Redirect ke frontend sambil kirim accessToken via query string
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error("❌ OAuth callback error:", err);
      return res.redirect("http://localhost:5173/");
    }
  }

  static async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res
          .status(401)
          .json(ApiResponse.unauthorized("Refresh token is required!"));
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      return res.status(200).json(
        ApiResponse.success(
          {
            user: result.user,
            accessToken: result.accessToken,
          },
          "Token refreshed successfully!"
        )
      );
    } catch (error) {
      console.error("Refresh token error:", error);

      // Clear invalid refresh token
      res.clearCookie("refreshToken");

      return res
        .status(401)
        .json(ApiResponse.unauthorized("Invalid or expired refresh token!"));
    }
  }

  static async logout(req, res) {
    try {
      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      return res
        .status(200)
        .json(ApiResponse.success(null, "Logout successfully!"));
    } catch (error) {
      console.error("Logout error:", error);
      return res
        .status(500)
        .json(ApiResponse.error("Logout failed!", 500, error.message));
    }
  }

  static async getMe(req, res) {
    try {
      // req.user sudah di-set oleh authenticateToken middleware
      return res
        .status(200)
        .json(
          ApiResponse.success(req.user, "User profile retrieved successfully!")
        );
    } catch (error) {
      console.error("Get me error:", error);
      return res
        .status(500)
        .json(
          ApiResponse.error("Failed to get user profile!", 500, error.message)
        );
    }
  }
}
