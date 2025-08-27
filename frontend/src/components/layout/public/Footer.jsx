const Footer = () => {
  const menuLinks = [
    { href: "#home", label: "Home" },
    { href: "#client", label: "Client" },
    { href: "#features", label: "Features" },
    { href: "#testimonials", label: "Testimonial" },
    { href: "#faq", label: "FAQ" },
  ];

  const supportLinks = [
    { href: "/about-us", label: "About Us" },
    { href: "/learn-more", label: "Learn More" },
    { href: "/terms-of-use", label: "Terms of Use" },
    { href: "/privacy-cookie", label: "Privacy and Cookie" },
    { href: "/send-feedback", label: "Send Feedback" },
  ];

  const LinkList = ({ title, links }) => (
    <nav aria-label={title}>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <ul className="space-y-2 text-lg">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="cursor-pointer hover:text-gray-300"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <footer className="bg-[#2B2B2B] px-10 py-16 text-[#FDFDFD]">
      {/* Top Section */}
      <div className="flex justify-between flex-wrap gap-12">
        <h1 className="text-4xl md:text-5xl font-medium max-w-lg">
          Manage Your Meeting With Meet Up Now
        </h1>
        <div className="flex gap-16">
          <LinkList title="Menu" links={menuLinks} />
          <LinkList title="Support" links={supportLinks} />
        </div>
      </div>

      {/* Divider */}
      <hr className="my-16 border-gray-500" />

      {/* Branding - Full Width Text */}
      <div className="text-center -mx-10">
        <h2 className="text-[13vw] sm:text-[14vw] md:text-[14vw] lg:text-[12vw] xl:text-[15vw] font-medium leading-none text-[#525252] px-4">
          Meet Up Now
        </h2>
      </div>
    </footer>
  );
};

export default Footer;