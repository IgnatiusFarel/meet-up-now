import "dayjs/locale/en";
import dayjs from "dayjs";
import { App } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import useAuthStore from "@/stores/AuthStore";
import MeetUpNow from "@/assets/MeetUpNow.png";
import useMeetingStore from "@/stores/MeetingStore";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Carousel, Avatar, Modal } from "antd";

const Dashboard = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [meetCode, setMeetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [checkingMeeting, setCheckingMeeting] = useState(false);


  // Authentication Feature
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser);

  // Meeting Feature
  const checkCanJoin = useMeetingStore((state) => state.checkCanJoin);
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
      userKeys: user ? Object.keys(user) : null,
    });

    if (!user) {
      console.log("User kosong di store, memanggil /auth/me...");
      getCurrentUser().catch((error) => {
        console.error("Error getting current user:", error);
      });
    }
  }, [user, getCurrentUser]);
  
  const handleLogout = async () => {
    try {      
      await logout();

      message.success('You’ve been logged out. See you next time!')
      navigate("/", { replace: true });      
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      navigate("/", { replace: true });
    }
  };

  const handleMeetCodeInput = (e) => {
    setMeetCode(e.target.value);
  };

  const handleJoinMeeting = async () => {
    // Basic validation
    if (!meetCode.trim()) {
      message.error("Please enter a room code");
      return;
    }

    if (meetCode.length !== 6) {
      message.error("Please enter a valid 6-character room code");
      return;
    }

    setCheckingMeeting(true);
    
    try {
      console.log("Checking if can join meeting:", meetCode);

      // Use the store method which handles all the different scenarios
      const joinCheck = await checkCanJoin(meetCode.toUpperCase());

      // Handle different scenarios based on the result
      if (!joinCheck.canJoin) {
        // The store already sets appropriate error states
        // We just need to show user-friendly messages
        switch (joinCheck.reason) {
          case 'Meeting not found':
          case 'Meeting not found!':
            message.error("Meeting not found! Please check the room code and try again.");
            break;
            
          case 'Meeting has ended':
          case 'Meeting has ended!':
            message.error("This meeting has already ended.");
            break;
            
          case 'Meeting expired':
            const expiredReason = joinCheck.meeting?.expiredReason;
            if (expiredReason === "Meeting too old (24h+)") {
              message.error("This meeting has expired (older than 24 hours).");
            } else {
              message.error("This meeting has expired due to inactivity.");
            }
            break;
            
          case 'Invalid meeting code format':
          case 'Invalid meeting code':
            message.error("Invalid room code format! Please enter a valid 6-character code.");
            break;
            
          case 'Network error':
            message.error("Network connection error. Please check your internet and try again.");
            break;
            
          case 'Connection failed':
            message.error("Unable to connect to the meeting service. Please try again.");
            break;
            
          default:
            message.error(joinCheck.reason || "Unable to join this meeting. Please try again.");
        }
        return;
      }

      // Success case - can join the meeting
      const meeting = joinCheck.meeting;
      
      // Show appropriate success message based on meeting status
      let successMessage = "Connecting you to the meeting...";
      
      if (joinCheck.isAlreadyParticipant) {
        successMessage = "Reconnecting you to the meeting...";
      } else if (meeting.status === 'waiting') {
        successMessage = "Joining meeting (waiting for host)...";
      } else if (meeting.status === 'active_no_host') {
        successMessage = "Joining meeting (host not present)...";
      }
      
      message.success(successMessage);
      
      // Log meeting info for debugging
      console.log("Meeting info:", {
        code: meeting.meetingCode,
        title: meeting.title,
        participantCount: meeting.participantCount,
        duration: meeting.duration,
        status: meeting.status,
        isOwner: meeting.isOwner,
        isAlreadyParticipant: joinCheck.isAlreadyParticipant
      });
      
      // Navigate to preview page
      navigate(`/preview/${meeting.meetingCode}`);
      
    } catch (error) {
      console.error("Join meeting error:", error);
      
      // Handle any unexpected errors that weren't caught by the store
      if (error.response) {
        // Server responded with error status
        switch (error.response.status) {
          case 404:
            message.error("Meeting not found! Please check the room code.");
            break;
          case 410:
            message.error("This meeting has ended or expired.");
            break;
          case 400:
            message.error("Invalid meeting code format.");
            break;
          case 500:
            message.error("Server error. Please try again later.");
            break;
          default:
            message.error("Unable to join meeting. Please try again.");
        }
      } else if (error.request) {
        // Network error
        message.error("Network error. Please check your connection and try again.");
      } else {
        // Generic error
        message.error(error.message || "An unexpected error occurred. Please try again.");
      }
      
    } finally {
      setCheckingMeeting(false);
    }
  };

const handleNewMeeting = async () => {
  try {
    setLoading(true);

    // Optional: Show modal to get meeting title
    const title = await new Promise((resolve) => {
      let inputValue = `Meeting - ${dayjs().format("MMM DD, HH:mm")}`;

      modal.confirm({      
        title: "Create New Meeting",
        content: (
          <div>
            <p>Enter a title for your meeting:</p>
            <Input
              defaultValue={inputValue}
              onChange={(e) => (inputValue = e.target.value)}
              placeholder="Meeting title"
              maxLength={100}
              onPressEnter={() => Modal.destroyAll()}
            />
          </div>
        ),
        okText: "Create",
        cancelText: "Cancel",
        onOk: () => resolve(inputValue),
        onCancel: () => resolve(null),
      });
    });

    if (!title) {
      setLoading(false);
      return;
    }

    // Create meeting and wait for response
    const newMeeting = await createMeeting(title);
    
    // Debug log to check the response
    console.log("New meeting created:", newMeeting);
    console.log("Meeting code:", newMeeting?.meetingCode);
    
    // Check if meeting was created successfully
    if (newMeeting && newMeeting.meetingCode) {
      message.success("Success! Your meeting is ready to go 🎉");
      
      // Destroy modal BEFORE navigation
      Modal.destroyAll();
      
      // Add small delay to ensure modal is destroyed
      setTimeout(() => {
        navigate(`/preview/${newMeeting.meetingCode}`, { replace: true });
      }, 100);
    } else {
      throw new Error("Meeting created but no meeting code received");
    }

  } catch (error) {
    console.error("Failed to create meeting:", error);
    message.error(error.message || "Failed to create meeting");
    
    // Ensure modal is destroyed on error too
    Modal.destroyAll();
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
                  value={meetCode}
                  maxLength={6}
                  onChange={handleMeetCodeInput}
                />
                <Button
                  type="text"
                  className={`font-normal rounded-full ${
                    meetCode.length === 6
                      ? "font-semibold bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-blue-700"
                      : "hover:bg-gray-100 hover:text-gray-500"
                  }`}
                  onClick={handleJoinMeeting}
                  disabled={meetCode.length !== 6}
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
