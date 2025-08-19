import { Link } from "react-router-dom";
import { Button } from "antd";
import ShinyText from "../../../ui/ShinyText";
import GooeyNav from "../../../ui/GooeyNav";

const items = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Client", href: "#client" },
];

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 px-10 h-[90px] flex items-center backdrop-blur">
      <div className="container mx-auto flex items-center justify-between">
        
        {/* Left Section (Logo) */}
        <Link to="/" className="text-2xl font-bold">
          <span className="text-black-600">Meet Up Now</span>          
        </Link>

        {/* Center Section (GooeyNav) */}
        <div className="hidden md:flex">
          <GooeyNav
            items={items}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            initialActiveIndex={0}
            animationTime={800}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
        </div>

        {/* Right Section (Buttons) */}
        <div className="flex space-x-3">
          <Button type="primary" className="rounded-full">
            ✨ Try Now
          </Button>    
        </div>
      </div>
    </header>
  );
};

export default Navbar;
