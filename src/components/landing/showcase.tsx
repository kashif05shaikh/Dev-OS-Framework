import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  FolderKanban,
  Briefcase,
  Braces,
  CheckCircle2,
  Plus,
  Flame,
  Star,
  Code2,
  Activity,
} from "lucide-react";

function CodingProfilesHeatmap() {
  const weeks = 36;
  const daysPerWeek = 7;
  const levels = [
    0, 1, 2, 0, 3, 1, 0, 1, 0, 4, 2, 1, 3, 0, 2, 3, 1, 0, 0, 2, 1, 0, 2, 4, 3, 1, 0, 2, 1, 0, 2, 3,
    4, 1, 0, 0, 1, 3, 2, 0, 4, 2, 3, 2, 0, 1, 4, 3, 1, 2, 1, 3, 0, 2, 4, 1,
  ];

  const getColor = (lvl: number) => {
    switch (lvl) {
      case 1:
        return "bg-emerald-950/80 border-emerald-800/40";
      case 2:
        return "bg-emerald-800/60 border-emerald-700/50";
      case 3:
        return "bg-emerald-600/80 border-emerald-500/60";
      case 4:
        return "bg-emerald-400 border-emerald-300";
      default:
        return "bg-card/60 border-border/30";
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-sans flex items-center gap-2">
            <Activity className="size-4 text-emerald-400" />
            Unified Coding Activity & Contribution Heatmap
          </h3>
          <p className="text-xs text-muted-foreground font-sans">
            482 contributions across synced platforms in the last year • 14 day active streak
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <span className="size-2.5 rounded-sm bg-card/60 border border-border/30" />
          <span className="size-2.5 rounded-sm bg-emerald-950/80 border border-emerald-800/40" />
          <span className="size-2.5 rounded-sm bg-emerald-800/60 border border-emerald-700/50" />
          <span className="size-2.5 rounded-sm bg-emerald-600/80 border border-emerald-500/60" />
          <span className="size-2.5 rounded-sm bg-emerald-400 border border-emerald-300" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex gap-1.5 min-w-[550px]">
          {Array.from({ length: weeks }).map((_, wIndex) => (
            <div key={wIndex} className="grid grid-rows-7 gap-1.5">
              {Array.from({ length: daysPerWeek }).map((_, dIndex) => {
                const lvl = levels[(wIndex * 7 + dIndex) % levels.length] ?? 0;
                return (
                  <div
                    key={dIndex}
                    className={`size-2.5 rounded-sm border ${getColor(lvl)} transition-transform hover:scale-125 cursor-pointer`}
                    title={`Day ${wIndex * 7 + dIndex + 1}: ${lvl * 3} problems solved`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ShowcaseTab = "dashboard" | "notes" | "learning" | "projects" | "jobs" | "profiles";

export function LandingProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("dashboard");

  return (
    <section className="py-24 relative overflow-hidden bg-card/20 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <LayoutDashboard className="size-3.5" />
            <span>INTERACTIVE PRODUCT SHOWCASE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Your entire developer journey. One workspace.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Click through the core modules to preview how DevOS looks and feels in action.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 rounded-xl border border-border/60 bg-background/80 max-w-3xl mx-auto backdrop-blur-md">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "notes", label: "Notes Tree", icon: FileText },
            { id: "learning", label: "Learning Hub", icon: GraduationCap },
            { id: "projects", label: "Projects", icon: FolderKanban },
            { id: "jobs", label: "Job Tracker", icon: Briefcase },
            { id: "profiles", label: "Coding Profiles", icon: Braces },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ShowcaseTab)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Display Area for Active Tab */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* 1. Dashboard Tab View */}
          {activeTab === "dashboard" && (
            <div className="space-y-4 font-sans text-xs">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 flex justify-between items-center">
                <div>
                  <div className="font-mono text-emerald-400 font-semibold">
                    DASHBOARD MISSION CONTROL
                  </div>
                  <div className="text-lg font-bold text-foreground">Good evening, ALEX 👋</div>
                  <div className="text-muted-foreground">
                    Nothing scheduled today — pick a goal and make measurable progress.
                  </div>
                </div>
                <div className="hidden sm:flex gap-2">
                  <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                    482 Solved
                  </span>
                  <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                    14d Streak
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-border/40 bg-card/40 font-mono">
                  <div className="text-muted-foreground">CODEFORCES</div>
                  <div className="text-cyan-400 font-bold">Specialist (1450)</div>
                </div>
                <div className="p-3 rounded-lg border border-border/40 bg-card/40 font-mono">
                  <div className="text-muted-foreground">CODECHEF</div>
                  <div className="text-amber-400 font-bold">★★ (1520)</div>
                </div>
                <div className="p-3 rounded-lg border border-border/40 bg-card/40 font-mono">
                  <div className="text-muted-foreground">LEETCODE</div>
                  <div className="text-blue-400 font-bold">Global #184200</div>
                </div>
                <div className="p-3 rounded-lg border border-border/40 bg-card/40 font-mono">
                  <div className="text-muted-foreground">ATCODER</div>
                  <div className="text-emerald-400 font-bold">Green (820)</div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Notes Tree View */}
          {activeTab === "notes" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
                <div className="flex justify-between items-center text-foreground font-bold border-b border-border/40 pb-2">
                  <span>Notes Tree</span>
                  <Plus className="size-4 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  {[
                    { name: "DSA & Algorithms", color: "text-purple-400" },
                    { name: "System Design", color: "text-blue-400" },
                    { name: "Database Internals", color: "text-emerald-400" },
                    { name: "Operating Systems", color: "text-amber-400" },
                    { name: "Computer Networks", color: "text-rose-400" },
                    { name: "Frontend Architecture", color: "text-purple-400" },
                    { name: "Backend Systems", color: "text-emerald-400" },
                    { name: "DevOps & CI/CD", color: "text-cyan-400" },
                  ].map((sub) => (
                    <div
                      key={sub.name}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer"
                    >
                      <span className="text-muted-foreground">›</span>
                      <span className={`size-2 rounded-full ${sub.color}`} />
                      <span className="text-foreground">{sub.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/20 p-8 flex flex-col items-center justify-center text-center space-y-3">
                <FileText className="size-12 text-emerald-500/40" />
                <h4 className="text-sm font-bold text-foreground">
                  Select a note from your subjects tree
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Write clean Markdown notes with instant syntax highlighting, code snippet blocks,
                  and subject tagging.
                </p>
              </div>
            </div>
          )}

          {/* 3. Learning Hub View */}
          {activeTab === "learning" && (
            <div className="space-y-4 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="font-mono text-muted-foreground">12 Saved Resources</span>
                <span className="text-emerald-400 font-mono">10 of 12 completed (83%)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                {[
                  {
                    title: "SYSTEM DESIGN ARCHITECTURE",
                    type: "YOUTUBE",
                    category: "SYSTEM DESIGN",
                    pct: "100%",
                    status: "Completed",
                  },
                  {
                    title: "DISTRIBUTED SYSTEMS 101",
                    type: "DOCS",
                    category: "BACKEND",
                    pct: "100%",
                    status: "Completed",
                  },
                  {
                    title: "REACT VIRTUAL DOM",
                    type: "YOUTUBE",
                    category: "FRONTEND",
                    pct: "100%",
                    status: "Completed",
                  },
                  {
                    title: "GO CONCURRENCY PATTERNS",
                    type: "YOUTUBE",
                    category: "BACKEND",
                    pct: "100%",
                    status: "Completed",
                  },
                  {
                    title: "TCP/IP & SOCKETS",
                    type: "ARTICLE",
                    category: "NETWORKS",
                    pct: "100%",
                    status: "Completed",
                  },
                  {
                    title: "DATABASE INDEXING B-TREES",
                    type: "DOCS",
                    category: "DBMS",
                    pct: "100%",
                    status: "Completed",
                  },
                ].map((res) => (
                  <div
                    key={res.title}
                    className="p-3.5 rounded-xl border border-border/40 bg-card/40 space-y-2"
                  >
                    <div className="flex justify-between text-[10px]">
                      <span className="text-emerald-400">{res.type}</span>
                      <span className="text-muted-foreground">{res.category}</span>
                    </div>
                    <div className="font-bold text-foreground truncate">{res.title}</div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: res.pct }} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="size-3" /> {res.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Projects View */}
          {activeTab === "projects" && (
            <div className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    name: "DevOS Developer Workspace",
                    stack: "React • Tailwind • TypeScript",
                    pct: 95,
                  },
                  {
                    name: "Distributed KV Cache Engine",
                    stack: "Go • Raft Consensus • gRPC",
                    pct: 100,
                  },
                  {
                    name: "Realtime Collab Code Editor",
                    stack: "Next.js • WebSockets • Redis",
                    pct: 75,
                  },
                  { name: "CLI Tooling Suite", stack: "Rust • Clap • Tokio", pct: 100 },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="p-4 rounded-xl border border-border/40 bg-card/40 space-y-2 font-mono"
                  >
                    <div className="flex justify-between font-bold text-foreground">
                      <span>{p.name}</span>
                      <span className="text-emerald-400">{p.pct}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{p.stack}</div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Job Tracker View */}
          {activeTab === "jobs" && (
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-4 gap-2 text-center text-muted-foreground border-b border-border/40 pb-2">
                <div>APPLIED (4)</div>
                <div>INTERVIEW (2)</div>
                <div>OFFER (1)</div>
                <div>REJECTED (0)</div>
              </div>
              <div className="space-y-2">
                {[
                  {
                    company: "Vercel",
                    role: "Frontend Platform Engineer",
                    status: "Interviewing",
                    date: "2d ago",
                  },
                  {
                    company: "Stripe",
                    role: "Software Engineer",
                    status: "Applied",
                    date: "5d ago",
                  },
                  {
                    company: "Linear",
                    role: "Full Stack Engineer",
                    status: "Offer Received",
                    date: "1d ago",
                  },
                ].map((j) => (
                  <div
                    key={j.company}
                    className="flex justify-between items-center p-3 rounded-lg border border-border/40 bg-card/40"
                  >
                    <div>
                      <div className="font-bold text-foreground">
                        {j.role} @ {j.company}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{j.date}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Coding Profiles View with Activity Heatmap */}
          {activeTab === "profiles" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { platform: "LeetCode", solved: "320 solved", icon: Flame },
                  { platform: "Codeforces", solved: "120 solved", icon: Code2 },
                  { platform: "CodeChef", solved: "42 solved", icon: Star },
                  { platform: "AtCoder", solved: "18 solved", icon: Braces },
                  { platform: "GeeksforGeeks", solved: "85 solved", icon: CheckCircle2 },
                  { platform: "HackerRank", solved: "25 solved", icon: Star },
                ].map((prof) => (
                  <div
                    key={prof.platform}
                    className="p-3.5 rounded-xl border border-border/40 bg-card/40 flex items-center gap-3"
                  >
                    <prof.icon className="size-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-foreground">{prof.platform}</div>
                      <div className="text-muted-foreground">{prof.solved}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Contribution Heatmap inside Coding Profiles tab */}
              <CodingProfilesHeatmap />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
