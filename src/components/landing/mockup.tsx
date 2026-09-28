import {
  Code2,
  Flame,
  Timer,
  FolderKanban,
  Activity,
  Sparkles,
  Sun,
  Settings,
  ArrowUpRight,
} from "lucide-react";

export function LandingProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-6xl rounded-2xl border border-border/60 bg-card p-2 shadow-2xl backdrop-blur-3xl transition-all">
      {/* Window Controls & Header Bar */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-border/40 bg-card/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-rose-500/80" />
          <div className="size-3 rounded-full bg-amber-500/80" />
          <div className="size-3 rounded-full bg-emerald-500/80" />
          <div className="ml-3 flex items-center gap-1.5 rounded-md bg-background px-3 py-1 font-mono text-xs text-muted-foreground border border-border/40">
            <span className="text-emerald-400">https://</span>
            <span>devos.workspace/dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE WORKSPACE
          </div>
          <Sun className="size-4 cursor-pointer hover:text-foreground transition-colors" />
          <Settings className="size-4 cursor-pointer hover:text-foreground transition-colors" />
        </div>
      </div>

      {/* Main Window Dashboard Content Mockup */}
      <div className="overflow-hidden rounded-b-xl bg-background p-4 sm:p-6 text-foreground font-sans text-sm space-y-6">
        
        {/* Top Hero Banner in Workspace */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Sparkles className="size-3.5" />
                DevOS - Developer Operating System
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Good evening, ALEX <span className="animate-bounce inline-block">👋</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Nothing scheduled today — pick a goal and make measurable progress.
              </p>

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-emerald-400 flex items-center gap-1">
                  <Flame className="size-3" /> 14d streak
                </span>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-blue-400 flex items-center gap-1">
                  <Timer className="size-3" /> 4.2h focus / 7d
                </span>
                <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-purple-400 flex items-center gap-1">
                  <Activity className="size-3" /> 3 active goals
                </span>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-amber-400 flex items-center gap-1">
                  <Code2 className="size-3" /> 482 solved
                </span>
              </div>

              {/* Quick Action Pills */}
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                {["Continue learning", "Resume", "Projects", "AI Workspace", "Coding profiles", "Calendar"].map((pill) => (
                  <div
                    key={pill}
                    className="rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 font-medium text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{pill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Quote & Clock Card */}
            <div className="w-full lg:w-72 rounded-xl border border-border/50 bg-background/60 p-4 space-y-3">
              <div className="text-emerald-400 font-serif text-2xl font-bold">“</div>
              <p className="text-xs italic text-muted-foreground leading-relaxed -mt-3">
                First, solve the problem. Then, write the code.
              </p>
              <div className="text-[10px] text-muted-foreground font-mono">— John Johnson</div>
              <div className="pt-2 border-t border-border/40 flex items-center justify-between font-mono">
                <span className="text-lg font-bold text-foreground">08:15 pm</span>
                <span className="text-xs text-muted-foreground">Friday, 25 Sept</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Primary Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { label: "PROBLEMS SOLVED", value: "482", icon: Code2, color: "text-emerald-400" },
            { label: "CODING STREAK", value: "14d", icon: Flame, color: "text-amber-400" },
            { label: "HOURS FOCUSED", value: "4.2h", icon: Timer, color: "text-blue-400" },
            { label: "PROJECTS DONE", value: "6", icon: FolderKanban, color: "text-purple-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-mono font-semibold tracking-wider">{stat.label}</span>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight font-mono">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Coding Titles Row */}
        <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
          <div className="text-xs font-mono font-semibold text-muted-foreground tracking-wider uppercase">
            Coding Titles & Platform Ratings
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { platform: "CODEFORCES", title: "Specialist", rating: "1450", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
              { platform: "CODECHEF", title: "★★", rating: "1520", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { platform: "LEETCODE", title: "Global #184200", rating: "1580", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { platform: "ATCODER", title: "Green", rating: "820", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
            ].map((p) => (
              <div key={p.platform} className="rounded-lg border border-border/40 bg-background/50 p-3 text-center space-y-1">
                <div className="text-[10px] font-mono text-muted-foreground">{p.platform}</div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded border inline-block ${p.color}`}>{p.title}</div>
                <div className="text-base font-extrabold font-mono text-foreground">{p.rating}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid: Focus Trend & Skills Radar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Focus Trend Chart Mock */}
          <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Focus trend</h3>
                <p className="text-xs text-muted-foreground">Minutes of deep work, last 14 days</p>
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                Focus timer <ArrowUpRight className="size-3" />
              </span>
            </div>

            {/* Simulated Chart Wave */}
            <div className="h-32 w-full pt-4 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 L40,88 L80,90 L120,85 L160,89 L200,90 L240,88 L280,20 L320,85 L360,90 L400,90 L440,90 L480,90 L500,90 L500,100 L0,100 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0,90 L40,88 L80,90 L120,85 L160,89 L200,90 L240,88 L280,20 L320,85 L360,90 L400,90 L440,90 L480,90"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                <circle cx="280" cy="20" r="4" fill="#10b981" />
              </svg>
              <div className="absolute top-0 left-[54%] transform -translate-x-1/2 bg-card border border-emerald-500/40 rounded-lg p-2 text-[10px] font-mono shadow-lg">
                <div className="text-muted-foreground">09-21</div>
                <div className="text-emerald-400 font-bold">minutes : 120</div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/30">
              <span>09-12</span>
              <span>09-15</span>
              <span>09-18</span>
              <span>09-21</span>
              <span>09-25</span>
            </div>
          </div>

          {/* Skills Radar Mock */}
          <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Skills radar</h3>
              <p className="text-xs text-muted-foreground">Derived from live DevOS data</p>
            </div>
            <div className="flex justify-center items-center h-32 pt-2">
              <svg className="size-32" viewBox="0 0 100 100">
                <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="#27272a" strokeWidth="1" />
                <polygon points="50,25 72,37 72,63 50,75 28,63 28,37" fill="none" stroke="#27272a" strokeWidth="1" />
                <polygon points="50,15 78,35 65,65 50,70 30,55 35,32" fill="#10b981" fillOpacity="0.3" stroke="#10b981" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex justify-around text-[10px] font-mono text-muted-foreground text-center">
              <span>DSA: 88%</span>
              <span>Projects: 90%</span>
              <span>Focus: 82%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
