import { Button } from "antd";
import FuzzyText from "@/ui/FuzzyText";
import ShinyText from "@/ui/ShinyText";
import { useNavigate } from "react-router-dom";
import ElectricBorder from "@/ui/ElectricBorder";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      <head>
        <title>404 Not Found | Meet Up Now</title>
        <meta
          name="description"
          content="The page you are looking for could not be found. Return to your Meet Up Now dashboard to continue collaborating."
        />
        <link rel="icon" href="/MeetUpNow.png" />

        <meta property="og:title" content="404 Not Found | Meet Up Now" />
        <meta
          property="og:description"
          content="The page you are looking for could not be found. Return to your Meet Up Now dashboard to continue collaborating."
        />
        <meta property="og:image" content="/MeetUpNow.png" />
        <meta property="og:type" content="website" />
      </head>

      <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-6 text-center">
        <FuzzyText fontSize="clamp(3rem, 12vw, 12rem)">404</FuzzyText>
        <FuzzyText fontSize="clamp(1.5rem, 6vw, 4rem)">Not Found</FuzzyText>
        <ElectricBorder
          color="#7df9ff"
          speed={3}
          chaos={0.5}
          thickness={3}
          style={{ borderRadius: 9999 }}
        >
          <Button
            type="primary"
            size="large"
            className="px-8 py-6 rounded-full shadow-lg hover:bg-[#0065FD] transition-all duration-300 flex items-center"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeftCircleIcon className="w-5 h-5 mr-2" />
            <ShinyText text="Back to Dashboard" speed={1} />
          </Button>
        </ElectricBorder>
      </div>
    </>
  );
};

export default NotFound;
