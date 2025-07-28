import { Route, Routes } from "react-router-dom";
import MainPage from "../pages/main/MainPage";
import AuthRedirectPage from "../pages/auth/AuthRedirectPage";
import ChatMain from "../pages/chat/ChatMain";
import AuthDetailPage from "../pages/auth/AuthDetailPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/auth" element={<AuthRedirectPage />} />
      <Route path="/auth/detail" element={<AuthDetailPage />} />
      <Route path="/chat" element={<ChatMain />} />
    </Routes>
  );
};

export default AppRoutes;
