import StarBorder from "../../../ui/StarBorder";
import { Button } from "antd";
import TextType from "../../../ui/TextType";
import SpotlightCard from "../../../ui/SpotlightCard";
import SplitText from "../../../ui/SplitText";
import GradientText from "../../../ui/GradientText";
import ArtboardImage from "../../../assets/artboard.png";
import ChatImage from "../../../assets/chat.png";
import ReminderImage from "../../../assets/reminder.png";

const Features = () => {
  return (
    <main className="bg-[#2B2B2B] rounded-lg h-[860px] mx-3 my-6 px-10 flex">
      {/* Kiri */}
      <div className="w-1/2 flex flex-col h-full">
        {/* Bagian atas */}
        <div className="pt-[60px]">
          <StarBorder
            color="magenta"
            speed="3s"
            backgroundClass="bg-[#171717] text-white border border-[#525252]"
          >
            ✨ Features ✨
          </StarBorder>
          <SplitText
            text="All The Features You Need"
            className="text-[#FDFDFD] font-medium text-[44px] mt-4"
            delay={50}
            duration={0.5}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
          />
        </div>

        {/* Bagian bawah */}
        <div className="mt-auto pb-[60px]">
          <div className="max-w-xl mb-6">
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
          <Button type="default">
            🔎
            <GradientText
              colors={["#3b3b3b", "#2b2b2b", "#a1866f", "#000000"]}
              animationSpeed={1}
            >
              See More
            </GradientText>
          </Button>
        </div>
      </div>

      <div className="w-1/2 relative overflow-hidden flex flex-col gap-y-2">
        {/* Card 1: masuk ke atas 80px */}
        <SpotlightCard className="w-full max-w-[615px] h-[330px] -mt-[80px] ml-auto overflow-hidden">
          <div className="flex h-full">
            {/* Teks di kiri */}
            <div className="flex-1 flex flex-col justify-end  z-10 relative">
              <h2 className="text-[18px] font-semibold text-[#FDFDFD]">
                Artboard
              </h2>
              <p className="text-base text-[#E9E9E9] max-w-[250px]">
                Draw ideas together using real-time collaborative whiteboard.
              </p>
            </div>

            {/* Gambar di kanan full - tanpa gap */}
            <div className="absolute top-0 right-0 bottom-0 w-1/2">
              <img
                src={ArtboardImage}
                alt="Artboard"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </SpotlightCard>

        {/* Card 2: normal */}
        <SpotlightCard className="w-full max-w-[615px] h-[330px] ml-auto overflow-hidden">
          <div className="flex h-full">
            {/* Teks di kiri */}
            <div className="flex-1 flex flex-col justify-end z-10 relative">
              <h2 className="text-[18px] font-semibold text-[#FDFDFD]">Chat</h2>
              <p className="text-base text-[#E9E9E9] max-w-[250px]">
                Send messages, share files, and chat in meetings.
              </p>
            </div>

            {/* Gambar di kanan full - tanpa gap */}
            <div className="absolute top-0 right-0 bottom-0 w-1/2">
              <img
                src={ChatImage}
                alt="Chat"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </SpotlightCard>

        {/* Card 3: masuk ke bawah 80px */}
        <SpotlightCard className="w-full max-w-[615px] h-[330px] mb-[-80px] ml-auto overflow-hidden">
          <div className="flex h-full">
            {/* Teks di kiri */}
            <div className="flex-1 flex flex-col justify-end z-15 relative">
              <h2 className="text-[18px] font-semibold text-[#FDFDFD]">
                Reminder
              </h2>
              <p className="text-base text-[#E9E9E9] max-w-[250px] mb-10">
                Set up a new meeting and get your meeting link.
              </p>
            </div>

            {/* Gambar di kanan full - tanpa gap */}
            <div className="absolute top-0 right-0 bottom-0 w-1/2">
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
