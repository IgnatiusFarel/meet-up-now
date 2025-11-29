import { Button } from "antd";
import TextType from "@/ui/TextType.jsx";
import SplitText from "@/ui/SplitText.jsx";
import StarBorder from "@/ui/StarBorder.jsx";
import ChatImage from "@/assets/Chat.png";
import GradientText from "@/ui/GradientText.jsx";
import SpotlightCard from "@/ui/SpotlightCard.jsx";
import ArtboardImage from "@/assets/artboard.png";
import ReminderImage from "@/assets/reminder.png";

const Features = () => {
  return (
    <main className="bg-[#2B2B2B] rounded-lg h-auto sm:h-[860px] mx-3 my-6 px-10 flex flex-col sm:flex-row">      
      <div className="w-full sm:w-1/2 flex flex-col h-full">        
        <div className="pt-[40px] sm:pt-[60px] flex flex-col items-center sm:items-start">
          <StarBorder
            color="magenta"
            speed="3s"
            backgroundClass="bg-[#171717] text-white border border-[#525252]"
          >
            ✨ Features ✨
          </StarBorder>
          <div className="text-center sm:text-left">
            <SplitText
              text="All The Features You Need"
              className="text-[#FDFDFD] font-medium text-[28px] sm:text-[32px] sm:text-[38px] md:text-[44px] lg:text-[44px] mt-4"
              delay={50}
              duration={0.5}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
            />
          </div>
        </div>
        
        <div className="mt-auto pb-[60px] flex flex-col items-center sm:items-start">
          <div className="max-w-xl mb-6 text-center sm:text-left">
            <TextType
              text={[
                "Packed with essential features — from instant meeting launch, smart screen sharing, to collaborative tools that keep your team in sync.",
              ]}
              typingSpeed={30}
              deletingSpeed={50}
              pauseDuration={5000}
              loop={true}
              showCursor={true}
              cursorCharacter="|"
              cursorBlinkDuration={1}
              className="text-[16px] font-medium"
              textColors={["#E9E9E9"]}
            />
          </div>
          <Button type="default"   className="transition-all duration-300 hover:scale-105 active:scale-95 active:shadow-inner"
                title="Click to see the features of Meet Up Now."
                href="https://play.google.com/store/apps/details?id=com.google.android.apps.tachyon"
                target="_blank"
                rel="noopener noreferrer">
            🔎
            <GradientText
              colors={["#3b3b3b", "#2b2b2b", "#a1866f", "#000000"]}
              animationSpeed={2}
            >
              See More
            </GradientText>
          </Button>
        </div>
      </div>
      
      <div className="w-full sm:w-1/2 relative overflow-hidden flex flex-col items-center sm:items-end gap-y-2 pb-10 sm:pb-0">
        <SpotlightCard className="w-full max-w-[615px] h-[330px] md:h-[330px] sm:-mt-[80px] sm:ml-auto overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">            
            <div className="absolute top-0 left-0 right-0 h-1/2 md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-1/2 md:h-full">
              <img
                src={ArtboardImage}
                alt="Artboard"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
            
            <div className="flex-1 flex flex-col justify-end z-10 relative md:px-0 md:pb-0">
              <h2 className="text-[18px] font-semibold text-[#FDFDFD]">
                Artboard
              </h2>
              <p className="text-base text-[#E9E9E9] max-w-[250px] md:max-w-[250px]">
                Draw ideas together using real-time collaborative whiteboard.
              </p>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="w-full max-w-[615px] h-[330px] sm:ml-auto overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex-1 flex flex-col justify-end z-10 relative">
              <h2 className="text-[18px] font-semibold text-[#FDFDFD]">Chat</h2>
              <p className="text-base text-[#E9E9E9] max-w-[250px]">
                Send messages, share files, and chat in meetings.
              </p>
            </div>
            
            <div className="absolute top-0 left-0 right-0 h-1/2 md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-1/2 md:h-full">
              <img
                src={ChatImage}
                alt="Chat"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="w-full max-w-[615px] h-[330px] sm:mb-[-80px] sm:ml-auto overflow-hidden">
          <div className="flex h-full">
            <div className="flex-1 flex flex-col justify-end z-15 relative">
              <h2 className="text-[18px] font-semibold text-[#FDFDFD]">
                Reminder
              </h2>
              <p className="text-base text-[#E9E9E9] max-w-[250px] mb-10">
                Set up a new meeting and get your meeting link.
              </p>
            </div>
                        
            <div className="absolute top-0 left-0 right-0 h-1/2 md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-1/2 md:h-full">
              <img
                src={ReminderImage}
                alt="Reminder"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </SpotlightCard>
      </div>
    </main>
  );
};

export default Features;
