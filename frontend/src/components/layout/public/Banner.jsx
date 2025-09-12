import Login from "./auth/Login";
import { Button, Modal } from "antd";
import TextType from "@/ui/TextType";
import ShinyText from "@/ui/ShinyText";
import { useRef, useState } from "react";
import StarBorder from "@/ui/StarBorder";
import GradientText from "@/ui/GradientText";
import PreviewImage from "@/assets/preview.png";
import VariableProximity from "@/ui/VariableProximity";

const Banner = () => {
  const containerRef = useRef(null);
  const [openModalTutorial, setOpenModalTutorial] = useState(false);
  const [openModalLogin, setOpenModalLogin] = useState(false);

  const showModal = () => {
    setOpenModalLogin(true);
    setOpenModalTutorial(true);
  };

  const handleClose = () => {
    setOpenModalLogin(false);
    setOpenModalTutorial(false);
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap"
        rel="stylesheet"
      />

      <main className="bg-[#FDFDFD] rounded-lg min-h-screen mx-3 flex flex-col items-center justify-start text-center px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 lg:pt-24">
        <StarBorder
          color="cyan"
          speed="3s"
          backgroundClass="bg-white text-[#0065FD] border border-[#E9E9E9]"
        >
          ⚡ Fast Meeting Tools
        </StarBorder>

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
            className="text-[36px] sm:text-[56px] text-[#171717] font-medium leading-tight"
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

        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto max-w-xs sm:max-w-none">
          <Button type="primary" className="transition-all duration-300 hover:scale-105 active:scale-95 active:shadow-inner" title="Click to login your google account." onClick={showModal}>
            <ShinyText text="👉 Get Started" speed={1} />
          </Button>
          <Button
            type="default"           
            className="w-full sm:w-auto transition-all duration-300 hover:scale-105 active:scale-95 active:shadow-inne"
            title="Click to watch a tutorial on how to get started with Meet Up Now."
            onClick={showModal}
          >
            🚀
            <GradientText
              colors={["#c084fc", "#a855f7", "#9333ea", "#6366f1", "#60a5fa"]}
              animationSpeed={3}
            >
              Explore Meet Up Now
            </GradientText>
          </Button>
        </div>

        <div className="mt-8">
          <img
            src={PreviewImage}
            alt="Preview Image"
            className="max-w-full h-auto rounded-lg shadow-md"
          />
        </div>

        <Modal
          title="How To Use Meet Up Now"
          visible={openModalTutorial}
          onCancel={handleClose}
          width={800}
          centered
          footer={null}
        >
          <div className="flex justify-center">
            <iframe
              width="100%"
              height="450px"
              src="https://www.youtube.com/embed/sUTYQIDv1rk"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video tutorial"
            />
          </div>
        </Modal>

         <Login open={openModalLogin} onClose={handleClose} />
      </main>
    </>
  );
};

export default Banner;
