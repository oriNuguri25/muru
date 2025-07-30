import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/SupabaseClient";
import { useAuth } from "../context/useAuth";

interface ChatSession {
  id: string;
  user_id: string;
  type: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useChatSession = (type: string, sessionId?: string) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 현재 세션 조회
  const {
    data: currentSession,
    isLoading: isLoadingSession,
    error: sessionError,
  } = useQuery({
    queryKey: ["chatSession", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    enabled: !!sessionId && !!user,
  });

  // 사용자의 세션 목록 조회
  const {
    data: userSessions,
    isLoading: isLoadingSessions,
    error: sessionsError,
  } = useQuery({
    queryKey: ["userSessions", user?.id, type],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", type)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    },
    enabled: !!user,
  });

  // 새 세션 생성 (첫 질문 포함)
  const createSessionMutation = useMutation({
    mutationFn: async (firstQuestion: string): Promise<ChatSession> => {
      if (!user) throw new Error("사용자가 로그인되지 않았습니다.");

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          type: type,
          title: firstQuestion,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: (newSession) => {
      // 새 세션 생성 후 해당 세션 페이지로 이동
      navigate(`/chat/${type}/${newSession.id}`);
      // 세션 목록 캐시 업데이트
      queryClient.invalidateQueries({
        queryKey: ["userSessions", user?.id, type],
      });
    },
  });

  // 세션 제목 업데이트
  const updateSessionTitleMutation = useMutation({
    mutationFn: async ({
      sessionId,
      title,
    }: {
      sessionId: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from("sessions")
        .update({
          title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("user_id", user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["userSessions", user?.id, type],
      });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["chatSession", sessionId] });
      }
    },
  });

  return {
    currentSession,
    userSessions,
    isLoadingSession,
    isLoadingSessions,
    sessionError,
    sessionsError,
    createSession: createSessionMutation.mutateAsync,
    updateSessionTitle: updateSessionTitleMutation.mutate,
    isCreatingSession: createSessionMutation.isPending,
    isUpdatingTitle: updateSessionTitleMutation.isPending,
  };
};
