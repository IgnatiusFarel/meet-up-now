import { Button, Modal } from "antd";
import MeetUpNow from "@/assets/MeetUpNow.png";

const Login = ({ open, onClose }) => {

  // const handleLogin = () => {
  //   try {
      
  //   } catch (error) {
      
  //   }
  // }

  return (
    <Modal 
      centered 
      open={open} 
      onCancel={onClose} 
      footer={null} 
      width={400}
    >
      <div className="flex items-center mb-4">
      <h1 className="text-2xl font-bold text-black-600">
        <img src={MeetUpNow} alt="Meet Up Now Logo" className="w-20" />
      </h1>

      <h2 className="text-[28px] font-medium">
        Log to your account
      </h2>
      </div>

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

      <p className="text-[#717171] mt-8 text-sm">
        By proceeding, you agree to our Terms of Use and confirm you have 
        read our Privacy and Cookie Statement.
      </p>
    </Modal>
  );
};

export default Login;
