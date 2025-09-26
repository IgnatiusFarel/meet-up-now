import Preview from "@/components/layout/private/preview/Preview";
import Header from "@/components/layout/private/preview/Header";

const PreviewPage = () => {
  return (
    <>
      <title>Preview | Meet Up Now</title>
      <meta
        name="description"
        content="Preview your camera and microphone before joining a meeting on Meet Up Now. Choose your devices, turn on or off camera and mic, and get ready to collaborate."
      />
      <link rel="icon" href="/MeetUpNow.png" />

      <meta property="og:title" content="Preview | Meet Up Now" />
      <meta
        property="og:description"
        content="Preview your camera and microphone before joining a meeting on Meet Up Now. Choose your devices, turn on or off camera and mic, and get ready to collaborate."
      />
      <meta property="og:image" content="/MeetUpNow.png" />
      <meta property="og:type" content="website" />

      <main className="min-h-screen bg-white">
        <Header />
        <Preview />
      </main>
    </>
  );
};

export default PreviewPage;
