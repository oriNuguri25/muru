import { Route, Routes } from "react-router-dom";
import MainPage from "../pages/main/MainPage";
import AuthCallback from "../pages/auth/AuthCallback";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
};

export default AppRoutes;
