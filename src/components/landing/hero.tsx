import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingProductMockup } from "./mockup";
import { useAuth } from "@/hooks/use-auth";

export function LandingHero() {
  const { user } = useAuth();

  return (
    <section className="relative pt-32 pb-20 md:pt-36 md:pb-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Hero Copy */}
        <div className="text-center space-y-6 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-medium tracking-[0.14em] uppercase text-white/90 backdrop-blur-md">
            <Sparkles className="size-3.5 text-white/80" />
            <span>LEARN • BUILD • TRACK • SHIP</span>
          </div>

          {/* Main Title - Single Line */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-[-0.045em] text-white break-words">
            Your Developer Operating System.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto font-normal">
            DevOS unifies your learning hub, technical notes, projects, coding profiles, goals, job
            pipeline, and focus stats into one clean developer workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button
                size="lg"
                className="h-12 px-8 text-sm md:text-base rounded-full bg-white hover:bg-neutral-200 text-black font-semibold shadow-[0_0_24px_-4px_rgba(255,255,255,0.3)] gap-2 transition-all hover:scale-[1.02] w-full sm:w-auto"
              >
                {user ? "Open DevOS Workspace" : "Get Started"}
                <ArrowRight className="size-5" />
              </Button>
            </Link>

            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-sm md:text-base rounded-full border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.1] hover:border-white/25 transition-all w-full sm:w-auto"
              >
                Explore DevOS ↓
              </Button>
            </a>
          </div>

          {/* Micro text */}
          <div className="flex items-center justify-center gap-4 text-xs text-white/50 pt-2">
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-white/80" /> Zero fluff
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-white/80" /> Built for engineers
            </span>
            <span>•</span>
            <span>One workspace for your entire journey</span>
          </div>
        </div>

        {/* Hero Interactive Product Showcase */}
        <div id="product-demo" className="pt-4">
          <LandingProductMockup />
        </div>
      </div>
    </section>
  );
}
