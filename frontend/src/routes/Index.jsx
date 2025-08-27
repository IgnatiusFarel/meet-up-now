import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import LandingPage from "../components/layout/public/LandingPage";
import Dashboard from "../components/layout/private/Dashboard";
import Preview from "../components/layout/private/Preview";
import Exit from "../components/layout/private/Exit";
import Meeting from "../components/layout/private/Meeting";

function Index() {
    const token = localStorage.getItem("jwt_token");

    const ProtectedRoute = () => {
     if (!token)    {
        return <Navigate to="/" replace />
     }

     return <Outlet />;
    }

    const AuthRoute = () => {
        if (token) {
            return <Navigate to="/dashboard" replace />
        }
        return <Outlet />;
    }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />      


        <Route path="/meeting" element={<Meeting />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/exit" element={<Exit />} />
       <Route element={<ProtectedRoute />}>
      </Route>
    </Routes>
  );
}

export default Index;

