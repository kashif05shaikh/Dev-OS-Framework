import { BookOpen, Target, FolderKanban, Timer, Briefcase, TrendingUp } from "lucide-react";

export function LandingWorkflow() {
  const steps = [
    {
      num: "01",
      step: "LEARN",
      title: "Structure Your Knowledge",
      desc: "Save articles, YouTube playlists, and technical notes in organized subject trees.",
      icon: BookOpen,
      color: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    },
    {
      num: "02",
      step: "PLAN",
      title: "Set Milestone Goals",
      desc: "Turn broad ambitions like 'Master DSA' or 'Ship Fullstack App' into clear sub-goals.",
      icon: Target,
      color: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    },
    {
      num: "03",
      step: "BUILD",
      title: "Track Project Progress",
      desc: "Log project stacks, completion percentages, and task checklists from start to release.",
      icon: FolderKanban,
      color: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    },
    {
      num: "04",
      step: "TRACK",
      title: "Protect Deep Work Focus",
      desc: "Log pomodoro focus sessions and auto-sync coding streaks across competitive platforms.",
      icon: Timer,
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    },
    {
      num: "05",
      step: "SHIP",
      title: "Manage Career Growth",
      desc: "Track job applications, interview stages, offer statuses, and resume versions.",
      icon: Briefcase,
      color: "border-teal-500/30 text-teal-400 bg-teal-500/10",
    },
    {
      num: "06",
      step: "IMPROVE",
      title: "Analyze & Iterate",
      desc: "Review your 14-day focus trend, skill radar, problem counts, and AI insights.",
      icon: TrendingUp,
      color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
    },
  ];

  return (
    <section id="workflow" className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <TrendingUp className="size-3.5" />
            <span>DEVELOPER GROWTH CYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            From learning to shipping.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            DevOS supports your complete engineering loop — helping you stay disciplined, focused, and organized at every milestone.
          </p>
        </div>

        {/* Workflow Cards Loop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-4 hover:border-emerald-500/40 hover:bg-card/70 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-muted-foreground/30">{item.num}</span>
                  <div className={`flex size-10 items-center justify-center rounded-lg border ${item.color}`}>
                    <item.icon className="size-5" />
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-400 tracking-wider">{item.step}</div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
