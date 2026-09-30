import { XCircle, CheckCircle2, Terminal, Flame, Layers } from "lucide-react";

export function LandingComparison() {
  const withoutDevos = [
    {
      title: "Learning Hub",
      desc: "Cluttered browser bookmarks, unorganized YouTube playlists, lost documentation links.",
    },
    {
      title: "Projects & Tasks",
      desc: "Scattered Trello boards, Notion pages, and lost local README files.",
    },
    {
      title: "Coding Activity",
      desc: "Manually checking LeetCode, Codeforces, CodeChef & AtCoder ratings separately.",
    },
    {
      title: "Job Applications",
      desc: "Outdated spreadsheets with missing dates, interview status, and contact details.",
    },
    {
      title: "Technical Notes",
      desc: "Text files scattered across folders, Notion, and physical notebooks.",
    },
    {
      title: "Focus & Habits",
      desc: "Standalone pomodoro apps detached from daily coding goals and analytics.",
    },
  ];

  const withDevos = [
    {
      title: "Structured Learning Pipeline",
      desc: "Categorized subjects, course progress tracking, and instant article/YouTube saving.",
    },
    {
      title: "Integrated Project Kanban",
      desc: "Track build status, tech stacks, completion percentages, and task breakdowns.",
    },
    {
      title: "Auto-Synced Profile Hub",
      desc: "Real-time automated sync for LeetCode, Codeforces, CodeChef, AtCoder, HackerRank & GFG.",
    },
    {
      title: "Unified Job Tracker",
      desc: "Visual pipeline for applied, interview, offer, and rejection states.",
    },
    {
      title: "Hierarchical Note Tree",
      desc: "Structured subject organization (DSA, DBMS, OS, System Design, Frontend, Backend).",
    },
    {
      title: "Native Focus & Skill Radar",
      desc: "Pomodoro timer directly linked to focus trends, streak tracking, and skill radar charts.",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 relative overflow-hidden bg-card/20 border-y border-border/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <Layers className="size-3.5" />
            <span>UNIFIED DEVELOPER WORKSPACE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Everything you need to grow as a developer.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Your developer journey shouldn't be scattered across spreadsheets, notes, bookmarks,
            task managers, and disconnected tools. DevOS brings all the pieces into one focused
            developer operating system.
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Without DevOS Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <XCircle className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-rose-400">Without DevOS</h3>
                  <p className="text-xs font-mono text-muted-foreground">
                    Scattered, fragmented workflow
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {withoutDevos.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 p-3 rounded-lg border border-rose-500/10 bg-background/40"
                  >
                    <XCircle className="size-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* With DevOS Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-2xl shadow-emerald-500/5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-400">With DevOS</h3>
                  <p className="text-xs font-mono text-muted-foreground">
                    Centralized developer command center
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {withDevos.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 p-3 rounded-lg border border-emerald-500/20 bg-background/60"
                  >
                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
