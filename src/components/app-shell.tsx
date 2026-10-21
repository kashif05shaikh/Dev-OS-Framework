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
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  { label: "Dev Tools", to: "/dev-tools", icon: Wrench },
  { label: "Network", to: "/network", icon: Users },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
];

const SIDEBAR_KEY = "devos-sidebar-collapsed";
const THEME_KEY = "devos-theme";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  // Sync sidebar scroll with page scroll so it moves dynamically down the page
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const navEl = sidebarNavRef.current;
          if (navEl) {
            const maxWindowScroll = document.documentElement.scrollHeight - window.innerHeight;
            const maxNavScroll = navEl.scrollHeight - navEl.clientHeight;
            if (maxWindowScroll > 0 && maxNavScroll > 0) {
              const scrollRatio = Math.min(1, Math.max(0, window.scrollY / maxWindowScroll));
              navEl.scrollTop = scrollRatio * maxNavScroll;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <div className="min-h-dvh bg-background w-full [--app-header-height:4rem] lg:[--app-header-height:3rem]">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-2xl transition-all duration-200 lg:flex",
            collapsed ? "w-0 -translate-x-full border-r-0" : "w-60 translate-x-0",
          )}
          aria-hidden={collapsed}
        >
          <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/40">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Terminal className="size-4 text-primary" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">DevOS</p>
              <p className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground font-medium">Studio Hub</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              title="Hide sidebar"
              className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>

          <div
            ref={sidebarNavRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 overscroll-contain"
          >
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
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-sidebar-border shadow-xs"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-sidebar-border/50 p-3">
            <div className="mb-2 truncate px-2 text-xs text-muted-foreground/80">{user?.email}</div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </aside>

        {/* Main Container */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col w-full max-w-full transition-[padding-left] duration-200",
            collapsed ? "lg:pl-0" : "lg:pl-60",
          )}
        >
          {/* Top bar — desktop only */}
          <div className="hidden h-14 items-center justify-between gap-2 border-b border-border bg-background/80 px-6 backdrop-blur-xl lg:flex">
            <div>
              {collapsed && (
                <button
                  type="button"
                  onClick={toggle}
                  title="Show sidebar"
                  className="flex size-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-all duration-200 hover:border-border hover:bg-accent hover:text-foreground active:scale-95 shadow-xs"
                >
                  <PanelLeftOpen className="size-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex size-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-all duration-200 hover:border-border hover:bg-accent hover:text-foreground active:scale-95 shadow-xs"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <Link
                to="/settings"
                title="Settings"
                className="flex size-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground transition-all duration-200 hover:border-border hover:bg-accent hover:text-foreground active:scale-95 shadow-xs"
              >
                <Settings className="size-4" />
              </Link>
            </div>
          </div>

          {/* Mobile Header Bar */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
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
                className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <Link
                to="/settings"
                aria-label="Settings"
                className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings className="size-4" />
              </Link>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
              </SheetTrigger>
            </div>
          </header>

          {/* Mobile Navigation Drawer Overlay */}
          <SheetContent
            side="left"
            aria-describedby={undefined}
            className="flex h-dvh w-full max-w-sm flex-col gap-0 p-0 [&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Terminal className="size-4" />
                </div>
                <SheetTitle className="text-sm font-semibold">DevOS Workspace</SheetTitle>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1 p-4">
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

            <div className="shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
          </SheetContent>

          <main className="workspace-content relative min-w-0 flex-1 w-full max-w-full">
            {collapsed && (
              <button
                type="button"
                onClick={toggle}
                title="Show sidebar"
                className="fixed left-3 top-14 z-40 hidden rounded-md border border-border bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground lg:block"
              >
                <PanelLeftOpen className="size-4" />
              </button>
            )}
            {children}
          </main>
        </div>
      </div>
    </Sheet>
  );
}
