import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, message } from "antd";
import useAuthStore from "@/stores/AuthStore";
import Api from "@/Services/Api";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuthStore();
  const processedRef = useRef(false);

  useEffect(() => {
    // prevent double processing in Strict Mode
    if (processedRef.current) return;
    processedRef.current = true;

    const handleLogin = async () => {
      try {
        const accessToken = searchParams.get("accessToken");

        if (!accessToken) {
          message.error("No access token provided");
          navigate("/", { replace: true });
          return;
        }

        // Set header
        Api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        // Ambil profile
        const res = await Api.get("/auth/me");
        // Sesuaikan struktur respons backend kamu
        const user =
          res.data?.data?.user || // misal backend pakai data.user
          res.data?.user || // atau user langsung
          res.data; // fallback

        if (!user) {
          throw new Error("User data not found in response");
        }

        // Set state di store
        setAuthData(user, accessToken);

        message.success(`Welcome, ${user?.name}!`);

        // Navigasi setelah store selesai update
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("OAuth callback error:", err);
        message.error(
          err.response?.data?.message ||
            err.message ||
            "Authentication failed"
        );
        navigate("/", { replace: true });
      }
    };

    handleLogin();
  }, [searchParams, navigate, setAuthData]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <Spin size="large" />
        <p className="mt-4 text-gray-600 text-lg">
          Completing authentication...
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          Please wait while we log you in
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
