import Header from "@/components/layout/private/dashboard/Header";
import Meeting from "@/components/layout/private/dashboard/Meeting";
import Carousels from "@/components/layout/private/dashboard/Carousels";

const DashboardPage = () => {
  return (
    <>      
    <head>
        <title>Dashboard | Meet Up Now</title>
        <meta
          name="description"
          content="Meet Up Now dashboard page, where you can create meetings and join meetings."
        />
        <link rel="icon" href="/MeetUpNow.png" />
      </head>

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
