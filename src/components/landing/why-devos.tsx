import { Zap, Eye, RefreshCw, Layers } from "lucide-react";

export function LandingWhyDevOS() {
  const pillars = [
    {
      icon: Layers,
      title: "Zero Context Switching",
      desc: "Stop bouncing between 10 separate tabs, bookmark folders, Notion pages, and Excel sheets. Everything is consolidated inside one developer OS.",
    },
    {
      icon: RefreshCw,
      title: "Automated Platform Metrics",
      desc: "Automatically sync your solved problems, contest ratings, and streaks from LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, and GFG.",
    },
    {
      icon: Zap,
      title: "Deep Work Focus Sessions",
      desc: "Native pomodoro timer mapped directly to your daily focus trend graphs, goal progress, and skill radar breakdown.",
    },
    {
      icon: Eye,
      title: "Actionable Mission Control",
      desc: "Get an immediate high-level overview of active projects, pinned goals, job interview pipelines, and AI-driven growth insights.",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-card/20 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <Zap className="size-3.5" />
            <span>BUILT FOR ENGINEERS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Built for the way developers actually work.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Designed to bring structure, focus, and clarity to your daily software development
            routine.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/50 bg-card/40 p-8 space-y-4 hover:border-emerald-500/30 transition-all shadow-lg"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <item.icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
