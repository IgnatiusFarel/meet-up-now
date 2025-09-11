import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import Api from "@/Services/Api";

/**
 * AuthStore - Centralized Authentication State Management
 * 
 * Features:
 * - Google OAuth integration
 * - Token management with auto-refresh
 * - Persistent auth state
 * - Error handling and loading states
 * - Automatic API header management
 */

// ============ CONSTANTS ============
const AUTH_CONSTANTS = {
  TOKEN_EXPIRY_HOURS: 1,
  REFRESH_THRESHOLD_MINUTES: 5,
  STORAGE_KEYS: {
    TOKEN: "authToken",
    USER_DATA: "userData", 
    TOKEN_EXPIRY: "tokenExpiry",
    REFRESH_TOKEN: "refreshToken",
    STORE: "auth-store"
  }
};

// ============ UTILITY FUNCTIONS ============

/**
 * Extract actual user data from nested API response structure
 * Backend returns: { success, statusCode, message, data: { actualUserData } }
 */
const extractUserData = (responseUser) => {
  if (!responseUser) return null;
  
  // If already flat user object (has email/userId directly)
  if (responseUser.email || responseUser.userId) {
    return responseUser;
  }
  
  // If nested structure (response wrapper)
  if (responseUser.data && typeof responseUser.data === 'object') {
    return responseUser.data;
  }
  
  return responseUser;
};

/**
 * Set API authorization header
 */
const setApiAuthHeader = (token) => {
  if (token && Api.defaults) {
    Api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return true;
  }
  return false;
};

/**
 * Clear API authorization header
 */
const clearApiAuthHeader = () => {
  if (Api.defaults) {
    delete Api.defaults.headers.common["Authorization"];
  }
};

/**
 * Safe JSON parse with error handling
 */
const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return jsonString ? JSON.parse(jsonString) : fallback;
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return fallback;
  }
};

/**
 * Calculate token expiry time
 */
const calculateTokenExpiry = (hours = AUTH_CONSTANTS.TOKEN_EXPIRY_HOURS) => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
};

/**
 * Check if token is expired or expiring soon
 */
const isTokenExpired = (tokenExpiry) => {
  if (!tokenExpiry) return true;
  const now = new Date();
  return new Date(tokenExpiry) <= now;
};

const isTokenExpiringSoon = (tokenExpiry, thresholdMinutes = AUTH_CONSTANTS.REFRESH_THRESHOLD_MINUTES) => {
  if (!tokenExpiry) return true;
  const now = new Date();
  const timeDiff = new Date(tokenExpiry).getTime() - now.getTime();
  return timeDiff < thresholdMinutes * 60 * 1000;
};

// ============ ZUSTAND STORE ============

