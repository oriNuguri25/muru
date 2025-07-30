import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabase/SupabaseClient";
import { useAuth } from "../context/useAuth";

interface UserProfile {
  user_id: string;
  name: string;
  user_type: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("사용자가 로그인되지 않았습니다.");

      const { data, error } = await supabase
        .from("user_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });

  // 실시간 구독 설정
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_profile_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profile",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("실시간 업데이트:", payload);

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newData = payload.new as UserProfile;
            // TanStack Query 캐시 업데이트
            queryClient.setQueryData(["userProfile", user.id], newData);
          } else if (payload.eventType === "DELETE") {
            // 삭제된 경우 캐시에서 제거
            queryClient.removeQueries({ queryKey: ["userProfile", user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    profile,
    isLoading,
    error,
    refetch,
    userName: profile?.name || "사용자",
  };
};
