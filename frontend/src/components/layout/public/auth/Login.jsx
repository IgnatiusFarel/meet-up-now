import { useState } from "react";
import useAuthStore from "@/stores/AuthStore";
import { Button, message, Modal } from "antd";
import MeetUpNow from "@/assets/MeetUpNow.png";

const Login = ({ open, onClose }) => {
  const { startGoogleLogin, isLoading, error, clearError } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      clearError();
      await startGoogleLogin();
    } catch (error) {
      message.error(
        error.message || "Failed to start login. Please try again."
      );
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      maskClosable={false}
    >
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold text-black-600">
          <img src={MeetUpNow} alt="Meet Up Now Logo" className="w-20" />
        </h1>

        <h2 className="text-[28px] font-medium">Log to your account</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <Button
        type="default"
        htmlType="submit"
        block
        size="large"
        className="text-[#171717] font-medium h-12 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 active:shadow-inner"
        onClick={handleLogin}
        loading={loading || isLoading}
        disabled={loading || isLoading}
        title="Click to continue with your google account."
      >        
        {!loading && !isLoading && (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png"
            alt="Google logo"
            className="w-5 h-5 mr-2"
          />
        )}
        {loading || isLoading
          ? "Redirecting to Google..."
          : "Continue with Google"}
      </Button>

      <p className="text-[#717171] mt-8 text-sm">
        By proceeding, you agree to our Terms of Use and confirm you have read
        our Privacy and Cookie Statement.
      </p>
    </Modal>
  );
};

export default Login;
