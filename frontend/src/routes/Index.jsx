import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingPage from "../components/layout/public/LandingPage";
import Dashboard from "../components/layout/private/Dashboard";
import Preview from "../components/layout/private/Preview";
import Exit from "../components/layout/private/Exit";
import Meeting from "../components/layout/private/Meeting";
import OAuthCallback from "../components/layout/public/auth/OAuthCallback";
import useAuthStore from "@/stores/AuthStore";

// 🔐 Enhanced ProtectedRoute dengan loading state
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    isLoading
  });

  // ✅ Show loading saat processing auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// 🔐 Enhanced AuthRoute dengan loading state
const AuthRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  console.log('AuthRoute check:', { 
    isAuthenticated, 
    isLoading
  });

  // ✅ Show loading saat processing auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    console.log('Already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// 🔐 App-level auth initializer
const AppAuthInitializer = ({ children }) => {
  const { initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log("App mounted, initializing auth");
    initializeAuth();
    setIsInitialized(true);
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return children;
};

function Index() {
  useEffect(() => {
    console.log("📍 Router Index mounted");
    console.log("📍 Current path:", window.location.pathname);
    console.log("📍 Current search:", window.location.search);
  }, []);

  return (
    <AppAuthInitializer>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthRoute />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        
        {/* OAuth callback (public, tidak pakai AuthRoute biar bisa handle redirect) */}
        <Route path="/auth/callback" element={<OAuthCallback />} />
        
        {/* Private routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/meeting" element={<Meeting />} />
          <Route path="/exit" element={<Exit />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppAuthInitializer>
  );
}

export default Index;