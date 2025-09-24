import axios from "axios";

// Create axios instance
const Api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || "http://127.0.0.1:3000/api",
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Network retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Helper function to wait/delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if error is network related
const isNetworkError = (error) => {
  return !error.response && (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.message === 'Network Error'
  );
};

// FIXED: Better response data extraction
const extractRefreshTokens = (respData) => {
  console.log("🔍 Extracting tokens from response:", respData);
  
  if (!respData) return {};
  
  // Handle your backend's ApiResponse.success format
  if (respData.success && respData.data) {
    const data = respData.data;
    return {
      accessToken: data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token,
      user: data.user || data.userData,
    };
  }
  
  // Handle direct data format
  if (respData.accessToken || respData.access_token) {
    return {
      accessToken: respData.accessToken || respData.access_token,
      refreshToken: respData.refreshToken || respData.refresh_token,
      user: respData.user || respData.userData,
    };
  }
  
  // Handle nested data format
  if (respData.data && typeof respData.data === 'object') {
    const d = respData.data;
    return {
      accessToken: d.accessToken || d.access_token,
      refreshToken: d.refreshToken || d.refresh_token,
      user: d.user || d.userData,
    };
  }
  
  return {};
};

// FIXED: Enhanced refresh token function
const attemptRefreshWithRetry = async (maxRetries = MAX_RETRY_ATTEMPTS) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Token refresh attempt ${attempt}/${maxRetries}`);
      
      // IMPORTANT: Don't send refresh token in body, rely on httpOnly cookie
      // Backend will get it from req.cookies.refreshToken
      const refreshResponse = await axios.post('/auth/refresh', 
        {}, // Empty body, backend reads from cookie
        {
          baseURL: import.meta.env.VITE_APP_API_URL || "http://127.0.0.1:3000/api",
          withCredentials: true, // This is crucial for cookies
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log("📡 Refresh response received:", refreshResponse.data);

      const { accessToken, refreshToken: newRefreshToken, user } = extractRefreshTokens(refreshResponse.data);

      if (!accessToken) {
        console.error("❌ No access token in refresh response:", refreshResponse.data);
        throw new Error('Invalid refresh response, no access token returned');
      }

      console.log(`✅ Token refresh successful on attempt ${attempt}`, {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!newRefreshToken,
        hasUser: !!user,
        userEmail: user?.email
      });

      // CRITICAL: Update localStorage immediately
      try {
        localStorage.setItem("authToken", accessToken);
        Api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
          console.log("💾 New refresh token stored in localStorage");
        }
        
        if (user) {
          localStorage.setItem("userData", JSON.stringify(user));
          console.log("💾 User data stored in localStorage");
        }

        // Calculate and store token expiry
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // 1 hour expiry
        localStorage.setItem("tokenExpiry", expiry.toISOString());
        console.log("💾 Token expiry stored:", expiry.toISOString());

      } catch (storageError) {
        console.error("❌ Failed to update localStorage:", storageError);
        throw new Error("Failed to store authentication data");
      }

      return { 
        success: true, 
        accessToken, 
        refreshToken: newRefreshToken, 
        user 
      };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Refresh attempt ${attempt} failed:`, error.message);

      if (isNetworkError(error) && attempt < maxRetries) {
        console.warn(`⚠️ Network error on refresh attempt ${attempt}, retrying in ${RETRY_DELAY * attempt}ms...`);
        await delay(RETRY_DELAY * attempt);
        continue;
      }

      if (!isNetworkError(error) || attempt === maxRetries) {
        break;
      }
    }
  }

  throw lastError;
};

// Request interceptor
Api.interceptors.request.use(
  (config) => {
    // Add auth header if available
    const token = localStorage.getItem("authToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        hasAuth: !!config.headers.Authorization,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

Api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`📥 API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        success: response.data?.success !== undefined ? response.data.success : true
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        isRetry: originalRequest._retry,
        isNetworkError: isNetworkError(error)
      });
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {

      // Skip refresh for auth endpoints to prevent loops
      if (originalRequest.url?.includes('/auth/')) {
        console.log('🔐 Auth endpoint failed, not attempting refresh');

        // Only clear auth for critical auth endpoints if not network error
        if ((originalRequest.url?.includes('/auth/me') || originalRequest.url?.includes('/auth/refresh')) && !isNetworkError(error)) {
          Api.clearAuth();
          if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            window.location.href = '/';
          }
        }

        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return Api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      console.log('🔄 Starting token refresh with retry logic...');
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResult = await attemptRefreshWithRetry();
        console.log("✅ Token refresh completed successfully");

        // resolve queued requests with new token
        processQueue(null, refreshResult.accessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshResult.accessToken}`;
        return Api(originalRequest);

      } catch (refreshError) {
        console.error('❌ All token refresh attempts failed:', refreshError);

        // Process failed queue
        processQueue(refreshError, null);

        // Only clear auth and redirect if it's NOT a network error
        if (!isNetworkError(refreshError)) {
          Api.clearAuth();

          if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            console.log('🔄 Redirecting to login due to auth failure');
            window.location.href = '/';
          }
        } else {
          console.warn('⚠️ Network error during refresh, keeping user logged in');
        }

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (isNetworkError(error)) {
      console.error('🌐 Network error:', error.message);
      console.warn('⚠️ Network connectivity issue - user will remain logged in');
    } else if (error.response?.status >= 500) {
      console.error('🖥️ Server error:', error.response.status);
    }

    return Promise.reject(error);
  }
);

// Utility function to clear auth data
Api.clearAuth = () => {
  console.log('🧹 Clearing API auth data');
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("tokenExpiry");
  delete Api.defaults.headers.common["Authorization"];
};

// Utility function to set auth header
Api.setAuthHeader = (token) => {
  if (token) {
    Api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("authToken", token);
    console.log('🔧 API auth header set');
    return true;
  }
  return false;
};

// Utility function to check if we have auth
Api.hasAuth = () => {
  const token = localStorage.getItem("authToken");
  const hasHeader = !!Api.defaults.headers.common["Authorization"];
  return !!(token && hasHeader);
};

// FIXED: Enhanced setAuth function
Api.setAuth = (authData) => {
  console.log('🔐 Setting auth data:', {
    hasAccessToken: !!authData?.accessToken,
    hasRefreshToken: !!authData?.refreshToken,
    hasUser: !!authData?.user
  });

  const { accessToken, refreshToken, user, tokenExpiry } = authData || {};

  try {
    if (accessToken) {
      localStorage.setItem("authToken", accessToken);
      Api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    if (user) {
      localStorage.setItem("userData", JSON.stringify(user));
    }

    if (tokenExpiry) {
      localStorage.setItem("tokenExpiry", tokenExpiry);
    } else if (accessToken) {
      // Auto-calculate expiry if not provided
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);
      localStorage.setItem("tokenExpiry", expiry.toISOString());
    }

    console.log('✅ Auth data set successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to set auth data:', error);
    return false;
  }
};

// Utility function to check network connectivity
Api.checkConnectivity = async () => {
  try {
    const response = await axios.get('/health', {
      baseURL: import.meta.env.VITE_APP_API_URL || "http://127.0.0.1:3000/api",
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.warn('🌐 Connectivity check failed:', error.message);
    return false;
  }
};

export default Api;
