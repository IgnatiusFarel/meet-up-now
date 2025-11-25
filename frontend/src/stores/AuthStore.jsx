import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import Api from "@/services/Api.jsx";

// ============ CONSTANTS ============
const AUTH_CONSTANTS = {
  TOKEN_EXPIRY_HOURS: 1,
  REFRESH_THRESHOLD_MINUTES: 5,
  STORAGE_KEYS: {
    TOKEN: "authToken",
    USER_DATA: "userData", 
    TOKEN_EXPIRY: "tokenExpiry",
    // REMOVED: REFRESH_TOKEN - it's now only in httpOnly cookies
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
  const expiry = tokenExpiry instanceof Date ? tokenExpiry : new Date(tokenExpiry);
  return expiry <= now;
};

const isTokenExpiringSoon = (tokenExpiry, thresholdMinutes = AUTH_CONSTANTS.REFRESH_THRESHOLD_MINUTES) => {
  if (!tokenExpiry) return true;
  const now = new Date();
  const expiry = tokenExpiry instanceof Date ? tokenExpiry : new Date(tokenExpiry);
  const timeDiff = expiry.getTime() - now.getTime();
  return timeDiff < thresholdMinutes * 60 * 1000;
};

// FIXED: Enhanced localStorage sync functions
const syncToLocalStorage = (key, value) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    }
    return true;
  } catch (error) {
    console.error(`Failed to sync ${key} to localStorage:`, error);
    return false;
  }
};

