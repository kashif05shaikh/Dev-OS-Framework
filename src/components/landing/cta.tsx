import { Link } from "@tanstack/react-router";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function LandingCTA() {
  const { user } = useAuth();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-card to-background p-8 sm:p-14 text-center space-y-8 shadow-2xl shadow-emerald-950/30">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 size-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

          <div className="space-y-4 max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Ready to build your own DevOS?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Bring your learning, projects, goals, habits, job search, and coding analytics into
              one focused developer workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shadow-xl shadow-emerald-500/25 gap-2 transition-all hover:scale-[1.02] w-full sm:w-auto"
              >
                {user ? "Open DevOS Workspace" : "Get Started"}
                <ArrowRight className="size-5" />
              </Button>
            </Link>

            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-border/60 hover:bg-muted/40 w-full sm:w-auto"
              >
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
