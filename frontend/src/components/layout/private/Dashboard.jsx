import "dayjs/locale/en";
import dayjs from "dayjs";
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import useAuthStore from "@/stores/AuthStore";
import useMeetingStore from "@/stores/MeetingStore";
import MeetUpNow from "@/assets/MeetUpNow.png";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Carousel, Avatar, message } from "antd";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const user = useAuthStore((state) => state.user); 
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser);
  const createMeeting = useMeetingStore((state) => state.createMeeting); 
  
  useEffect(() => {
    // Detect to set locale to computer user (hour and date user local time)
    dayjs.locale("en");

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

  useEffect(() => {
    // Debug user data structure
    console.log("Dashboard user data:", {
      hasUser: !!user,
      user: user,
      email: user?.email,
      avatarUrl: user?.avatarUrl,
      userKeys: user ? Object.keys(user) : null
    });

    if (!user) {
      console.log("User kosong di store, memanggil /auth/me...");
      getCurrentUser().catch((error) => {
        console.error("Error getting current user:", error);
      });
    }
  }, [user, getCurrentUser]);

  // Enhanced logout handler
  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");
      await logout();
      
      // Redirect to home page after logout
      navigate("/", { replace: true });
      console.log("Logout successful, redirected to home");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout API fails, still redirect
      navigate("/", { replace: true });
    }
  };

 const handleNewMeeting = async () => {
  try {
    setLoading(true);

    // contoh meeting title default, bisa diganti pakai modal input
    const title = "New Meeting " + dayjs().format("YYYY-MM-DD HH:mm");

    // panggil createMeeting dari store
    const newMeeting = await createMeeting(title);

    message.success("Meeting berhasil dibuat 🎉");

    // setelah create, arahkan user ke halaman meeting room
    navigate(`/preview/${newMeeting.meetingCode}`);
  } catch (error) {
    message.error(error.message || "Gagal membuat meeting");
    console.error("Failed to create meeting:", error);
  } finally {
    setLoading(false);
  }
};

  
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
      <header className="flex items-center justify-between px-6">
        <Link to="/" className="text-2xl font-bold">
          <img
            src={MeetUpNow}
            alt="Meet Up Now Logo"
            className="w-16 sm:w-20 md:w-24 lg:w-28"
          />
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium" style={{ color: "#717171" }}>
            {currentTime}
          </span>         
          
          {/* User Section */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col text-right">
              <p className="text-sm font-medium text-gray-800">
                {user?.email || "Loading..."}
              </p>
              <p className="text-xs text-gray-500">
                {user?.name || "User"}
              </p>
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <div className="py-2">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    onClick={() => console.log("Profile clicked")}
                  >
                    <UserOutlined className="mr-2" />
                    Profile
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    <span className="mr-2">🚪</span>
                    {isLoading ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              <Button 
                type="primary" 
                size="large"
                className="flex items-center gap-2"
                onClick={handleNewMeeting}
              >
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
                  className="font-medium hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => console.log("Join clicked")}
                >
                  Join
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 my-8"></div>

            <div className="flex items-center gap-2">
              <a 
                href="#" 
                className="text-blue-500 hover:text-blue-600 underline text-sm transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Learn More clicked");
                }}
              >
                Learn More
              </a>
              <span className="text-gray-500 text-sm">about Meet Up Now</span>
            </div>
          </div>
        </div>

        {/* Right Section - Carousel */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-lg relative">
            <Carousel arrows infinite={false} autoplay autoplaySpeed={4000}>
              {carouselItems.map((item) => (
                <div key={item.id}>
                  <div style={contentStyle}>
                    {/* Main Circle with Gradient */}
                    <div className="relative">
                      <div className="w-80 h-80 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 to-blue-500 p-1 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div
                            className={`w-32 h-32 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transition-transform hover:scale-110`}
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