import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/states";
import { PageTransition } from "@/components/page-transition";
import { useAuth } from "@/hooks/use-auth";
import { applyAccent, cacheAccent, cachedAccent } from "@/lib/accent";
import { profileQuery } from "@/lib/devos-queries";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Capture the first protected path so the redirect target doesn't drift to /auth.
  const intended = useRef(pathname);
  const profile = useQuery({ ...profileQuery(), enabled: Boolean(user) });

  // Paint the cached accent immediately, then reconcile with the stored profile.
  useEffect(() => {
    const cached = cachedAccent();
    if (cached) applyAccent(cached);
  }, []);

  useEffect(() => {
    const accent = profile.data?.accent_color;
    if (accent) {
      applyAccent(accent);
      cacheAccent(accent);
    }
  }, [profile.data?.accent_color]);

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth", search: { redirect: intended.current }, replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Loading your workspace…" />
      </div>
    );
  }

  return (
    <AppShell>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </AppShell>
  );
}