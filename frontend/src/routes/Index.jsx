import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import LandingPage from "../components/layout/public/LandingPage";
import Dashboard from "../components/layout/private/Dashboard";
import Preview from "../components/layout/private/Preview";

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
      
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/preview" element={<Preview />} />
       <Route element={<ProtectedRoute />}>
      </Route>
    </Routes>
  );
}

export default Index;

