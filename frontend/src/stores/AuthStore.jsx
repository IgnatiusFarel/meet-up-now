import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import Api from "@/Services/Api";

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
const extractUserData = (responseUser) => {
  if (!responseUser) return null;
  
  if (responseUser.email || responseUser.userId) {
    return responseUser;
  }
  
  if (responseUser.data && typeof responseUser.data === 'object') {
    return responseUser.data;
  }
  
  return responseUser;
};

const setApiAuthHeader = (token) => {
  if (token && Api.defaults) {
    Api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return true;
  }
  return false;
};

const clearApiAuthHeader = () => {
  if (Api.defaults) {
    delete Api.defaults.headers.common["Authorization"];
  }
};

const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return jsonString ? JSON.parse(jsonString) : fallback;
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return fallback;
  }
};

const calculateTokenExpiry = (hours = AUTH_CONSTANTS.TOKEN_EXPIRY_HOURS) => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
};

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

// ============ ZUSTAND STORE WITH FIXES ============
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
          isInitialized: false,
          _isInitializing: false, // Prevent multiple concurrent inits

          // ============ FIXED INITIALIZATION ============
          initializeAuth: async () => {
            const currentState = get();
            
            // Prevent multiple concurrent initializations
            if (currentState._isInitializing || currentState.isInitialized) {
              console.log("🔄 Auth already initializing or initialized, skipping");
              return;
            }

            console.log("🔄 Initializing authentication...");
            
            set((state) => {
              state._isInitializing = true;
              state.isLoading = true;
              state.error = null;
            });

            try {
              // Get fresh data from localStorage (not from persisted state)
              const token = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
              const userData = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA);
              const tokenExpiry = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY);

              console.log("📊 Auth data check:", {
                hasToken: !!token,
                hasUserData: !!userData,
                tokenExpiry: tokenExpiry,
                tokenLength: token?.length
              });

              // If no token, just mark as initialized (not authenticated)
              if (!token) {
                console.log("❌ No token found, marking as not authenticated");
                set((state) => {
                  state.isAuthenticated = false;
                  state.user = null;
                  state.token = null;
                  state.tokenExpiry = null;
                  state.isInitialized = true;
                  state.isLoading = false;
                  state._isInitializing = false;
                });
                return;
              }

              // Parse user data - be more lenient here
              const rawUserData = safeJsonParse(userData);
              const actualUser = extractUserData(rawUserData);

              // Check if token is expired
              const parsedExpiry = tokenExpiry ? new Date(tokenExpiry) : null;
              const now = new Date();
              
              console.log("🕐 Token expiry check:", {
                expiry: parsedExpiry,
                now: now,
                isExpired: parsedExpiry ? parsedExpiry <= now : true,
                minutesLeft: parsedExpiry ? Math.floor((parsedExpiry - now) / 60000) : 0
              });

              // If token is expired, try to refresh
              if (!parsedExpiry || isTokenExpired(tokenExpiry)) {
                console.log("🔄 Token expired, attempting refresh...");
                
                try {
                  // Temporarily set the expired token to make the refresh call
                  setApiAuthHeader(token);
                  await get().refreshAuthToken();
                  console.log("✅ Token refreshed during initialization");
                  
                  // Mark as initialized after successful refresh
                  set((state) => {
                    state.isInitialized = true;
                    state.isLoading = false;
                    state._isInitializing = false;
                  });
                  return;
                } catch (refreshError) {
                  console.log("❌ Token refresh failed during init:", refreshError.message);
                  // Don't clear everything, just mark as not authenticated
                  set((state) => {
                    state.isAuthenticated = false;
                    state.user = null;
                    state.token = null;
                    state.tokenExpiry = null;
                    state.isInitialized = true;
                    state.isLoading = false;
                    state._isInitializing = false;
                  });
                  
                  // Clear localStorage but don't clear persisted state yet
                  localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
                  clearApiAuthHeader();
                  return;
                }
              }

              // Token is valid, restore state
              set((state) => {
                state.token = token;
                state.user = actualUser;
                state.tokenExpiry = parsedExpiry;
                state.isAuthenticated = true;
                state.isInitialized = true;
                state.isLoading = false;
                state._isInitializing = false;
              });

              setApiAuthHeader(token);
              console.log("✅ Auth state restored from localStorage");

              // Optional: Validate with server (but don't fail initialization if this fails)
              try {
                const validatedUser = await get().getCurrentUser();
                console.log("✅ Token validated with server");
              } catch (validationError) {
                console.warn("⚠️ Server validation failed, but keeping local auth:", validationError.message);
                // Don't clear auth here - let the user try to use the app
              }

            } catch (error) {
              console.error("❌ Auth initialization error:", error);
              
              // On any error, just mark as not authenticated but initialized
              set((state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.tokenExpiry = null;
                state.isInitialized = true;
                state.isLoading = false;
                state._isInitializing = false;
              });
            }
          },

          // ============ FIXED TOKEN REFRESH ============
          refreshAuthToken: async () => {
            console.log("🔄 Refreshing authentication token...");
            
            try {
              const response = await Api.post("/auth/refresh");
              console.log("📡 Refresh response:", response.data);

              if (response.data?.success) {
                const { user, accessToken } = response.data.data;
                
                if (!accessToken) {
                  throw new Error("No access token in refresh response");
                }

                // Update auth data with new token
                const success = get().setAuthData(user, accessToken);
                
                if (!success) {
                  throw new Error("Failed to set auth data after refresh");
                }

                console.log("✅ Token refreshed successfully");
                return accessToken;
              } else {
                throw new Error(response.data?.message || "Token refresh failed");
              }
            } catch (error) {
              console.error("❌ Token refresh failed:", error);
              
              // On refresh failure, clear auth but don't throw immediately
              set((state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.tokenExpiry = null;
              });
              
              // Clear localStorage and API headers
              localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
              localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA);
              localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY);
              clearApiAuthHeader();
              
              throw error;
            }
          },

          // ============ IMPROVED AUTH DATA SETTER ============
          setAuthData: (user, accessToken, refreshToken = null) => {
            console.log("🔄 Setting authentication data...");

            if (!accessToken) {
              console.error("❌ No access token provided");
              return false;
            }

            const actualUser = user ? extractUserData(user) : null;
            const expiryTime = calculateTokenExpiry();

            try {
              // Update localStorage first
              localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, accessToken);
              localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toISOString());
              
              if (actualUser) {
                localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(actualUser));
              }
              
              if (refreshToken) {
                localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
              }

              console.log("💾 Auth data saved to localStorage");
            } catch (error) {
              console.error("❌ Failed to save auth data to localStorage:", error);
              return false;
            }

            // Update store state - this will trigger persist
            set((state) => {
              state.user = actualUser;
              state.token = accessToken;
              state.refreshToken = refreshToken || state.refreshToken;
              state.tokenExpiry = expiryTime;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
              state.lastLoginTime = new Date();
              state.loginAttempts = 0;
            });

            // Set API authorization header
            setApiAuthHeader(accessToken);

            console.log("✅ Authentication data set successfully:", {
              userEmail: actualUser?.email,
              hasToken: !!accessToken,
              tokenLength: accessToken?.length
            });

            return true;
          },

          // ============ IMPROVED CLEAR AUTH ============
          clearAuth: async () => {
            console.log("🧹 Clearing authentication data...");

            // Clear API headers first
            clearApiAuthHeader();

            // Clear localStorage
            Object.values(AUTH_CONSTANTS.STORAGE_KEYS).forEach(key => {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                console.warn(`Failed to remove ${key} from localStorage:`, error);
              }
            });

            // Reset store state - this will also update the persisted state
            set((state) => {
              state.user = null;
              state.token = null;
              state.refreshToken = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
              state.tokenExpiry = null;
              state.lastLoginTime = null;
              // Keep isInitialized and loginAttempts
            });

            console.log("✅ Authentication data cleared");
          },

          // ============ IMPROVED CURRENT USER ============
          getCurrentUser: async () => {
            console.log("🔄 Fetching current user profile...");
            
            try {
              const currentToken = get().token || localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
              
              if (!currentToken) {
                throw new Error("No authentication token available");
              }

              if (!Api.defaults.headers.common["Authorization"]) {
                setApiAuthHeader(currentToken);
              }

              const response = await Api.get("/auth/me");
              console.log("📡 User profile response:", response.data);

              if (response.data?.success) {
                const rawUserData = response.data.data;
                const actualUser = extractUserData(rawUserData);

                if (actualUser) {
                  // Update store and localStorage
                  set((state) => {
                    state.user = actualUser;
                    state.isLoading = false;
                    state.error = null;
                  });

                  try {
                    localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(actualUser));
                  } catch (error) {
                    console.warn("Failed to update localStorage user data:", error);
                  }
                  
                  console.log("✅ User profile updated successfully");
                  return actualUser;
                }
              }
              
              throw new Error(response.data?.message || "Failed to fetch user profile");
            } catch (error) {
              console.error("❌ Get current user failed:", error);

              // Only clear auth on 401, not on network errors
              if (error.response?.status === 401) {
                console.log("🔐 Unauthorized - token invalid");
                
                // Try refresh once
                try {
                  await get().refreshAuthToken();
                  return await get().getCurrentUser();
                } catch (refreshError) {
                  console.log("❌ Token refresh failed, clearing auth");
                  await get().clearAuth();
                  throw new Error("Authentication failed - please login again");
                }
              }

              const errorMessage = error.response?.data?.message || 
                                   error.message || 
                                   "Failed to fetch user profile";

              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              throw error;
            }
          },

          // ============ OAUTH METHODS ============
          startGoogleLogin: async () => {
            console.log("🚀 Starting Google OAuth login...");

            set((state) => {
              state.isLoading = true;
              state.error = null;
              state.loginAttempts += 1;
            });

            try {
              const response = await Api.get("/auth/google", {
                params: { prompt: "select_account" }
              });

              const authUrl = response.data?.data?.authUrl;

              if (response.data?.success && authUrl) {
                console.log("🔗 Redirecting to Google OAuth");
                window.location.href = authUrl;
                return;
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

          handleOAuthCallback: async (accessToken) => {
            console.log("🔄 Processing OAuth callback...");

            if (!accessToken) {
              const error = "Missing access token";
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
              setApiAuthHeader(accessToken);
              const response = await Api.get("/auth/me");

              if (response.data?.success) {
                const userData = response.data.data;
                const success = get().setAuthData(userData, accessToken);
                
                if (!success) {
                  throw new Error("Failed to set authentication data");
                }

                console.log("✅ OAuth authentication successful");
                
                return {
                  success: true,
                  user: extractUserData(userData),
                  message: "Authentication successful"
                };
              } else {
                throw new Error(response.data?.message || "Failed to fetch user data");
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

              clearApiAuthHeader();

              return {
                success: false,
                message: errorMessage,
                error: error
              };
            }
          },

          // ============ OTHER METHODS ============
          checkAndRefreshToken: async () => {
            const { tokenExpiry, isAuthenticated } = get();
            
            if (!isAuthenticated || !tokenExpiry) {
              return false;
            }

            if (isTokenExpiringSoon(tokenExpiry)) {
              console.log("🔄 Token expiring soon, refreshing...");
              
              try {
                await get().refreshAuthToken();
                return true;
              } catch (error) {
                console.error("❌ Auto-refresh failed:", error);
                return false;
              }
            }

            return true;
          },

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

          logout: async () => {
            console.log("🚪 Logging out user...");

            set((state) => {
              state.isLoading = true;
            });

            try {
              await Api.post("/auth/logout");
              console.log("📡 Logout API call successful");
            } catch (error) {
              console.warn("⚠️ Logout API call failed (proceeding anyway):", error.message);
            } finally {
              await get().clearAuth();
              console.log("✅ Logout completed");
            }
          },

          // ============ UTILITY METHODS ============
          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          isTokenExpiringSoon: () => {
            const { tokenExpiry } = get();
            return isTokenExpiringSoon(tokenExpiry);
          },

          getAuthHeader: () => {
            const { token } = get();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },

          getAuthStatus: () => {
            const state = get();
            return {
              isAuthenticated: state.isAuthenticated,
              isLoading: state.isLoading,
              isInitialized: state.isInitialized,
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
        // More selective persistence to avoid state conflicts
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          tokenExpiry: state.tokenExpiry,
          isAuthenticated: state.isAuthenticated,
          lastLoginTime: state.lastLoginTime,
          loginAttempts: state.loginAttempts,
          isInitialized: state.isInitialized
        }),
        // Add version to handle schema changes
        version: 1,
        // Handle state restoration more carefully
        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log("🔄 Rehydrating auth store from persist");
            // Reset loading and initialization flags on rehydration
            state.isLoading = false;
            state._isInitializing = false;
          }
        }
      }
    ),
    {
      name: "AuthStore",
      serialize: {
        options: {
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