import { useEffect } from "react";
import { App, Avatar } from "antd";
import useAuthStore from "@/stores/AuthStore.jsx";
import MeetUpNow from "@/assets/MeetUpNow.png";
import { UserOutlined } from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  UserIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  // Authentication Feature
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const getCurrentUser = useAuthStore((s) => s.getCurrentUser);

  const handleLogout = async () => {
    try {
      await logout();
      message.success("You've been logged out. See you next time!");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      navigate("/", { replace: true });
    }
  };

  // Handle logo click - navigate to dashboard if not already there
  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (!user) {
      getCurrentUser().catch((error) => {
        console.error("Error getting current user:", error);
      });
    }
  }, [user, getCurrentUser]);

  // Check if current route is preview page
  const isPreviewPage = location.pathname.startsWith('/preview/');

  return (
    <header className="flex items-center justify-between px-6">
      {/* Logo Section - Clickable to navigate to dashboard */}
      {isPreviewPage ? (
        // For preview page - make logo clickable to go back to dashboard
        <button
          onClick={handleLogoClick}
          className="text-2xl font-bold hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 rounded-lg"
          title="Back to Dashboard"
        >
          <img
            src={MeetUpNow}
            alt="Meet Up Now Logo - Back to Dashboard"
            className="w-16 sm:w-20 md:w-24 lg:w-28"
          />
        </button>
      ) : (
        // For other pages - use Link component (default behavior)
        <Link 
          to="/dashboard" 
          className="text-2xl font-bold hover:opacity-80 transition-opacity duration-200"
        >
          <img
            src={MeetUpNow}
            alt="Meet Up Now Logo"
            className="w-16 sm:w-20 md:w-24 lg:w-28"
          />
        </Link>
      )}

      <div>
        {/* User Section */}
        <div className="flex items-center space-x-3">
          <div className="flex flex-col text-right">
            <p className="text-sm font-medium text-gray-800">
              {user?.email || "User Email"}
            </p>
            <p className="text-xs text-gray-500">{user?.name || "User Name"}</p>
          </div>

          <div className="relative group">
            <Avatar
              className="bg-blue-500 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-300"
              size={42}
              src={user?.avatarUrl}
              icon={<UserOutlined />}
              alt={user?.name || "User Avatar"}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 min-w-max bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-3 max-w-xs break-words">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <div className="border-t">
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  onClick={() => console.log("Profile clicked")}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  <ArrowRightStartOnRectangleIcon className="mr-2 h-4 w-4" />
                  {isLoading ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;