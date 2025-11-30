import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "@/stores/AuthStore.jsx";
import { App } from "antd";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing");

  const { handleOAuthCallback, isLoading, error } = useAuthStore();

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log("OAuth Callback - Processing URL params");

        // Get access token from URL params
        const accessToken = searchParams.get("accessToken");
        const error = searchParams.get("error");

        console.log("OAuth Callback params:", {
          hasAccessToken: !!accessToken,
          tokenLength: accessToken?.length,
          hasError: !!error,
        });

        if (error) {
          console.error("OAuth error:", error);
          setStatus("error");
          message.error("Authentication failed. Please try again.");

          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
          return;
        }

        if (!accessToken) {
          console.error("No access token received");
          setStatus("error");
          message.error("Authentication failed - no access token received.");

          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
          return;
        }

        setStatus("authenticating");

        // Process the OAuth callback
        const result = await handleOAuthCallback(accessToken);

        if (result.success) {
          console.log("OAuth callback successful, redirecting to dashboard");
          setStatus("success");
          message.success("Welcome, Authentication successfully!");

          // Clean up URL params
          window.history.replaceState({}, document.title, "/auth/callback");

          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1000);
        } else {
          console.error("OAuth callback failed:", result.message);
          setStatus("error");
          message.error(
            result.message || "Authentication failed. Please try again."
          );

          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error("OAuth callback processing error:", error);
        setStatus("error");
        message.error("Authentication failed. Please try again.");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate, message]);

  const getStatusDisplay = () => {
    switch (status) {
      case "processing":
        return {
          title: "Processing Authentication",
          subtitle: "Please wait while we process your login...",
          icon: "🔄",
        };
      case "authenticating":
        return {
          title: "Authenticating",
          subtitle: "Verifying your credentials...",
          icon: "🔐",
        };
      case "success":
        return {
          title: "Success!",
          subtitle: "Redirecting to your dashboard...",
          icon: "✅",
        };
      case "error":
        return {
          title: "Authentication Failed",
          subtitle: "Redirecting back to home page...",
          icon: "❌",
        };
      default:
        return {
          title: "Loading",
          subtitle: "Please wait...",
          icon: "⏳",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="mb-6">
          <div className="text-6xl mb-4">{statusDisplay.icon}</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {statusDisplay.title}
          </h1>
          <p className="text-gray-600">{statusDisplay.subtitle}</p>
        </div>

        {/* Loading spinner */}
        {(status === "processing" || status === "authenticating") && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error message */}
        {status === "error" && error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success message */}
        {status === "success" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Authentication completed successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
