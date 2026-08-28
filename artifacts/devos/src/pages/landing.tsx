import { Link } from "wouter";
import { Terminal, Github, Code2, Laptop } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="h-6 w-6" />
          <span className="font-bold tracking-tight text-xl">DevOS</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors shadow-sm">
            Initialize
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-24 px-6 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-4xl w-full text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest border border-border mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            System Online
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6 font-sans">
            Your developer career, <br className="hidden md:block"/>
            <span className="text-primary inline-block transform hover:scale-105 transition-transform duration-300">centralized.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Stop juggling fifteen tabs. DevOS is your personal mission control for learning, coding profiles, projects, notes, and job hunting. Dense, fast, and built for builders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/sign-up" className="h-12 px-8 flex items-center justify-center rounded-md bg-foreground text-background hover:bg-foreground/90 font-bold text-lg transition-all shadow-md hover:shadow-lg">
              Launch DevOS
            </Link>
            <Link href="/sign-in" className="h-12 px-8 flex items-center justify-center rounded-md bg-card text-foreground border-2 border-border hover:border-primary/50 font-bold text-lg transition-all">
              Login to Console
            </Link>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Code2 className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Platform Sync</h3>
              <p className="text-muted-foreground text-sm">Live stats from GitHub, LeetCode, Codeforces and more. Your complete coding footprint.</p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Laptop className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Project Portfolio</h3>
              <p className="text-muted-foreground text-sm">Track ideas, tech stacks, and tasks. From local dev to production deployment.</p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Github className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Job Pipeline</h3>
              <p className="text-muted-foreground text-sm">Manage applications, resume versions, interviews, and ATS scoring in one view.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-20 border-t border-border bg-card flex items-center justify-center text-sm text-muted-foreground z-10 relative">
        <p>Built with intention. For developers who give a damn.</p>
      </footer>
    </div>
  );
}
