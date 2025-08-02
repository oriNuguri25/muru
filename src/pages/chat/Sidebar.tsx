import { Home, User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase/SupabaseClient";
import { useAuth } from "../../context/useAuth";
import { useEffect } from "react";

interface ChatSession {
  id: string;
  user_id: string;
  type: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  type?: string;
  sessions?: ChatSession[];
}

const Sidebar = ({ type, sessions = [] }: SidebarProps) => {
  const navigate = useNavigate();
  const { userName, isLoading } = useUserProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: realtimeSessions, isLoading: isLoadingSessions } = useQuery({
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
    enabled: !!user && !!type,
  });

  // Supabase real-time subscription 설정
  useEffect(() => {
    if (!user || !type) return;

    // sessions 테이블의 변경사항을 구독
    const channel = supabase
      .channel(`sessions-${user.id}-${type}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE 모든 이벤트
          schema: "public",
          table: "sessions",
          filter: `user_id=eq.${user.id} AND type=eq.${type}`,
        },
        (payload) => {
          console.log("Sessions 변경 감지:", payload);

          // 캐시 무효화하여 최신 데이터 가져오기
          queryClient.invalidateQueries({
            queryKey: ["userSessions", user.id, type],
          });
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, type, queryClient]);

  // 실시간 세션이 있으면 사용, 없으면 props로 받은 sessions 사용
  const displaySessions = realtimeSessions || sessions;

  const handleMuruClick = () => {
    navigate("/");
  };

  const handleSessionClick = (sessionId: string) => {
    navigate(`/chat/${type}/${sessionId}`);
  };

  const handleNewChatClick = () => {
    // 현재 세션 ID를 제거하고 새 채팅 모드로 이동
    navigate(`/chat/${type}`);
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-200">
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <button
          onClick={handleMuruClick}
          className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg transition-colors w-full cursor-pointer"
        >
          <div className="text-xl ml-2.5 font-bold text-gray-800">MURU</div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <nav className="space-y-2">
            <button
              onClick={handleMuruClick}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
            >
              <Home className="w-5 h-5 text-gray-600" />
              <div className="text-gray-700 font-medium">홈</div>
            </button>
            <button
              onClick={handleNewChatClick}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
            >
              <Plus className="w-5 h-5 text-gray-600" />
              <div className="text-gray-700 font-medium">
                새로운 대화 생성하기
              </div>
            </button>
          </nav>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-3">
              내 대화 기록
            </h3>
            <div className="space-y-1">
              {isLoadingSessions ? (
                <div className="text-gray-500 text-sm px-3 py-2">
                  로딩 중...
                </div>
              ) : displaySessions && displaySessions.length > 0 ? (
                displaySessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="text-gray-700 text-sm truncate block">
                      {session.title}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-gray-500 text-sm px-3 py-2">&nbsp;</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100  transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-gray-700 font-medium">
            {isLoading ? "로딩 중..." : userName}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
