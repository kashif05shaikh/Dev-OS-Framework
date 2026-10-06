import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/60 py-12 text-xs text-muted-foreground font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Terminal className="size-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">DevOS</span>
              <span className="text-[11px] font-mono text-muted-foreground block">
                Your Developer Operating System
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap justify-center gap-6 font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#modules" className="hover:text-foreground transition-colors">
              Modules
            </a>
            <a href="#philosophy" className="hover:text-foreground transition-colors">
              Philosophy
            </a>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Get Started
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div>© 2026 DevOS. Built for engineers.</div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>Learn. Build. Track. Ship.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
