import { useEffect } from "react";
import Navbar from "./Navbar";
import Banner from "./Banner";
import Client from "./Client";
import Testimonials from "./Testimonials";
import Features from "./Features";
import FAQ from "./FAQ";
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