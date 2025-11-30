import { Button } from "antd";
import { useEffect, useState } from "react";
import ElectricBorder from "@/ui/ElectricBorder.jsx";
import Navbar from "@/components/layout/public/Navbar.jsx";
import Banner from "@/components/layout/public/Banner.jsx";
import Client from "@/components/layout/public/Client.jsx";
import FAQ from "@/components/layout/public/FAQ.jsx";
import Testimonials from "@/components/layout/public/Testimonials.jsx";
import Features from "@/components/layout/public/Features.jsx";
import Footer from "@/components/layout/public/Footer.jsx";

const LandingPage = () => {
  const [showButtonUp, setShowButtonUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButtonUp(true);
      } else {
        setShowButtonUp(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <title>Meet Up Now</title>
      <meta
        name="description"
        content="Meet Up Now is the easiest way to connect, join, and manage your online meetings. Stay productive and collaborate seamlessly."
      />
      <link rel="icon" href="/MeetUpNow.png" />

      <meta
        property="og:title"
        content="Meet Up Now | Connect and Join Meetings Effortlessly"
      />
      <meta
        property="og:description"
        content="Meet Up Now is the easiest way to connect, join, and manage your online meetings. Stay productive and collaborate seamlessly."
      />
      <meta property="og:image" content="/MeetUpNow.png" />
      <meta property="og:type" content="website" />

      <Navbar />
      <main>
        <section id="home">
          <Banner />
        </section>

        <section id="client">
          <Client />
        </section>

        <section id="testimonials">
          <Testimonials />
        </section>

        <section id="features">
          <Features />
        </section>

        <section id="faq">
          <FAQ />
        </section>

        <Footer />
      </main>
      {showButtonUp && (
        <div className="fixed bottom-6 right-6 z-50">
          <ElectricBorder
            color="#7df9ff"
            speed={3}
            chaos={0.5}
            thickness={3}
            style={{ borderRadius: 9999 }}
          >
            <Button
              onClick={scrollToTop}
              type="primary"
              className="rounded-full shadow-lg hover:bg-[#0065FD] transition-all duration-300 w-12 h-12 flex items-center justify-center"
            >
              🏹
            </Button>
          </ElectricBorder>
        </div>
      )}
    </>
  );
};

export default LandingPage;
