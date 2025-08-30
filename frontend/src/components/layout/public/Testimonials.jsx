import { Button } from "antd";
import TextType from "@/ui/TextType";
import SplitText from "@/ui/SplitText";
import StarBorder from "@/ui/StarBorder";
import GradientText from "@/ui/GradientText";
import InfiniteScroll from "@/ui/InfiniteScroll";

const testimonials = [
  {
    name: "John Doe",
    title: "Software Engineer",
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=1",
    text: "This platform really helped me land my dream job. The experience was seamless!",
  },
  {
    name: "Jane Smith",
    title: "Product Manager",
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=2",
    text: "The user interface is so intuitive, and I could easily find opportunities I was looking for.",
  },
  {
    name: "Michael Johnson",
    title: "UI/UX Designer",
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=3",
    text: "I loved how smooth the process was. Highly recommended to all job seekers!",
  },
  {
    name: "Emily Davis",
    title: "Data Scientist",
    avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=4",
    text: "It saved me a lot of time and connected me with companies that matched my skills.",
  },
];

const items = testimonials.map((t, idx) => ({
  content: (
    <div
      key={idx}
      className="bg-white rounded-2xl p-6 w-[400px] h-[230px] border border-[#E9E9E9]"
    >
      {/* Avatar + Name + Title */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={t.avatar}
          alt={t.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex flex-col text-left">
          <h3 className="text-lg font-semibold text-gray-900">{t.name}</h3>
          <p className="font-medium text-[14px] text-[#0065FD]">{t.title}</p>
        </div>
      </div>

      {/* Testimonial Text */}
      <p className="text-[#717171] text-[16px] font-normal leading-relaxed text-left">
        "{t.text}"
      </p>
    </div>
  ),
}));

const Testimonials = () => {
  return (
    <>
      <div className="bg-[#FDFDFD] pt-[60px] px-10">
        <StarBorder
          color="cyan"
          speed="3s"
          backgroundClass="bg-white text-[#0065FD] border border-[#E9E9E9]"
        >
          🗣️ Testimonials 🗣️
        </StarBorder>

        {/* Main content with justify-between layout */}
        <div className="flex justify-between items-start mt-4 gap-8">
          {/* Left side - SplitText */}
          <div className="flex-1">
            <SplitText
              text="What People Are Saying"
              className="text-[#171717] font-medium text-[44px] max-w-[360px]"
              delay={50}
              duration={0.5}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
            />
          </div>

          {/* Right side - TextType and Button */}
          <div className="flex-1 flex flex-col items-end">
            <div className="max-w-lg text-right mt-4">
              <TextType
                text={[
                  "From setup to execution, meet up now delivers — here's what people are saying after switching from other platforms they used before.",
                ]}
                typingSpeed={30}
                deletingSpeed={30}
                pauseDuration={5000}
                loop={true}
                showCursor={true}
                cursorCharacter="|"
                cursorBlinkDuration={1}
                className="text-[16px] font-medium"
                textColors={["#717171"]}
              />
            </div>
            <div className="mt-4">
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
        </div>
      </div>

      <div style={{ height: "500px", position: "relative" }}>
        <InfiniteScroll
          items={items}
          isTilted={true}
          tiltDirection="left"
          autoplay={true}
          autoplaySpeed={1}
          autoplayDirection="down"
          pauseOnHover={true}
        />
      </div>
    </>
  );
};

export default Testimonials;
