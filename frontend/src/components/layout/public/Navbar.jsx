import Login from "./Login";
import { Button } from "antd";
import { useState } from "react";
import GooeyNav from "@/ui/GooeyNav";
import { Link } from "react-router-dom";
import MeetUpNow from "@/assets/MeetUpNow.png";
import useActiveSection from "@/hooks/useActiveSection";

const Navbar = () => {
  const sectionIds = ["home", "client", "testimonials", "features", "faq"];
  const { activeSectionIndex } = useActiveSection(sectionIds);
  const [openModalLogin, setOpenModalLogin] = useState(false);

  const items = [
    { label: "Home", href: "#home" },
    { label: "Client", href: "#client" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 90;
      const elementPosition = element.offsetTop - navbarHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  const handleNavClick = (index) => {
    const sectionId = sectionIds[index];
    scrollToSection(sectionId);
  };

  const handleLogin = () => {
    setOpenModalLogin(true);
  };

  const handleClose = () => {
    setOpenModalLogin(false);
  };

  return (
    <header className="sticky top-0 z-50 px-10 h-[90px] flex items-center backdrop-blur">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left Section (Logo) */}
        <Link to="/" className="text-2xl font-bold">
          <img src={MeetUpNow} alt="Meet Up Now Logo"   className="w-16 sm:w-20 md:w-24 lg:w-28" />
        </Link>

        {/* Center Section (GooeyNav) */}
        <nav className="hidden lg:flex">
          <GooeyNav
            items={items}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            initialActiveIndex={activeSectionIndex}
            animationTime={800}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
            onItemClick={handleNavClick}
          />
        </nav>

        {/* Right Section (Buttons) */}
        <div className="flex space-x-3">
          <Button type="primary" className="rounded-full" onClick={handleLogin}>
            ✨ Try Now
          </Button>
        </div>

        <Login open={openModalLogin} onClose={handleClose} />
      </div>
    </header>
  );
};

export default Navbar;
