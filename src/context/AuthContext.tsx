import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase/SupabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import type { ReactNode } from "react";

// 1. Context 타입 정의
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

// 2. 초기값 설정
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

// 3. Provider 정의
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 앱 시작 시 현재 세션 불러오기
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSession(data.session ?? null);
      setLoading(false);
    });

    // 로그인/로그아웃 등 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSession(session ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
