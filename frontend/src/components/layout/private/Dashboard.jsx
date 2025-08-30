import { Button, Input, Carousel, Avatar } from "antd";
import {
  VideoCameraOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useEffect, useState } from "react"; 
import MeetUpNow from "@/assets/MeetUpNow.png";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Set locale to Indonesian
    dayjs.locale("id");

    const updateTime = () => {
      const now = dayjs();
      const formattedTime = now.format("HH.mm • ddd, DD MMM");
      setCurrentTime(formattedTime);
    };

    // Update time immediately
    updateTime();

    // Update time every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const contentStyle = {
    height: "400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  const carouselItems = [
    {
      id: 1,
      title: "Video Calls",
      icon: <VideoCameraOutlined className="text-6xl text-blue-500" />,
      color: "from-blue-400 to-blue-600",
    },
    {
      id: 2,
      title: "Team Meetings",
      icon: <TeamOutlined className="text-6xl text-green-500" />,
      color: "from-green-400 to-green-600",
    },
    {
      id: 3,
      title: "Schedule Events",
      icon: <CalendarOutlined className="text-6xl text-yellow-500" />,
      color: "from-yellow-400 to-yellow-600",
    },
    {
      id: 4,
      title: "Collaborate",
      icon: <UserOutlined className="text-6xl text-red-500" />,
      color: "from-red-400 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 border border-b-200">        
          <Link to="/" className="text-2xl font-bold">
            <img src={MeetUpNow} alt="Meet Up Now Logo" className="w-16 sm:w-20 md:w-24 lg:w-28" />
          </Link>

        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium" style={{ color: "#717171" }}>
            {currentTime}
          </span>
          <Button
            type="text"
            icon="Ⓘ"
            className="text-gray-600"
            shape="circle"
          />
          <Button
            type="text"
            icon="⚙️"
            className="text-gray-600"
            shape="circle"
          />
          <div className="flex flex-col">
            <p>emailuser@gmail.com</p>
            <Button type="text" size="small" danger>
              Logout
            </Button>
          </div>
          <Avatar
            className="bg-blue-600 cursor-pointer"
            icon={<UserOutlined />}
            size={42}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-[calc(100vh-80px)]">
        {/* Left Section */}
        <div className="flex-1 flex items-center px-16">
          <div className="max-w-xl">
            <h1 className="text-5xl font-normal text-gray-800 leading-tight mb-6">
              Meetings and video calls for everyone
            </h1>
            <p className="text-lg text-gray-600 mb-12 leading-relaxed">
              Connect, collaborate, and celebrate from anywhere with Meet Up Now
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mb-8">
              <Button type="primary" size="large">
                🎥 New Meeting
              </Button>

              <div className="flex items-center space-x-2">
                <Input
                  placeholder="🔐 Enter the room code"
                  className="w-64 h-12"
                  size="large"
                />
                <Button
                  type="text"
                  size="large"
                  shape="round"
                  className="font-medium"
                >
                  Join
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-500 my-8"></div>

            <div className="flex gap-1">
              <a href="#" className="text-blue-500 underline text-sm">
                Learn More
              </a>
              <p className="text-gray-500 text-sm">Meet Up Now</p>
            </div>
          </div>
        </div>

        {/* Right Section - Carousel */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-lg relative">
            <Carousel arrows infinite={false}>
              {carouselItems.map((item) => (
                <div key={item.id}>
                  <div style={contentStyle}>
                    {/* Main Circle with Gradient */}
                    <div className="relative">
                      <div className="w-80 h-80 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 to-blue-500 p-1 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div
                            className={`w-32 h-32 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                          >
                            {item.icon}
                          </div>
                        </div>
                      </div>

                      {/* Floating Elements */}
                      <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-red-50 border-4 border-red-200 flex items-center justify-center animate-bounce">
                        <VideoCameraOutlined className="text-red-500 text-lg" />
                      </div>

                      <div className="absolute -top-6 right-6 w-14 h-14 rounded-full bg-yellow-50 border-4 border-yellow-200 flex items-center justify-center animate-pulse">
                        <TeamOutlined className="text-yellow-600" />
                      </div>

                      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center animate-bounce">
                        <CalendarOutlined className="text-green-600 text-xl" />
                      </div>

                      <div className="absolute bottom-6 -left-6 w-12 h-12 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
