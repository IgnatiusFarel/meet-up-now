import NotFoundPage from "@/pages/NotFoundPage";
import { useEffect, useState } from "react";
import LandingPage from "@/pages/LandingPage"; 
import useAuthStore from "@/stores/AuthStore";
import Exit from "@/components/layout/private/exit/Exit";
// import Preview from "@/components/layout/private/Preview";
import Meeting from "@/components/layout/private/meeting/meeting";
// import Dashboard from "@/components/layout/private/Dashboard";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import OAuthCallback from "@/components/layout/public/auth/OAuthCallback";
import DashboardPage from "../pages/DashboardPage";
import PreviewPage from "../pages/PreviewPage";

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
    if (!hasTriggeredInit && !isInitialized && !_isInitializing) {
      console.log("🚀 Triggering auth initialization");
      setHasTriggeredInit(true);
      
      initializeAuth().catch(error => {
        console.error("Auth initialization failed:", error);
      });
    }
  }, [initializeAuth, isInitialized, _isInitializing, hasTriggeredInit]);

  if (!isInitialized || _isInitializing) {
    return (
      <LoadingSpinner 
        message={_isInitializing ? "Initializing authentication..." : "Setting up your session..."}
      />
    );
  }

  return children;
};

// ============ PROTECTED ROUTE ============
const ProtectedRoute = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    isInitialized, 
    user, 
    checkAndRefreshToken,
    token
  } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    checkAndRefreshToken().catch(error => {
      console.error("Initial token refresh check failed:", error);
    });

    const intervalId = setInterval(() => {
      checkAndRefreshToken().catch(error => {
        console.error("Auto token refresh failed:", error);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, checkAndRefreshToken]);

  if (!isInitialized) {
    return <LoadingSpinner message="Initializing..." />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  const isFullyAuthenticated = isAuthenticated && user && user.email && token;

  if (!isFullyAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// ============ AUTH ROUTE ============
const AuthRoute = () => {
  const { isAuthenticated, isLoading, isInitialized, user, token } = useAuthStore();

  if (!isInitialized) {
    return <LoadingSpinner message="Initializing..." />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  const isFullyAuthenticated = isAuthenticated && user && user.email && token;

  if (isFullyAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// ============ MAIN ROUTING ============
function Index() { 
  return (
    <AuthInitializer>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthRoute />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* OAuth callback */}
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/preview/:code" element={<PreviewPage />} />
          {/* <Route path="/preview/:code" element={<PreviewPage />} /> */}
          <Route path="/meeting/:code" element={<Meeting />} />
          <Route path="/exit" element={<Exit />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthInitializer>
  );
}

export default Index;