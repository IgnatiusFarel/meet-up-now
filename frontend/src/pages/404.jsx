import FuzzyText from "@/ui/FuzzyText";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-4">
      <FuzzyText fontSize="clamp(3rem, 12vw, 12rem)">404</FuzzyText>
      <FuzzyText fontSize="clamp(1.5rem, 6vw, 4rem)">Not Found</FuzzyText>
    </div>
  );
};

export default NotFound;
