import StarBorder from "../../../ui/StarBorder";
import { Button } from "antd";
import TextType from "../../../ui/TextType";
import SpotlightCard from "../../../ui/SpotlightCard";
import SplitText from "../../../ui/SplitText";
import GradientText from "../../../ui/GradientText";

const Features = () => {
  return (
    <main className="bg-[#2B2B2B] rounded-[10px] h-[860px] mx-3 my-6 px-10 flex">
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
        <SpotlightCard className="w-full max-w-[615px] h-[330px] -mt-[80px] ml-auto">
          Hai
        </SpotlightCard>

        {/* Card 2: normal */}
        <SpotlightCard className="w-full max-w-[615px] h-[330px] ml-auto">
          Hai
        </SpotlightCard>

        {/* Card 3: masuk ke bawah 80px */}
        <SpotlightCard className="w-full max-w-[615px] h-[330px] mb-[-80px] ml-auto">
          Hai
        </SpotlightCard>
      </div>
    </main>
  );
};

export default Features;
