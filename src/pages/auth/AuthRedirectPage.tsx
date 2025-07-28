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

        // hash 클리어
        window.location.hash = "";
      }

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // 로그인 성공 시 사용자 프로필 확인
        const { data: profile, error } = await supabase
          .from("user_profile")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (error || !profile) {
          // 프로필이 없으면 상세 정보 입력 페이지로 이동
          navigate("/auth/detail", { replace: true });
        } else {
          // 프로필이 있으면 메인 페이지로 이동
          navigate("/", { replace: true });
        }
      } else {
        // 로그인 실패 시 메인 페이지로 이동
        console.warn("No session found");
        navigate("/", { replace: true });
      }
    };

    doRedirect();
  }, [navigate]);

  return <div></div>;
}
