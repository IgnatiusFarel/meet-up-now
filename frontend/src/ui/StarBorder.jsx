const StarBorder = ({
  as: Component = "button",
  className = "",
  color = "white",
  speed = "6s",
  thickness = 2,
  backgroundClass = "bg-gradient-to-b from-black to-gray-900 border border-gray-800 text-white",
  children,
  ...rest
}) => {
  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      style={{
        padding: `${thickness}px 0`,
          cursor: "default",
    pointerEvents: "none",
        ...rest.style,
      }}
      {...rest}
    >
      {/* efek star bawah */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      {/* efek star atas */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      {/* content */}
      <div
        className={`relative z-10 h-[44px] px-[13px] rounded-[20px] ${backgroundClass} flex items-center justify-center text-[16px] font-medium`}
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
