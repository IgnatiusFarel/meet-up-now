import { Button } from "antd";
import StarBorder from "../../../ui/StarBorder";
import { useRef } from "react";
import VariableProximity from "../../../ui/VariableProximity";
import ShinyText from "../../../ui/ShinyText";
import TextType from "../../../ui/TextType";
import PreviewImage from "../../../assets/preview.png";
import GradientText from "../../../ui/GradientText";

const Banner = () => {
  const containerRef = useRef(null);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap"
        rel="stylesheet"
      />

      <main className="bg-[#FDFDFD] rounded-lg h-[1080px] mx-3 flex flex-col items-center justify-center text-center px-6">
        {/* ⚡ Fast Meeting Tools */}
        <StarBorder
          color="cyan"
          speed="3s"
          backgroundClass="bg-white text-[#0065FD] border border-[#E9E9E9]"
        >
          ⚡ Fast Meeting Tools
        </StarBorder>

        {/* Headline */}
        <div
          ref={containerRef}
          className="relative w-full h-auto"
          style={{
            minHeight: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "12px",
          }}
        >
          <VariableProximity
            label="Click. Connect. Collaborate."
            className="text-[56px] text-[#171717] font-medium leading-tight"
            fromFontVariationSettings="'wght' 500, 'opsz' 56"
            toFontVariationSettings="'wght' 1000, 'opsz' 144"
            containerRef={containerRef}
            radius={150}
            falloff="exponential"
            style={{
              fontFamily: '"Roboto Flex", sans-serif',
              fontVariationSettings: "'wght' 400, 'opsz' 56",
              transition: "font-variation-settings 0.1s ease-out",
            }}
          />
        </div>

        {/* Deskripsi */}
        <div className="max-w-xl mt-2">
          <TextType
            text={[
              "Initiate meetings in an instant, effortlessly share your screens, and collaborate effectively to achieve your goals together.",
            ]}
            typingSpeed={30}
            deletingSpeed={50}
            pauseDuration={5000}
            loop={true}
            showCursor={true}
            cursorCharacter="|"
            cursorBlinkDuration={1}
            className="text-[16px] font-medium"
            textColors={["#717171"]}
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 mt-8">
          <Button type="primary">
            <ShinyText text="👉 Get Started" speed={1} />
          </Button>
          <Button
            type="default"
            href="https://youtu.be/sUTYQIDv1rk?si=bDML7EykpM1H9I03"
          >
            🚀
            <GradientText
              colors={["#c084fc", "#a855f7", "#9333ea", "#6366f1", "#60a5fa"]}
              animationSpeed={3}
            >
              {" "}
              Explore Meet Up Now{" "}
            </GradientText>
          </Button>
        </div>

        {/* Gambar Preview */}
        <div className="mt-8">
          <img
            src={PreviewImage}
            alt="Preview"
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>
      </main>
    </>
  );
};

export default Banner;
