import { Route, Routes } from "react-router-dom";
import MainPage from "../pages/main/MainPage";
import AuthRedirectPage from "../pages/auth/AuthRedirectPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/auth" element={<AuthRedirectPage />} />
    </Routes>
  );
};

export default AppRoutes;
