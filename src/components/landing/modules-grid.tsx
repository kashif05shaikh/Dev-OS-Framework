import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  FolderKanban,
  Briefcase,
  Braces,
  Rocket,
  CalendarDays,
  Target,
  Timer,
  Wrench,
  Users,
  BarChart3,
  Boxes,
} from "lucide-react";

export function LandingModulesGrid() {
  const modules = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      badge: "Mission Control",
      desc: "Your central command center aggregating focus stats, active goals, recent activity, and platform titles.",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
    {
      icon: FileText,
      title: "Notes",
      badge: "Technical Wiki",
      desc: "Organize technical knowledge with hierarchical tree views across DSA, DBMS, OS, System Design, and DevOps.",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    },
    {
      icon: GraduationCap,
      title: "Learning Hub",
      badge: "Knowledge Hub",
      desc: "Curate articles, YouTube tutorials, and documentation into structured subject tracks with progress bars.",
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    },
    {
      icon: FolderKanban,
      title: "Projects",
      badge: "Build Tracker",
      desc: "Track active builds, tech stacks, completion percentages, and milestone tasks from idea to shipping.",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    },
    {
      icon: Briefcase,
      title: "Job Tracker",
      badge: "Career Pipeline",
      desc: "Manage tech job applications, interview stages, offer updates, and application history effortlessly.",
      color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
    },
    {
      icon: Braces,
      title: "Coding Profiles",
      badge: "Auto-Sync",
      desc: "Automated stats syncing for LeetCode, Codeforces, CodeChef, Atcoder, HackerRank, and GeeksforGeeks.",
      color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    },
    {
      icon: FileText,
      title: "Resume Builder",
      badge: "Career Assets",
      desc: "Maintain developer resume sections, technical skill blocks, and export ready PDF developer profiles.",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
    {
      icon: Rocket,
      title: "AI Workspace",
      badge: "AI Assistant",
      desc: "Interact with specialized developer AI assistants and code generators directly inside your OS environment.",
      color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    },
    {
      icon: CalendarDays,
      title: "Calendar",
      badge: "Schedule",
      desc: "Plan competitive coding contests, project deadlines, and study blocks in a unified calendar.",
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    },
    {
      icon: Target,
      title: "Goals",
      badge: "Milestones",
      desc: "Set quarterly engineering ambitions, break them into trackable sub-tasks, and measure completion.",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
    {
      icon: Timer,
      title: "Focus Timer",
      badge: "Deep Work",
      desc: "Built-in pomodoro focus timer logged straight to your daily productivity charts and skill radar.",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    },
    {
      icon: Wrench,
      title: "Dev Tools",
      badge: "Utilities",
      desc: "Instant developer utilities: JSON formatter, regex tester, base64 encoder, UUID generator, and CSS tools.",
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    },
    {
      icon: Users,
      title: "Network",
      badge: "Contacts",
      desc: "Track professional connections, tech mentors, recruiters, and referral contacts in one place.",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      badge: "Insights",
      desc: "Visualize your 14-day focus trend, skill radar breakdown, problem-solving volume, and habit consistency.",
      color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
    },
  ];

  return (
    <section id="modules" className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <Boxes className="size-3.5" />
            <span>POWERFUL CORE MODULES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Everything in one developer workspace.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            14 purpose-built developer modules designed to support every phase of your software engineering lifecycle.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className="group rounded-xl border border-border/50 bg-card/40 p-5 space-y-3 hover:border-emerald-500/40 hover:bg-card/70 transition-all hover:shadow-xl hover:shadow-emerald-950/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex size-10 items-center justify-center rounded-lg border ${mod.color}`}>
                    <mod.icon className="size-5" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
