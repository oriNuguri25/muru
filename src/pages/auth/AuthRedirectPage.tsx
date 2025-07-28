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

      const redirectTo =
        new URLSearchParams(window.location.search).get("redirect") || "/";

      if (session) {
        navigate(redirectTo, { replace: true });
      } else {
        console.warn("No session found");
        navigate("/", { replace: true });
      }
    };

    doRedirect();
  }, []);

  return <div></div>;
}