const useAuthStore = create(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // ============ STATE ============
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          loginAttempts: 0,
          lastLoginTime: null,
          tokenExpiry: null,

          // ============ CORE AUTH ACTIONS ============

          /**
           * Initialize authentication state from localStorage
           * Called on app startup to restore user session
           */
          initializeAuth: () => {
            console.log("🔄 Initializing authentication...");
            
            const token = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
            const userData = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA);
            const tokenExpiry = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY);

            console.log("📊 Auth data check:", {
              hasToken: !!token,
              hasUserData: !!userData,
              tokenExpiry: tokenExpiry
            });

            // Validate required auth data
            if (!token || !userData || !tokenExpiry) {
              console.log("❌ Missing auth data, user needs to login");
              return;
            }

            // Check token expiry
            if (isTokenExpired(tokenExpiry)) {
              console.log("❌ Token expired, clearing auth data");
              get().clearAuth();
              return;
            }

            // Parse and extract user data
            const rawUserData = safeJsonParse(userData);
            const actualUser = extractUserData(rawUserData);

            if (!actualUser) {
              console.log("❌ Invalid user data format, clearing auth");
              get().clearAuth();
              return;
            }

            // Restore authentication state
            set((state) => {
              state.token = token;
              state.user = actualUser;
              state.tokenExpiry = new Date(tokenExpiry);
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
            });

            // Set API header for future requests
            const headerSet = setApiAuthHeader(token);

            console.log("✅ Authentication initialized successfully:", {
              userEmail: actualUser.email,
              userName: actualUser.name,
              userId: actualUser.userId,
              apiHeaderSet: headerSet
            });
          },

          /**
           * Set authentication data after successful login
           * Updates store state, localStorage, and API headers
           */
          setAuthData: (user, accessToken, refreshToken = null) => {
            console.log("🔄 Setting authentication data...");

            if (!user || !accessToken) {
              console.error("❌ Invalid auth data provided");
              return;
            }

            const actualUser = extractUserData(user);
            const expiryTime = calculateTokenExpiry();

            // Update localStorage with error handling
            try {
              localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, accessToken);
              localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(actualUser));
              localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toISOString());
              
              if (refreshToken) {
                localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
              }

              console.log("💾 Auth data saved to localStorage");
            } catch (error) {
              console.error("❌ Failed to save auth data to localStorage:", error);
            }

            // Update store state
            set((state) => {
              state.user = actualUser;
              state.token = accessToken;
              state.refreshToken = refreshToken || state.refreshToken;
              state.tokenExpiry = expiryTime;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
              state.lastLoginTime = new Date();
              state.loginAttempts = 0; // Reset attempts on successful auth
            });

            // Set API authorization header
            const headerSet = setApiAuthHeader(accessToken);

            console.log("✅ Authentication data set successfully:", {
              userEmail: actualUser.email,
              userName: actualUser.name,
              userId: actualUser.userId,
              apiHeaderSet: headerSet
            });
          },

          /**
           * Clear all authentication data
           * Used for logout and when tokens are invalid
           */
          clearAuth: () => {
            console.log("🧹 Clearing authentication data...");

            // Clear localStorage
            Object.values(AUTH_CONSTANTS.STORAGE_KEYS).forEach(key => {
              localStorage.removeItem(key);
            });

            // Clear API headers
            clearApiAuthHeader();

            // Reset store state
            set((state) => {
              state.user = null;
              state.token = null;
              state.refreshToken = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
              state.tokenExpiry = null;
              // Keep loginAttempts and lastLoginTime for analytics
            });

            console.log("✅ Authentication data cleared");
          },

          // ============ GOOGLE OAUTH ACTIONS ============

          /**
           * Initiate Google OAuth login flow
           * Redirects user to Google OAuth consent screen
           */
          startGoogleLogin: async () => {
            console.log("🚀 Starting Google OAuth login...");

            set((state) => {
              state.isLoading = true;
              state.error = null;
              state.loginAttempts += 1;
            });

            try {
              // Request OAuth URL from backend
              const response = await Api.get("/auth/google", {
                params: { 
                  prompt: "select_account" // Force account selection
                }
              });

              console.log("📡 OAuth URL response:", response.data);

              const authUrl = response.data?.data?.authUrl;

              if (response.data?.success && authUrl) {
                console.log("🔗 Redirecting to Google OAuth:", authUrl);
                
                // Redirect to Google OAuth
                window.location.href = authUrl;
                return; // Execution stops here due to redirect
              } else {
                throw new Error(response.data?.message || "Failed to get Google OAuth URL");
              }
            } catch (error) {
              console.error("❌ Google OAuth initiation failed:", error);
              
              set((state) => {
                state.isLoading = false;
                state.error = error.response?.data?.message || error.message || "OAuth initiation failed";
              });
              
              throw error;
            }
          },

          /**
           * Handle OAuth callback with authorization code
           * Called when user returns from Google OAuth consent
           */
          handleOAuthCallback: async (code) => {
            console.log("🔄 Processing OAuth callback...", { codeLength: code?.length });

            if (!code) {
              const error = "Missing authorization code";
              console.error("❌", error);
              set((state) => {
                state.isLoading = false;
                state.error = error;
              });
              return { success: false, message: error };
            }

            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              // Exchange code for tokens
              const response = await Api.get("/auth/google/callback", {
                params: { code }
              });

              console.log("📡 OAuth callback response:", response.data);

              if (response.data?.success) {
                const { user, accessToken, refreshToken } = response.data.data;
                
                // Set authentication data
                get().setAuthData(user, accessToken, refreshToken);

                console.log("✅ OAuth authentication successful");
                
                return {
                  success: true,
                  user: extractUserData(user),
                  message: "Authentication successful"
                };
              } else {
                throw new Error(response.data?.message || "OAuth callback failed");
              }
            } catch (error) {
              console.error("❌ OAuth callback error:", error);

              const errorMessage = error.response?.data?.message || 
                                   error.message || 
                                   "Authentication failed";

              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              return {
                success: false,
                message: errorMessage,
                error: error
              };
            }
          },

          // ============ USER DATA ACTIONS ============

          /**
           * Fetch current user profile from backend
           * Used to refresh user data and validate token
           */
          getCurrentUser: async () => {
            console.log("🔄 Fetching current user profile...");
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              // Ensure we have a valid token
              const currentToken = get().token || localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
              
              if (!currentToken) {
                throw new Error("No authentication token available");
              }

              // Ensure API header is set
              if (!Api.defaults.headers.common["Authorization"]) {
                setApiAuthHeader(currentToken);
                console.log("🔧 Set API authorization header");
              }

              console.log("📡 Making /auth/me request...");
              
              // Fetch user profile
              const response = await Api.get("/auth/me");

              console.log("📡 User profile response:", response.data);

              if (response.data?.success) {
                const rawUserData = response.data.data;
                const actualUser = extractUserData(rawUserData);

                if (!actualUser) {
                  throw new Error("Invalid user data format received");
                }

                // Update store and localStorage
                set((state) => {
                  state.user = actualUser;
                  state.isLoading = false;
                });

                localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(actualUser));
                
                console.log("✅ User profile updated successfully:", {
                  userEmail: actualUser.email,
                  userName: actualUser.name,
                  userId: actualUser.userId
                });
                
                return actualUser;
              } else {
                throw new Error(response.data?.message || "Failed to fetch user profile");
              }
            } catch (error) {
              console.error("❌ Get current user failed:", {
                message: error.message,
                status: error.response?.status,
                responseData: error.response?.data
              });

              const errorMessage = error.response?.data?.message || 
                                   error.message || 
                                   "Failed to fetch user profile";

              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              // Handle authentication errors
              if (error.response?.status === 401) {
                console.log("🔐 Unauthorized - clearing authentication");
                get().clearAuth();
              }

              throw error;
            }
          },

          /**
           * Update user profile information
           */
          updateUserProfile: async (userData) => {
            console.log("🔄 Updating user profile...");
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const response = await Api.put("/auth/profile", userData);

              if (response.data?.success) {
                const rawUpdatedUser = response.data.data;
                const actualUser = extractUserData(rawUpdatedUser);

                set((state) => {
                  state.user = actualUser;
                  state.isLoading = false;
                });

                localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(actualUser));
                
                console.log("✅ Profile updated successfully");
                return actualUser;
              } else {
                throw new Error(response.data?.message || "Profile update failed");
              }
            } catch (error) {
              console.error("❌ Profile update failed:", error);
              
              const errorMessage = error.response?.data?.message || 
                                   error.message || 
                                   "Failed to update profile";

              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              throw error;
            }
          },

          // ============ TOKEN MANAGEMENT ============

          /**
           * Refresh authentication token using refresh token
           */
          refreshAuthToken: async () => {
            console.log("🔄 Refreshing authentication token...");
            
            const refreshToken = get().refreshToken || 
                                localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            try {
              const response = await Api.post("/auth/refresh", {
                refreshToken
              });

              if (response.data?.success) {
                const { user, accessToken, refreshToken: newRefreshToken } = response.data.data;
                
                // Update auth data with new tokens
                get().setAuthData(
                  user, 
                  accessToken, 
                  newRefreshToken || refreshToken
                );

                console.log("✅ Token refreshed successfully");
                return accessToken;
              } else {
                throw new Error(response.data?.message || "Token refresh failed");
              }
            } catch (error) {
              console.error("❌ Token refresh failed:", error);
              
              // Clear auth on refresh failure
              get().clearAuth();
              throw error;
            }
          },

          // ============ LOGOUT ACTION ============

          /**
           * Logout user and clean up session
           */
          logout: async () => {
            console.log("🚪 Logging out user...");

            set((state) => {
              state.isLoading = true;
            });

            try {
              // Notify backend of logout (optional)
              await Api.post("/auth/logout");
              console.log("📡 Logout API call successful");
            } catch (error) {
              console.warn("⚠️ Logout API call failed (proceeding anyway):", error.message);
            } finally {
              // Always clear local auth data
              get().clearAuth();
              console.log("✅ Logout completed");
            }
          },

          // ============ UTILITY ACTIONS ============

          /**
           * Clear error state
           */
          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          /**
           * Check if token is expiring soon
           */
          isTokenExpiringSoon: () => {
            const { tokenExpiry } = get();
            return isTokenExpiringSoon(tokenExpiry);
          },

          /**
           * Get authorization header object for manual API calls
           */
          getAuthHeader: () => {
            const { token } = get();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },

          /**
           * Get current authentication status
           */
          getAuthStatus: () => {
            const state = get();
            return {
              isAuthenticated: state.isAuthenticated,
              isLoading: state.isLoading,
              hasError: !!state.error,
              user: state.user,
              tokenExpiry: state.tokenExpiry,
              isTokenExpiringSoon: get().isTokenExpiringSoon()
            };
          }
        }))
      ),
      {
        name: AUTH_CONSTANTS.STORAGE_KEYS.STORE,
        // Only persist essential data
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          tokenExpiry: state.tokenExpiry,
          isAuthenticated: state.isAuthenticated,
          lastLoginTime: state.lastLoginTime,
          loginAttempts: state.loginAttempts
        })
      }
    ),
    {
      name: "AuthStore",
      // Enhanced devtools configuration
      serialize: {
        options: {
          // Hide sensitive data in devtools
          replacer: (key, value) => {
            if (key === 'token' || key === 'refreshToken') {
              return value ? `${value.substring(0, 10)}...` : null;
            }
            return value;
          }
        }
      }
    }
  )
);

export default useAuthStore;