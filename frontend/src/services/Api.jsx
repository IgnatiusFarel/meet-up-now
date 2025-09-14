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

// Request interceptor
Api.interceptors.request.use(
  (config) => {
    // Add auth header if available
    const token = localStorage.getItem("authToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Optional: Add request logging for debugging
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

// Response interceptor with auto-refresh logic
Api.interceptors.response.use(
  (response) => {
    // Optional: Add response logging for debugging
    if (import.meta.env.DEV) {
      console.log(`📥 API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        success: response.data?.success
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.response?.data?.message,
        isRetry: originalRequest._retry
      });
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Skip refresh for auth endpoints to prevent infinite loops
      if (originalRequest.url?.includes('/auth/')) {
        console.log('🔐 Auth endpoint failed, not attempting refresh');
        
        // Clear auth data if specific auth endpoints fail
        if (originalRequest.url?.includes('/auth/me') || 
            originalRequest.url?.includes('/auth/refresh')) {
          Api.clearAuth();
          
          // Redirect to login if needed
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
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return Api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      console.log('🔄 Starting token refresh...');
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Check if refresh token exists
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Attempt to refresh token
        const refreshResponse = await axios.post('/auth/refresh', 
          { refreshToken }, 
          {
            baseURL: import.meta.env.VITE_APP_API_URL || "http://127.0.0.1:3000/api",
            withCredentials: true,
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (refreshResponse.data?.success || refreshResponse.data?.accessToken) {
          const accessToken = refreshResponse.data.accessToken || refreshResponse.data.data?.accessToken;
          const user = refreshResponse.data.user || refreshResponse.data.data?.user;
          
          console.log('✅ Token refresh successful');
          
          // Update stored token
          localStorage.setItem("authToken", accessToken);
          if (user) {
            localStorage.setItem("userData", JSON.stringify(user));
          }
          
          // Update default headers
          Api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          
          // Process queued requests
          processQueue(null, accessToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return Api(originalRequest);
          
        } else {
          throw new Error('Invalid refresh response');
        }
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Process failed queue
        processQueue(refreshError, null);
        
        // Clear auth data and redirect
        Api.clearAuth();
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          console.log('🔄 Redirecting to login due to auth failure');
          window.location.href = '/';
        }
        
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors (network, timeout, etc.)
    if (!error.response) {
      // Network error
      console.error('🌐 Network error:', error.message);
    } else if (error.response.status >= 500) {
      // Server error
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

// Utility function to set auth data
Api.setAuth = (authData) => {
  const { accessToken, refreshToken, user } = authData;
  
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
  
  console.log('🔐 Auth data set successfully');
};

export default Api;