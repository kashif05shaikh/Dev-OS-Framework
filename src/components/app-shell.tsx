import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Braces,
  Briefcase,
  CalendarDays,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Repeat,
  Settings,
  Sparkles,
  Target,
  Terminal,
  Timer,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type NavItem = {
  label: string;
  to?: string;
  icon: typeof LayoutDashboard;
};

const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Notes", to: "/notes", icon: FileText },
  { label: "Learning Hub", to: "/learning", icon: GraduationCap },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Job Tracker", to: "/jobs", icon: Briefcase },
  { label: "Coding Profiles", to: "/profiles", icon: Braces },
  { label: "Resume", to: "/resume", icon: FileText },
];

const UPCOMING_NAV: NavItem[] = [
  { label: "AI Prompts", icon: Sparkles },
  { label: "Calendar", icon: CalendarDays },
  { label: "Goals", icon: Target },
  { label: "Habits", icon: Repeat },
  { label: "Focus Timer", icon: Timer },
  { label: "Analytics", icon: BarChart3 },
  { label: "Network", icon: Users },
  { label: "Dev Tools", icon: Wrench },
  { label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Terminal className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">DevOS</p>
            <p className="text-[11px] text-muted-foreground">Developer OS</p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1 pb-4">
            {PRIMARY_NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to!);
              return (
                <Link
                  key={item.label}
                  to={item.to!}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
            Porting next
          </p>
          <nav className="space-y-1 pb-6">
            {UPCOMING_NAV.map((item) => (
              <span
                key={item.label}
                title="Not ported yet"
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/40"
              >
                <item.icon className="size-4" />
                {item.label}
              </span>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 truncate px-2 text-xs text-muted-foreground">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void signOut()}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <Terminal className="size-4 text-primary" />
          <span className="text-sm font-semibold">DevOS</span>
          <div className="ml-auto flex gap-1">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.label} to={item.to!} className="rounded-md p-2 text-muted-foreground">
                <item.icon className="size-4" />
              </Link>
            ))}
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}