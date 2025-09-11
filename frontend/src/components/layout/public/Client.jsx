import Squares from "@/ui/Squares";
import LogoLoop from "@/ui/LogoLoop";

const imageLogos = [
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Tencent_Logo.svg/500px-Tencent_Logo.svg.png",
    alt: "Tencent Logo",
    href: "https://tencent.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/300px-Google_2015_logo.svg.png",
    alt: "Google Logo",
    href: "https://google.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/500px-Microsoft_logo_%282012%29.svg.png",
    alt: "Microsoft Logo",
    href: "https://microsoft.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Visa_2021.svg/330px-Visa_2021.svg.png",
    alt: "VisaLogo",
    href: "https://visa.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tesla_T_symbol.svg/250px-Tesla_T_symbol.svg.png",
    alt: "Tesla Logo",
    href: "https://tesla.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/500px-Netflix_2015_logo.svg.png",
    alt: "Netflix Logo",
    href: "https://netflix.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/500px-Meta_Platforms_Inc._logo.svg.png",
    alt: "Meta Logo",
    href: "https://meta.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/2024_Spotify_Logo.svg/330px-2024_Spotify_Logo.svg.png",
    alt: "Spotify Logo",
    href: "https://spotify.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/330px-Mastercard_2019_logo.svg.png",
    alt: "MasterCard Logo",
    href: "https://mastercard.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Walmart_logo_%282025%3B_Alt%29.svg/500px-Walmart_logo_%282025%3B_Alt%29.svg.png",
    alt: "Walmart Logo",
    href: "https://walmart.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Adobe_Corporate_wordmark.svg/375px-Adobe_Corporate_wordmark.svg.png",
    alt: "Adobe Logo",
    href: "https://adobe.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Blibli_%282023%29.svg/500px-Blibli_%282023%29.svg.png",
    alt: "Blibli Logo",
    href: "https://blibli.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/GoTo_logo.svg/330px-GoTo_logo.svg.png",
    alt: "GoTo Logo",
    href: "https://gotocompany.com",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Tiket.com_%282017%29.svg/500px-Tiket.com_%282017%29.svg.png",
    alt: "Ticket.Com Logo",
    href: "https://tiket.com",
  },
];

const Client = () => {
  return (
    <section className="relative w-full h-[280px] flex items-center justify-center bg-black text-white overflow-hidden -mt-[150px]">
      <header className="absolute top-1/2 left-1/2 z-30 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className="text-[28px] sm:text-[44px] font-medium">
          Our Trusted Clients
        </h2>
      </header>
      {/* LogoLoop Container - Perfectly centered */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center h-full space-y-16 md:space-y-16 sm:space-y-24">
          {/* Logo Loop pertama - arah kiri */}
          <div className="h-[70px] w-full relative overflow-hidden">
            <LogoLoop
              logos={imageLogos.slice(0, 7)} // 6 logo pertama
              speed={80}
              direction="left"
              logoHeight={40}
              gap={60}
              pauseOnHover={true}
              scaleOnHover={true}
              fadeOut={true}
              fadeOutColor="#171717"
              ariaLabel="Technology partners - Row 1"
            />
          </div>

          {/* Logo Loop kedua - arah kanan */}
          <div className="h-[70px] w-full relative overflow-hidden">
            <LogoLoop
              logos={imageLogos.slice(7)} // 6 logo sisanya
              speed={80}
              direction="right"
              logoHeight={40}
              gap={60}
              pauseOnHover={true}
              scaleOnHover={true}
              fadeOut={true}
              fadeOutColor="#171717"
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
          mixBlendMode: "overlay",
          opacity: 0.6,
        }}
      />

      {/* Optional: Overlay gradasi untuk efek depth */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </section>
  );
};

export default Client;
