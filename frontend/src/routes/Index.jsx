import NotFound from "@/pages/404";
import { useEffect, useState } from "react";
import LandingPage from "@/pages/LandingPage"; 
import useAuthStore from "@/stores/AuthStore";
import Exit from "@/components/layout/private/Exit";
import Preview from "@/components/layout/private/Preview";
import Meeting from "@/components/layout/private/Meeting";
import Dashboard from "@/components/layout/private/Dashboard";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import OAuthCallback from "@/components/layout/public/auth/OAuthCallback";

// ============ LOADING COMPONENT ============
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
    </div>
  </div>
);

// ============ AUTH INITIALIZER ============
const AuthInitializer = ({ children }) => {
  const { initializeAuth, isInitialized, isLoading, _isInitializing } = useAuthStore();
  const [hasTriggeredInit, setHasTriggeredInit] = useState(false);

  useEffect(() => {
    // Only initialize once, and only if not already initialized or initializing
    if (!hasTriggeredInit && !isInitialized && !_isInitializing) {
      console.log("🚀 Triggering auth initialization");
      setHasTriggeredInit(true);
      
      initializeAuth().catch(error => {
        console.error("Auth initialization failed:", error);
      });
    }
  }, [initializeAuth, isInitialized, _isInitializing, hasTriggeredInit]);

  // Show loading while initializing
  if (!isInitialized || _isInitializing) {
    return (
      <LoadingSpinner 
        message={_isInitializing ? "Initializing authentication..." : "Setting up your session..."}
      />
    );
  }

  return children;
};

// ============ IMPROVED PROTECTED ROUTE ============
const ProtectedRoute = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    isInitialized, 
    user, 
    checkAndRefreshToken,
    token
  } = useAuthStore();

  // Auto-refresh token check with better timing
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately on mount
    checkAndRefreshToken().catch(error => {
      console.error("Initial token refresh check failed:", error);
    });

    // Then check every 5 minutes
    const intervalId = setInterval(() => {
      checkAndRefreshToken().catch(error => {
        console.error("Auto token refresh failed:", error);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, checkAndRefreshToken]);

  console.log("ProtectedRoute check:", {
    isAuthenticated,
    isLoading,
    isInitialized,
    hasUser: !!user,
    userEmail: user?.email,
    hasToken: !!token
  });

  // Wait for initialization to complete
  if (!isInitialized) {
    return <LoadingSpinner message="Initializing..." />;
  }

  // Show loading during auth operations
  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  // More comprehensive authentication check
  const isFullyAuthenticated = isAuthenticated && user && user.email && token;

  if (!isFullyAuthenticated) {
    console.log("User not properly authenticated, redirecting to home:", {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      hasToken: !!token
    });
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// ============ IMPROVED AUTH ROUTE ============
const AuthRoute = () => {
  const { isAuthenticated, isLoading, isInitialized, user, token } = useAuthStore();

  console.log("AuthRoute check:", {
    isAuthenticated,
    isLoading,
    isInitialized,
    hasUser: !!user,
    hasToken: !!token
  });

  // Wait for initialization
  if (!isInitialized) {
    return <LoadingSpinner message="Initializing..." />;
  }

  // Show loading during auth operations
  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Check if user is fully authenticated
  const isFullyAuthenticated = isAuthenticated && user && user.email && token;

  if (isFullyAuthenticated) {
    console.log("User already authenticated, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// ============ MAIN ROUTING COMPONENT ============
function Index() { 
  return (
    <AuthInitializer>
      <Routes>
        {/* Public routes - for unauthenticated users */}
        <Route element={<AuthRoute />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* OAuth callback - accessible to all (needs to handle auth state changes) */}
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Protected routes - require full authentication */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/preview/:code" element={<Preview />} />
          <Route path="/meeting/:code" element={<Meeting />} />
          <Route path="/exit" element={<Exit />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthInitializer>
  );
}

export default Index;