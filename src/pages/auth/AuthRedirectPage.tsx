import { supabase } from "../../lib/supabase/SupabaseClient";
import { useEffect } from "react";

export default function AuthRedirectPage() {
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

        // access_token을 localStorage에 저장
        if (access_token) {
          localStorage.setItem("access_token", access_token);
          console.log("Access token saved to localStorage");
        }

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

      // BASE_URL 또는 localhost:5173으로 리다이렉트
      const redirectUrl = import.meta.env.VITE_BASE_URL;

      if (session) {
        console.log("Session found, redirecting to:", redirectUrl);
        // 외부 URL로 리다이렉트 (히스토리 교체)
        window.location.replace(redirectUrl);
      } else {
        console.warn("No session found, redirecting to:", redirectUrl);
        // 세션이 없어도 리다이렉트 (히스토리 교체)
        window.location.replace(redirectUrl);
      }
    };

    doRedirect();
  }, []);

  return <div>인증 처리 중...</div>;
}
