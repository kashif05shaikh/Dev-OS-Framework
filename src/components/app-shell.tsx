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
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Settings,
  Sun,
  Target,
  Terminal,
  Timer,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Notes", to: "/notes", icon: FileText },
  { label: "Learning Hub", to: "/learning", icon: GraduationCap },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Job Tracker", to: "/jobs", icon: Briefcase },
  { label: "Coding Profiles", to: "/profiles", icon: Braces },
  { label: "Resume", to: "/resume", icon: FileText },
  { label: "AI Workspace", to: "/ai", icon: Rocket },
  { label: "Calendar", to: "/calendar", icon: CalendarDays },
  { label: "Goals", to: "/goals", icon: Target },
  { label: "Focus Timer", to: "/focus", icon: Timer },
  { label: "Dev Tools", to: "/tools", icon: Wrench },
  { label: "Network", to: "/network", icon: Users },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
];

const SIDEBAR_KEY = "devos-sidebar-collapsed";
const THEME_KEY = "devos-theme";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      const dark = savedTheme ? savedTheme === "dark" : true;
      setIsDark(dark);
      if (dark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
        if (next) {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.add("light");
          document.documentElement.classList.remove("dark");
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
          collapsed ? "w-0 overflow-hidden border-r-0" : "w-60",
        )}
        aria-hidden={collapsed}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Terminal className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">DevOS</p>
            <p className="text-[11px] text-muted-foreground">Developer OS</p>
          </div>
          <button
            type="button"
            onClick={toggle}
            title="Hide sidebar"
            className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1 pb-4">
            {PRIMARY_NAV.map((item) => {
              const active =
                item.to === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.to!);
              return (
                <Link
                  key={item.label}
                  to={item.to!}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 truncate px-2 text-xs text-muted-foreground">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col w-full max-w-full overflow-x-hidden">
        {/* Top bar — desktop only */}
        <div className="hidden items-center justify-end gap-2 border-b border-border bg-background/80 px-4 py-2 backdrop-blur-sm md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link
            to="/settings"
            title="Settings"
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            <Settings className="size-4" />
          </Link>
        </div>

        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Terminal className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">DevOS</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link
              to="/settings"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-2xl md:hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Terminal className="size-4" />
                </div>
                <span className="text-sm font-semibold">DevOS Workspace</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <nav className="space-y-1">
                {PRIMARY_NAV.map((item) => {
                  const active =
                    item.to === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.to!);
                  return (
                    <Link
                      key={item.label}
                      to={item.to!}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <div className="mb-2 truncate text-xs text-muted-foreground">{user?.email}</div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void signOut();
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </div>
        )}

        <main className="relative min-w-0 flex-1 w-full max-w-full overflow-x-hidden">
          {collapsed && (
            <button
              type="button"
              onClick={toggle}
              title="Show sidebar"
              className="fixed left-3 top-14 z-40 hidden rounded-md border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground md:block"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
