import { Collapse } from "antd";
import StarBorder from "../../../ui/StarBorder";
import BlurText from "../../../ui/BlurText";
import FadeContent from "../../../ui/FadeContent";
import ShinyText from "../../../ui/ShinyText";

const items = [
  {
    key: "1",
    label: (
      <div className="w-full text-center text-white font-medium">
         <ShinyText text=" What makes Meet.Line different from other video conferencing tools?" speed={5} />
      </div>
    ),
    children: (
      <div className="text-center text-[#717171]">
        <p>Ini adalah konten panel 1 dengan warna text #717171.</p>
        <p>Background konten menggunakan warna #FDFDFD dengan border radius 16px.</p>
      </div>
    ),
  },
  {
    key: "2",
    label: (
      <div className="w-full text-center text-white font-medium">
        Panel Header 2
      </div>
    ),
    children: (
      <div className="text-center text-[#717171]">
        <p>Konten panel 2 dengan styling yang sama.</p>
        <p>Header menggunakan gradient dari dark ke light theme.</p>
      </div>
    ),
  },
  {
    key: "3",
    label: (
      <div className="w-full text-center text-white font-medium">
        Panel Header 3
      </div>
    ),
    children: (
      <div className="text-center text-[#717171]">
        <p>Panel ketiga dengan konsistensi styling.</p>
        <p>Semua corner menggunakan border radius 16px.</p>
      </div>
    ),
  },
];

const FAQ = () => {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-[#F3F4F6]"
      style={{
        backgroundImage: `
         linear-gradient(to right, #DFDFDF 1px, transparent 1px),
         linear-gradient(to bottom, #DFDFDF 1px, transparent 1px)
       `,
        backgroundSize: "80px 80px",
      }}
    >
      <div className="w-full max-w-3xl flex flex-col items-center text-center px-6 py-12">
        <StarBorder
          color="cyan"
          speed="3s"
          backgroundClass="bg-white text-[#0065FD] border border-[#E9E9E9]"
        >
          ⁉️ Ask Meet Up Now ⁉️
        </StarBorder>

        <BlurText
          text="Frequently Asked Questions"
          delay={150}
          animateBy="words"
          direction="top"
          className="text-[44px] text-[#171717] font-medium mb-8"
        />

        <FadeContent blur={true} duration={1500} easing="ease-out" initialOpacity={0}>
         <Collapse
  accordion={false}
  className="custom-collapse w-full max-w-[850px]"
  items={items}
  expandIconPosition="end"
  defaultActiveKey={["1"]}
/>

        </FadeContent>
      </div>
    </main>
  );
};

export default FAQ;
