import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("인증 콜백 오류:", error);
          alert("로그인 중 오류가 발생했습니다.");
          navigate("/");
          return;
        }

        if (data.session) {
          console.log("로그인 성공:", data.session.user);
          // 로그인 성공 후 메인 페이지로 이동
          navigate("/");
        } else {
          console.log("세션이 없습니다.");
          navigate("/");
        }
      } catch (error) {
        console.error("인증 콜백 예외:", error);
        alert("로그인 중 오류가 발생했습니다.");
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
