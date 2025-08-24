import { useEffect } from "react";
import Banner from "./Banner";
import Client from "./Client";
import FAQ from "./FAQ";
import Features from "./Features";
import Navbar from "./Navbar";
import Testimonials from "./Testimonials";
import Footer from "./Footer";

const LandingPage = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <>
      <Navbar />
      {/* Wrap sections in main and ensure proper spacing */}
      <main>
        <section id="home" className="min-h-screen">
          <Banner />
        </section>

        <section id="client">
          <Client />
        </section>

        <section id="testimonials" className="min-h-screen">
          <Testimonials />
        </section>

        <section id="features" className="min-h-screen">
          <Features />
        </section>

        <section id="faq" className="min-h-screen">
          <FAQ />
        </section>

        <Footer />
      </main>
    </>
  );
};

export default LandingPage;