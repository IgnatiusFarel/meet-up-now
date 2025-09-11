import { useEffect } from "react";
import Navbar from "../components/layout/public/Navbar";
import Banner from "../components/layout/public/Banner";
import Client from "../components/layout/public/Client";
import Testimonials from "../components/layout/public/Testimonials";
import Features from "../components/layout/public/Features";
import FAQ from "../components/layout/public/FAQ";
import Footer from "../components/layout/public/Footer";

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
    </>
  );
};

export default LandingPage;