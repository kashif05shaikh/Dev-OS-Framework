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
    let initialized = false;

    const handleSession = (sess: Session | null) => {
      setSession(sess);
      setLoading(false);
      if (sess?.user?.id) {
        // Refetch queries so newly authenticated token is used instead of any pre-auth empty cache
        void queryClient.invalidateQueries();
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleSession(nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!initialized) {
          initialized = true;
          handleSession(data.session);
        }
      })
      .catch((err) => {
        console.error("[useAuth] Failed to get session:", err);
        setLoading(false);
      });

    // Safety timeout: Ensure loading never remains true indefinitely if network hangs
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

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
