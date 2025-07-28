import { supabase } from "../../lib/supabase/SupabaseClient";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const doRedirect = async () => {
      const hash = window.location.hash;
      let access_token, refresh_token;

      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        access_token = params.get("access_token");
        refresh_token = params.get("refresh_token");

        // 디버깅을 위한 로그
        console.log("Extracted tokens:", {
          access_token: access_token ? "present" : "missing",
          refresh_token: refresh_token ? "present" : "missing",
        });

        // hash 클리어
        window.location.hash = "";
      }

      if (access_token && refresh_token) {
        try {
          await supabase.auth.setSession({ access_token, refresh_token });
          console.log("Session set successfully");
        } catch (error) {
          console.error("Error setting session:", error);
        }
      } else {
        console.warn("Missing tokens:", {
          access_token: !!access_token,
          refresh_token: !!refresh_token,
        });
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // URL 검색 파라미터에서 redirect 값을 가져오거나, 기본값으로 루트 페이지 사용
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get("redirect") || "/";

      if (session) {
        console.log("Session found, redirecting to:", redirectTo);
        // 루트 페이지로 명시적으로 이동
        navigate(redirectTo, { replace: true });
      } else {
        console.warn("No session found, redirecting to root");
        // 세션이 없어도 루트 페이지로 이동
        navigate("/", { replace: true });
      }
    };

    doRedirect();
  }, [navigate]);

  return <div>인증 처리 중...</div>;
}
