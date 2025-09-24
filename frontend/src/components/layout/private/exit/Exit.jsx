import { Button, Progress } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VideoCameraIcon, HomeIcon } from "@heroicons/react/24/outline";

const Exit = () => {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const navigate = useNavigate();

  const twoColors = {
    "0%": "#108ee9",
    "100%": "#87d068",
  };

  const progress = ((60 - secondsLeft) / 60) * 100;

  useEffect(() => {
    if (secondsLeft === 0) {
      navigate("/dashboard"); 
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative">
      {/* Countdown circle + info */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <Progress
          type="circle"
          size={50}
          strokeColor={twoColors}
          percent={progress}
          format={() => `${secondsLeft}`}
        />
        <span className="text-md font-medium">Returning to the dashboard</span>
      </div>

      <div className="text-center">
        <h1 className="text-4xl my-4">You left the meeting</h1>

        <div className="flex space-x-4">
          
          <Button
            type="primary"
            onClick={() => navigate("/preview")}
            
          >
            <VideoCameraIcon className="w-5 h-5" />
            <span>Join Again</span>
          </Button>

          <Button
            type="default"
            onClick={() => navigate("/dashboard")}
          >
            <HomeIcon className="w-5 h-5" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Exit;
