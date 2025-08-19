import Banner from "./components/layout/public/Banner";
import Client from "./components/layout/public/Client";
import FAQ from "./components/layout/public/FAQ";
import Features from "./components/layout/public/Features";
import Navbar from "./components/layout/public/Navbar";

const App = () => {
  return (
    <>    
    <Navbar />
    <section id="home">
        <Banner />
      </section>

      {/* Section Client */}
      <section id="client">
        <Client />
      </section>

      <section id="features">
        <Features />
      </section>

      <section id="faq">
        <FAQ />
      </section>
    </>
  );
};

export default App;




