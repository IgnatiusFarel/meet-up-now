import { Button, Modal } from "antd";

const Login = ({ open, onClose }) => {
  return (
    <Modal 
      centered 
      open={open} 
      onCancel={onClose} 
      footer={null} 
      width={400}
    >
      <h1 className="text-2xl font-bold text-black-600">Meet Up Now</h1>

      <h2 className="text-[28px] font-medium mb-4">
        Log to your account
      </h2>

      <Button 
        type="default" 
        htmlType="submit" 
        block 
        className="text-[#171717] font-medium"
      >
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png" 
          alt="Google logo" 
          className="w-6 mr-2" 
        />
        Continue with Google
      </Button>

      <p className="text-[#717171] mt-12 text-sm">
        By proceeding, you agree to our Terms of Use and confirm you have 
        read our Privacy and Cookie Statement.
      </p>
    </Modal>
  );
};

export default Login;
