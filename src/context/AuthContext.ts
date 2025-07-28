import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

// Context 타입 정의
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

// Context 생성
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});
