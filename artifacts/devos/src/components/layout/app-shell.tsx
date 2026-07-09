import { Link, useLocation } from "wouter";
import { 
  Terminal, Home, BookOpen, FileText, Code2, Briefcase, 
  FileBadge, Bot, Wrench, Globe, Calendar as CalendarIcon, 
  Target, Timer, Bell, LineChart, Settings, LogOut, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk, useUser } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlobalSearch } from "../global-search";
import { useState } from "react";
import { useGetUnreadNotificationCount } from "@workspace/api-client-react";

const navItems = [
  { icon: Home, label: "Command Center", href: "/home" },
  { icon: BookOpen, label: "Learning", href: "/learning" },
  { icon: FileText, label: "Notes", href: "/notes" },
  { icon: Code2, label: "Coding Profiles", href: "/coding" },
  { icon: Briefcase, label: "Projects", href: "/projects" },
  { icon: Target, label: "Jobs", href: "/jobs" },
  { icon: FileBadge, label: "Resume", href: "/resume" },
  { icon: Bot, label: "AI & Prompts", href: "/ai" },
  { icon: Wrench, label: "Dev Tools", href: "/devtools" },
  { icon: Globe, label: "Network", href: "/network" },
  { icon: CalendarIcon, label: "Calendar", href: "/calendar" },
  { icon: Target, label: "Goals & Habits", href: "/goals" },
  { icon: Timer, label: "Focus Timer", href: "/focus" },
  { icon: LineChart, label: "Analytics", href: "/analytics" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);
  
  const { data: unreadCount } = useGetUnreadNotificationCount();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-card shadow-sm z-10 relative">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link href="/home" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Terminal className="h-6 w-6" />
            <span className="font-bold tracking-tight text-lg">DevOS</span>
          </Link>
        </div>

        <div className="p-3">
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-background border border-border rounded-md hover:border-primary/50 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search anywhere...</span>
            <kbd className="text-[10px] bg-secondary px-1.5 py-0.5 rounded opacity-70 border border-border">⌘K</kbd>
          </button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1 pb-4">
            {navItems.map((item) => {
              const active = location.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-border bg-card/50">
          <Link 
            href="/notifications"
            className={cn(
              "flex items-center gap-3 px-3 py-2 mb-1 rounded-md text-sm font-medium transition-colors",
              location.startsWith("/notifications")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <div className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount?.count ? (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground font-bold border border-background">
                  {unreadCount.count > 9 ? '9+' : unreadCount.count}
                </span>
              ) : null}
            </div>
            Notifications
          </Link>
          <Link 
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 mb-2 rounded-md text-sm font-medium transition-colors",
              location.startsWith("/settings")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          
          <div className="flex items-center gap-3 px-3 py-2 bg-background border border-border rounded-lg mt-2">
            <Avatar className="h-8 w-8 rounded-md border border-border">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground text-xs font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-xs font-semibold truncate">{user?.fullName || 'User'}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <button 
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative z-0">
        <ScrollArea className="flex-1">
          <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </ScrollArea>
      </main>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