const getFromLocalStorage = (key, isJson = false) => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    return isJson ? JSON.parse(value) : value;
  } catch (error) {
    console.warn(`Failed to get ${key} from localStorage:`, error);
    return null;
  }
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
          // REMOVED: refreshToken - now only exists in httpOnly cookies
          isAuthenticated: false,
          isLoading: false,
          error: null,
          loginAttempts: 0,
          lastLoginTime: null,
          tokenExpiry: null,
          isInitialized: false,
          _isInitializing: false,

          // ============ FIXED INITIALIZATION ============
          initializeAuth: async () => {
            const currentState = get();
            
            if (currentState._isInitializing || currentState.isInitialized) {
              console.log("Auth already initializing or initialized, skipping");
              return;
            }

            console.log("Initializing authentication...");
            
            set((state) => {
              state._isInitializing = true;
              state.isLoading = true;
              state.error = null;
            });

            try {
              // CRITICAL: Get fresh data from localStorage (not refreshToken)
              const token = getFromLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
              const userData = getFromLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, true);
              const tokenExpiry = getFromLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY);

              console.log("Auth data check:", {
                hasToken: !!token,
                hasUserData: !!userData,
                tokenExpiry: tokenExpiry,
                // No refreshToken check - it's in httpOnly cookies
              });

              if (!token) {
                console.log("No token found, marking as not authenticated");
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

              const actualUser = extractUserData(userData);
              const parsedExpiry = tokenExpiry ? new Date(tokenExpiry) : null;

              console.log("Token expiry check:", {
                expiry: parsedExpiry,
                isExpired: parsedExpiry ? isTokenExpired(parsedExpiry) : true,
              });

              // If token is expired, try to refresh
              if (!parsedExpiry || isTokenExpired(parsedExpiry)) {
                console.log("Token expired, attempting refresh...");
                
                try {
                  setApiAuthHeader(token);
                  const newToken = await get().refreshAuthToken();
                  console.log("Token refreshed during initialization");
                  
                  set((state) => {
                    state.isInitialized = true;
                    state.isLoading = false;
                    state._isInitializing = false;
                  });
                  return;
                } catch (refreshError) {
                  console.log("Token refresh failed during init:", refreshError.message);
                  // Clear everything and mark as not authenticated
                  await get().clearAuth();
                  set((state) => {
                    state.isInitialized = true;
                    state.isLoading = false;
                    state._isInitializing = false;
                  });
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
              console.log("Auth state restored from localStorage");

            } catch (error) {
              console.error("Auth initialization error:", error);
              
              set((state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.tokenExpiry = null;
                state.isInitialized = true;
                state.isLoading = false;
                state._isInitializing = false;
              });
            }
          },

          // ============ FIXED TOKEN REFRESH ============
          refreshAuthToken: async () => {
            console.log("Refreshing authentication token...");
            
            try {
              // Use Api service which handles httpOnly cookies properly
              const response = await Api.post("/auth/refresh");
              console.log("Refresh response:", response.data);

              if (response.data?.success) {
                const { user, accessToken, refreshToken: newRefreshToken } = response.data.data;
                
                if (!accessToken) {
                  throw new Error("No access token in refresh response");
                }

                console.log("Token refresh data:", {
                  hasUser: !!user,
                  hasAccessToken: !!accessToken,
                  hasRefreshToken: !!newRefreshToken,
                });

                // CRITICAL: Update both store AND localStorage immediately
                const success = get().setAuthData(user, accessToken, newRefreshToken);
                
                if (!success) {
                  throw new Error("Failed to set auth data after refresh");
                }

                console.log("Token refreshed successfully");
                return accessToken;
              } else {
                throw new Error(response.data?.message || "Token refresh failed");
              }
            } catch (error) {
              console.error("Token refresh failed:", error);
              
              // On refresh failure, clear everything
              await get().clearAuth();
              throw error;
            }
          },

          // ============ FIXED AUTH DATA SETTER ============
          setAuthData: (user, accessToken, refreshToken = null) => {
            console.log("Setting authentication data...", {
              hasUser: !!user,
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              userEmail: user?.email
            });

            if (!accessToken) {
              console.error("No access token provided");
              return false;
            }

            const actualUser = user ? extractUserData(user) : null;
            const expiryTime = calculateTokenExpiry();

            try {
              // CRITICAL: Update localStorage FIRST before updating store
              const syncResults = {
                token: syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, accessToken),
                expiry: syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toISOString()),
                user: actualUser ? syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, actualUser) : true,
                refreshToken: refreshToken ? syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN, refreshToken) : true,
              };

              console.log("LocalStorage sync results:", syncResults);

              if (!syncResults.token || !syncResults.expiry) {
                throw new Error("Failed to sync critical auth data to localStorage");
              }

              // Set API authorization header
              setApiAuthHeader(accessToken);

              // Update store state AFTER localStorage is updated
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

              console.log("Authentication data set successfully:", {
                userEmail: actualUser?.email,
                hasToken: !!accessToken,
                tokenLength: accessToken?.length,
                localStorageCheck: {
                  hasToken: !!localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN),
                  hasUser: !!localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA),
                  hasExpiry: !!localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY)
                }
              });

              return true;
            } catch (error) {
              console.error("Failed to set auth data:", error);
              return false;
            }
          },

          // ============ IMPROVED CLEAR AUTH ============
          clearAuth: async () => {
            console.log("Clearing authentication data...");

            // Clear API headers first
            clearApiAuthHeader();

            // Clear localStorage (no refreshToken to clear)
            Object.values(AUTH_CONSTANTS.STORAGE_KEYS).forEach(key => {
              if (key !== AUTH_CONSTANTS.STORAGE_KEYS.STORE) {
                try {
                  localStorage.removeItem(key);
                } catch (error) {
                  console.warn(`Failed to remove ${key} from localStorage:`, error);
                }
              }
            });

            // Reset store state
            set((state) => {
              state.user = null;
              state.token = null;
              // No refreshToken to clear
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
              state.tokenExpiry = null;
              state.lastLoginTime = null;
            });

            console.log("Authentication data cleared");
          },

          // ============ IMPROVED CURRENT USER ============
          getCurrentUser: async () => {
            console.log("Fetching current user profile...");
            
            try {
              const currentToken = get().token || getFromLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
              
              if (!currentToken) {
                throw new Error("No authentication token available");
              }

              if (!Api.defaults.headers.common["Authorization"]) {
                setApiAuthHeader(currentToken);
              }

              const response = await Api.get("/auth/me");
              console.log("User profile response:", response.data);

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

                  syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, actualUser);
                  
                  console.log("User profile updated successfully");
                  return actualUser;
                }
              }
              
              throw new Error(response.data?.message || "Failed to fetch user profile");
            } catch (error) {
              console.error("Get current user failed:", error);

              // Only clear auth on 401, not on network errors
              if (error.response?.status === 401) {
                console.log("Unauthorized - attempting token refresh");
                
                try {
                  await get().refreshAuthToken();
                  return await get().getCurrentUser();
                } catch (refreshError) {
                  console.log("Token refresh failed, clearing auth");
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
            console.log("Starting Google OAuth login...");

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
                console.log("Redirecting to Google OAuth");
                window.location.href = authUrl;
                return;
              } else {
                throw new Error(response.data?.message || "Failed to get Google OAuth URL");
              }
            } catch (error) {
              console.error("Google OAuth initiation failed:", error);
              
              set((state) => {
                state.isLoading = false;
                state.error = error.response?.data?.message || error.message || "OAuth initiation failed";
              });
              
              throw error;
            }
          },

          // ============ FIXED OAUTH CALLBACK ============
          handleOAuthCallback: async (accessToken) => {
            console.log("Processing OAuth callback...");

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
              // Set the token first so we can make API calls
              setApiAuthHeader(accessToken);
              
              // Get user data from the /me endpoint
              const response = await Api.get("/auth/me");

              if (response.data?.success) {
                const userData = response.data.data;
                
                // CRITICAL: Set auth data properly
                const success = get().setAuthData(userData, accessToken);
                
                if (!success) {
                  throw new Error("Failed to set authentication data");
                }

                console.log("OAuth authentication successful");
                
                return {
                  success: true,
                  user: extractUserData(userData),
                  message: "Authentication successful"
                };
              } else {
                throw new Error(response.data?.message || "Failed to fetch user data");
              }
            } catch (error) {
              console.error("OAuth callback error:", error);

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
              console.log("Token expiring soon, refreshing...");
              
              try {
                await get().refreshAuthToken();
                return true;
              } catch (error) {
                console.error("Auto-refresh failed:", error);
                return false;
              }
            }

            return true;
          },

          updateUserProfile: async (userData) => {
            console.log("Updating user profile...");
            
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

                syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, actualUser);
                
                console.log("Profile updated successfully");
                return actualUser;
              } else {
                throw new Error(response.data?.message || "Profile update failed");
              }
            } catch (error) {
              console.error("Profile update failed:", error);
              
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
            console.log("Logging out user...");

            set((state) => {
              state.isLoading = true;
            });

            try {
              await Api.post("/auth/logout");
              console.log("Logout API call successful");
            } catch (error) {
              console.warn("Logout API call failed (proceeding anyway):", error.message);
            } finally {
              await get().clearAuth();
              console.log("Logout completed");
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
        // More selective persistence to avoid conflicts
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          // No refreshToken - it's in httpOnly cookies only
          tokenExpiry: state.tokenExpiry instanceof Date ? state.tokenExpiry.toISOString() : state.tokenExpiry,
          isAuthenticated: state.isAuthenticated,
          lastLoginTime: state.lastLoginTime instanceof Date ? state.lastLoginTime.toISOString() : state.lastLoginTime,
          loginAttempts: state.loginAttempts,
          isInitialized: state.isInitialized
        }),
        version: 2, // Increment version to clear old data
        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log("Rehydrating auth store from persist");
            // Reset loading and initialization flags
            state.isLoading = false;
            state._isInitializing = false;
            
            // Convert string dates back to Date objects
            if (state.tokenExpiry && typeof state.tokenExpiry === 'string') {
              state.tokenExpiry = new Date(state.tokenExpiry);
            }
            if (state.lastLoginTime && typeof state.lastLoginTime === 'string') {
              state.lastLoginTime = new Date(state.lastLoginTime);
            }
            
            // Validate localStorage sync after rehydration
            setTimeout(() => {
              const localToken = getFromLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
              const localUser = getFromLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, true);
              
              console.log("Post-rehydration localStorage check:", {
                storeHasToken: !!state.token,
                localHasToken: !!localToken,
                storeHasUser: !!state.user,
                localHasUser: !!localUser,
                tokensMatch: state.token === localToken,
                tokenExpiry: state.tokenExpiry,
                tokenExpiryType: typeof state.tokenExpiry
                // No refreshToken checks - it's secure in httpOnly cookies
              });
              
              // Fix tokenExpiry if it's a string
              if (state.tokenExpiry && typeof state.tokenExpiry === 'string') {
                try {
                  state.tokenExpiry = new Date(state.tokenExpiry);
                  console.log("Fixed tokenExpiry to Date object");
                } catch (error) {
                  console.warn("Failed to parse tokenExpiry:", error);
                  state.tokenExpiry = null;
                }
              }
              
              // If tokens don't match, use localStorage as source of truth
              if (state.token !== localToken) {
                if (localToken) {
                  console.log("Token mismatch - using localStorage token");
                  state.token = localToken;
                  setApiAuthHeader(localToken);
                } else if (state.token) {
                  console.log("Syncing store token to localStorage");
                  syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, state.token);
                }
              }
              
              // Sync missing data
              if (state.user && !localUser) {
                console.log("Syncing missing user data to localStorage");
                syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, state.user);
              }
              
              if (state.tokenExpiry) {
                const expiryString = state.tokenExpiry instanceof Date 
                  ? state.tokenExpiry.toISOString() 
                  : state.tokenExpiry;
                syncToLocalStorage(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN_EXPIRY, expiryString);
              }
            }, 100);
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