import { Terminal } from "lucide-react";

export function LandingPhilosophy() {
  return (
    <section id="philosophy" className="py-28 relative overflow-hidden bg-gradient-to-b from-card/30 via-background to-card/20 border-t border-border/40">
      {/* Background Subtle Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10">
            <Terminal className="size-7" />
          </div>
        </div>

        <blockquote className="space-y-4">
          <p className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
            “Don’t just learn to code. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Build a system for becoming a developer.”
            </span>
          </p>
        </blockquote>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          DevOS is engineered to help you organize the process behind becoming better at building software — bridging theory, practice, discipline, and execution.
        </p>
      </div>
    </section>
  );
}
