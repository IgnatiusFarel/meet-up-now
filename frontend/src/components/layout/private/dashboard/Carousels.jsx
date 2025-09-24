import { Carousel } from "antd";
import {
  VideoCameraIcon,
  UserGroupIcon,
  ChatBubbleOvalLeftIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const Carousels = () => {
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
      icon: <VideoCameraIcon className="h-16 w-16 text-red-500" />,
      color: "from-red-300 to-white",
    },
    {
      id: 2,
      title: "Team Meetings",
      icon: <UserGroupIcon className="h-16 w-16 text-yellow-500" />,
      color: "from-yellow-300 to-white",
    },
    {
      id: 3,
      title: "Schedule Events",
      icon: <ChatBubbleOvalLeftIcon className="h-16 w-16 text-green-500" />,
      color: "from-green-300 to-white",
    },
    {
      id: 4,
      title: "Collaborate",
      icon: <UserIcon className="h-16 w-16 text-blue-500" />,
      color: "from-blue-400 to-white",
    },
  ];

  return (
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
                    <VideoCameraIcon className="h-6 w-6 text-red-500" />
                  </div>

                  <div className="absolute -top-6 right-6 w-14 h-14 rounded-full bg-yellow-50 border-4 border-yellow-200 flex items-center justify-center animate-pulse">
                    <UserGroupIcon className="h-6 w-6 text-yellow-500" />
                  </div>

                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center animate-bounce">
                    <ChatBubbleOvalLeftIcon className="h-6 w-6 text-green-500" />
                  </div>

                  <div className="absolute bottom-6 -left-6 w-12 h-12 rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center animate-pulse">
                    <UserIcon className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default Carousels;
