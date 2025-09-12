import { useState } from "react";
import BlurText from "@/ui/BlurText";
import ShinyText from "@/ui/ShinyText";
import StarBorder from "@/ui/StarBorder";
import FadeContent from "@/ui/FadeContent";
import { Collapse, Segmented } from "antd";

const faqData = {
  General: [
    {
      key: "1",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText
            text="What makes Meet.Line different from other video conferencing tools?"
            speed={5}
          />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>
            Meet Up Now is a modern video conferencing tool designed for ease of
            use and productivity.
          </p>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText
            text="Can I use Meet Up Now without installing any software?"
            speed={5}
          />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>
            Yes, you can use it directly from your browser without installing
            additional software.
          </p>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText
            text="What makes Meet Up Now different from other video conferencing tools?"
            speed={5}
          />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>
            Yes, breakout rooms allow you to split participants into smaller
            groups.
          </p>
        </div>
      ),
    },
    {
      key: "4",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText text="Does it integrate with calendar apps?" speed={5} />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>Yes, it works seamlessly on both iOS and Android devices.</p>
        </div>
      ),
    },
    {
      key: "5",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText
            text="What kind of customer support does Meet Up Now provide?"
            speed={5}
          />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>We offer 24/7 live chat, email, and knowledge base support.</p>
        </div>
      ),
    },
  ],
  Features: [
    {
      key: "1",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText text="Does it support screen sharing?" speed={5} />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>
            Yes, Meet Up Now provides easy and smooth screen sharing for
            presentations and collaboration.
          </p>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText text="Can I record meetings?" speed={5} />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>You can record meetings and store them securely in the cloud.</p>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText text="Is there a breakout room feature?" speed={5} />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>
            It is lightweight, has AI-enhanced features, and prioritizes
            security for every meeting.
          </p>
        </div>
      ),
    },
    {
      key: "4",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText
            text="Does Meet Up Now work on mobile devices?"
            speed={5}
          />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>
            Meet Up Now integrates with Google Calendar and Microsoft Outlook.
          </p>
        </div>
      ),
    },
    {
      key: "5",
      label: (
        <div className="w-full text-center text-white font-medium">
          <ShinyText text="What about chat and reactions?" speed={5} />
        </div>
      ),
      children: (
        <div className="text-center text-[#717171]">
          <p>
            There is an in-meeting chat and emoji reactions to keep the sessions
            engaging.
          </p>
        </div>
      ),
    },
  ],
};

const FAQ = () => {
  const [category, setCategory] = useState("General");

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-4 sm:px-6"
      style={{
        backgroundImage: `
         linear-gradient(to right, #DFDFDF 1px, transparent 1px),
         linear-gradient(to bottom, #DFDFDF 1px, transparent 1px)
       `,
        backgroundSize: "80px 80px",
      }}
    >
      <div className="w-full max-w-3xl flex flex-col items-center text-center py-12">
        <div className="flex justify-center mb-6">
          <StarBorder
            color="cyan"
            speed="3s"
            backgroundClass="bg-white text-[#0065FD] border border-[#E9E9E9]"
          >
            ⁉️ Ask Meet Up Now ⁉️
          </StarBorder>
        </div>

        <BlurText
          text="Frequently Asked Questions"
          delay={150}
          animateBy="words"
          direction="top"
          className="text-[28px] sm:text-[36px] md:text-[44px] text-[#171717] font-medium mb-8 px-2"
        />

        <div className="mb-[24px]">
          <Segmented
            options={["General", "Features"]}
            size="large"
            shape="round"
            value={category}
            onChange={setCategory}
            className="border border-[#E9E9E9]"
          />
        </div>

        <FadeContent
          blur={true}
          duration={1500}
          easing="ease-out"
          initialOpacity={0}
        >
          <Collapse
            accordion={false}              
            className="custom-collapse w-full max-w-[calc(100vw-32px)] sm:max-w-[650px] md:max-w-[850px] hover:scale-105 space-y-4"
            items={faqData[category]}
            expandIconPosition="end"
          />
        </FadeContent>
      </div>
    </main>
  );
};

export default FAQ;
