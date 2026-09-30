import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
      }
      const hasOAuthParams =
        typeof window !== "undefined" &&
        (window.location.search.includes("code=") ||
          window.location.hash.includes("access_token="));

      if (!hasOAuthParams || data.session) {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } finally {
          queryClient.clear();
          if (typeof window !== "undefined") {
            try {
              const clearDevos = (s: Storage) => {
                const keys: string[] = [];
                for (let i = 0; i < s.length; i++) {
                  const k = s.key(i);
                  if (k && k.startsWith("devos.")) keys.push(k);
                }
                keys.forEach((k) => s.removeItem(k));
              };
              clearDevos(localStorage);
              clearDevos(sessionStorage);
            } catch {
              /* storage unavailable - ignore */
            }
          }
        }
      },
    }),
    [session, loading, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}