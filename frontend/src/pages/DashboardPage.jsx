import Header from "@/components/layout/private/dashboard/Header";
import Meeting from "@/components/layout/private/dashboard/Meeting";
import Carousels from "@/components/layout/private/dashboard/Carousels";

const DashboardPage = () => {
  return (
    <>
      <title>Dashboard | Meet Up Now</title>
      <meta
        name="description"
        content="Meet Up Now dashboard page, where you can create meetings and join meetings."
      />
      <link rel="icon" href="/MeetUpNow.png" />

      <meta
        property="og:title"
        content="Meet Up Now | Connect and Join Meetings Effortlessly"
      />
      <meta
        property="og:description"
        content="Meet Up Now is the easiest way to connect, join, and manage your online meetings. Stay productive and collaborate seamlessly."
      />
      <meta property="og:image" content="/MeetUpNow.png" />
      <meta property="og:type" content="website" />

      <main className="min-h-screen bg-white">
        <Header />
        <div className="flex min-h-[calc(100vh-80px)]">
          <Meeting />
          <Carousels />
        </div>
      </main>
    </>
  );
};

export default DashboardPage;
