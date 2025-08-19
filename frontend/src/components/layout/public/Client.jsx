import Squares from "../../../ui/Squares";
import LogoLoop from "../../../ui/LogoLoop";

const imageLogos = [
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png", 
    alt: "Apple", 
    href: "https://apple.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/07/Google-Logo.png", 
    alt: "Google", 
    href: "https://google.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/04/Microsoft-Logo.png", 
    alt: "Microsoft", 
    href: "https://microsoft.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png", 
    alt: "Amazon", 
    href: "https://amazon.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/07/Tesla-Logo.png", 
    alt: "Tesla", 
    href: "https://tesla.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/11/Netflix-Logo.png", 
    alt: "Netflix", 
    href: "https://netflix.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/06/Meta-Logo.png", 
    alt: "Meta", 
    href: "https://meta.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2021/08/Spotify-Logo.png", 
    alt: "Spotify", 
    href: "https://spotify.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/06/Twitter-Logo.png", 
    alt: "Twitter", 
    href: "https://twitter.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/11/GitHub-Logo.png", 
    alt: "GitHub", 
    href: "https://github.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/09/Adobe-Logo.png", 
    alt: "Adobe", 
    href: "https://adobe.com" 
  },
  { 
    src: "https://logos-world.net/wp-content/uploads/2020/04/IBM-Logo.png", 
    alt: "IBM", 
    href: "https://ibm.com" 
  }
];

const Client = () => {
  return (
    <section className="relative w-full h-[280px] flex items-center justify-center bg-black text-white overflow-hidden -mt-[150px]">
      {/* LogoLoop Container - Perfectly centered */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center h-full">
          {/* Logo Loop pertama - arah kiri */}
          <div className="h-[70px] w-full relative overflow-hidden mb-4">
            <LogoLoop
              logos={imageLogos.slice(0, 6)} // 6 logo pertama
              speed={80}
              direction="left"
              logoHeight={40}
              gap={60}
              pauseOnHover={true}
              scaleOnHover={true}
              fadeOut={true}
              fadeOutColor="#000000"
              ariaLabel="Technology partners - Row 1"
            />
          </div>
          
          {/* Logo Loop kedua - arah kanan */}
          <div className="h-[70px] w-full relative overflow-hidden">
            <LogoLoop
              logos={imageLogos.slice(6)} // 6 logo sisanya
              speed={80}
              direction="right"
              logoHeight={40}
              gap={60}
              pauseOnHover={true}
              scaleOnHover={true}
              fadeOut={true}
              fadeOutColor="#000000"
              ariaLabel="Technology partners - Row 2"
            />
          </div>
        </div>
      </div>

      {/* Squares dengan blend mode untuk efek menarik */}
      <Squares
        speed={0.5}
        squareSize={35}
        direction="diagonal"
        borderColor="#ffffff33"
        hoverFillColor="#333"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          mixBlendMode: 'overlay',
          opacity: 0.6
        }}
      />

      {/* Optional: Overlay gradasi untuk efek depth */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
        }}
      />
    </section>
  );
};

export default Client;