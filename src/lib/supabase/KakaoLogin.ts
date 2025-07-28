import { supabase } from "./SupabaseClient";

export const KakaoLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${import.meta.env.VITE_BASE_URL}/auth`,
    },
  });

  if (error) {
    console.log(error);
  }
};
