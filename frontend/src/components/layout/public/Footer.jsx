const Footer = () => {
  return (
    <footer className="bg-[#2B2B2B] px-[40px] py-[60px] text-white">
      <div className="flex justify-between items-start">
        <h1 className="text-[48px] font-medium max-w-[500px]">
          Manage Your Meeting With Meet Up Now
        </h1>

        <ul className="space-y-3 text-lg">
          <p>Menu</p>
          <li>
            <a href="#home" className="cursor-pointer hover:text-gray-300">
              Home
            </a>
          </li>
          <li>
            <a href="#client" className="cursor-pointer hover:text-gray-300">
              Client
            </a>
          </li>
          <li>
            <a href="#features" className="cursor-pointer hover:text-gray-300">
              Features
            </a>
          </li>
          <li>
            <a
              href="#testimonials"
              className="cursor-pointer hover:text-gray-300"
            >
              Testimonial
            </a>
          </li>
          <li>
            <a href="#faq" className="cursor-pointer hover:text-gray-300">
              FAQ
            </a>
          </li>
        </ul>
      </div>

      <div className="my-[60px] border-t border-gray-500" />

      <div className="text-center">
        <h2 className="text-[250px] font-medium leading-none text-[#525252]">
          Meet Up Now
        </h2>
      </div>
    </footer>
  );
};

export default Footer;
