import { useState, useEffect } from 'react';
import { Button, Progress } from 'antd';

const Exit = () => {
  const [secondsLeft, setSecondsLeft] = useState(60); // Inisialisasi timer dengan 60 detik

  const twoColors = { 
    '0%': '#108ee9',
  '100%': '#87d068',
  }

  const progress = ((60 - secondsLeft) / 60) * 100; 

  useEffect(() => {
    if (secondsLeft === 0) return; // Menghentikan countdown ketika mencapai 0
    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1); // Mengurangi 1 detik setiap interval
    }, 1000);

    return () => clearInterval(timer); // Membersihkan interval ketika komponen unmount
  }, [secondsLeft]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative">
      {/* Text "Return to the main screen" di pojok kiri atas */}
      <p className="absolute top-4 left-4 text-md font-medium">
         <Progress type="circle"  size={50} strokeColor={twoColors}   percent={progress} format={() => `${secondsLeft}`} /> Return to the main screen 
      </p>

      <div className="text-center">
        <h1 className="text-4xl my-4">You leave the meeting</h1>
        <div className="space-x-4">
          <Button type="primary">Join Again</Button>
          <Button type="default">Return to Main Screen</Button>
        </div>
        <p></p>
      </div>
    </div>
  );
};

export default Exit;
