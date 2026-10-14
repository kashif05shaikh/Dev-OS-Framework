import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/compare/devos-vs-trello")({
  head: () => ({
    meta: [
      { title: "DevOS vs Trello for Developers: Honest Comparison — DevOS" },
      {
        name: "description",
        content:
          "Compare DevOS and Trello for software engineers. Discover why developers prefer an integrated workspace over generic single-purpose Kanban boards.",
      },
      { property: "og:title", content: "DevOS vs Trello for Developers: Honest Comparison — DevOS" },
      {
        property: "og:description",
        content:
          "Compare DevOS and Trello for software engineers. Discover why developers prefer an integrated workspace over generic single-purpose Kanban boards.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://www.dev-os.app/compare/devos-vs-trello" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DevOS vs Trello for Developers: Honest Comparison — DevOS" },
      {
        name: "twitter:description",
        content:
          "Compare DevOS and Trello for software engineers. Discover why developers prefer an integrated workspace over generic single-purpose Kanban boards.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/compare/devos-vs-trello",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "DevOS vs Trello for Software Engineers: Honest Comparison",
          url: "https://www.dev-os.app/compare/devos-vs-trello",
          description:
            "A comprehensive comparison of DevOS developer workspace and Trello for software engineers, students, and competitive programmers.",
          author: {
            "@type": "Organization",
            name: "DevOS",
            url: "https://www.dev-os.app/",
          },
          publisher: {
            "@type": "Organization",
            name: "DevOS",
            logo: {
              "@type": "ImageObject",
              url: "https://www.dev-os.app/favicon.svg",
            },
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.dev-os.app/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Comparisons",
              item: "https://www.dev-os.app/compare",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "DevOS vs Trello",
              item: "https://www.dev-os.app/compare/devos-vs-trello",
            },
          ],
        }),
      },
    ],
  }),
  component: CompareTrelloPage,
});

const COMPARISON_ROWS = [
  {
    feature: "Integrated Engineering Lifecycle",
    devos: "Unifies coding stats, markdown notes, jobs, and projects",
    trello: "Isolated Kanban board only; requires separate tools",
  },
  {
    feature: "Specialized Developer Project Metadata",
    devos: "Repo links, demo URLs, tech stack tags, and deployment status",
    trello: "Generic cards; requires manual labels or paid Power-Ups",
  },
  {
    feature: "Competitive Programming Tracking",
    devos: "Native live sync for LeetCode, Codeforces, CodeChef, GitHub",
    trello: "No support whatsoever for coding statistics",
  },
  {
    feature: "Technical Job Application Pipeline",
    devos: "Purpose-built Kanban with salary logs and technical rounds",
    trello: "Generic board that must be organized from scratch",
  },
  {
    feature: "Developer Focus Timer & Deep Work",
    devos: "Built-in Pomodoro timer linked to projects and tasks",
    trello: "No native timer; requires third-party browser extensions",
  },
  {
    feature: "Built-in Developer Utilities",
    devos: "One-click access to JSON formatters, regex, and cloud tools",
    trello: "None",
  },
  {
    feature: "Non-Technical Team Collaboration",
    devos: "Tailored code-first for solo engineers and developers",
    trello: "Excellent for marketing, HR, and non-technical team boards",
  },
  {
    feature: "Context Switching",
    devos: "Single tab eliminates juggling 5+ separate developer tools",
    trello: "High; must constantly switch between Trello and code tools",
  },
];

function CompareTrelloPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />

      <main className="relative z-10 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <Link to="/compare" className="hover:text-foreground transition-colors">
              Compare
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-emerald-400 font-semibold">DevOS vs Trello</span>
          </nav>

          {/* Header & Direct Answer in First 2 Sentences */}
          <header className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>HONEST TOOL COMPARISON</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              DevOS vs Trello for Developers
            </h1>

            {/* Direct Answer in First 2 Sentences */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-6 md:p-8 backdrop-blur-sm shadow-lg">
              <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                DevOS is a complete developer ecosystem that integrates Kanban project and job tracking
                directly alongside coding profiles, markdown docs, and learning goals, whereas Trello is
                strictly a general-purpose Kanban board tool. While Trello excels at simple card movement
                for cross-functional teams, DevOS unifies the entire engineering lifecycle without
                juggling disjointed single-purpose tools.
              </p>
            </div>
          </header>

          {/* Feature Comparison Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Side-by-Side Feature Breakdown
            </h2>

            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="py-4 px-5 font-semibold text-foreground w-1/3">Capability</th>
                      <th className="py-4 px-5 font-semibold text-emerald-400 w-1/3">DevOS</th>
                      <th className="py-4 px-5 font-semibold text-muted-foreground w-1/3">Trello</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-normal">
                    {COMPARISON_ROWS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 px-5 font-medium text-foreground">{row.feature}</td>
                        <td className="py-3.5 px-5 text-emerald-300 text-xs sm:text-sm">
                          {row.devos}
                        </td>
                        <td className="py-3.5 px-5 text-muted-foreground text-xs sm:text-sm">
                          {row.trello}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* When to Choose Which */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Check className="size-5 text-emerald-400" />
                When to Choose DevOS
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>• You want your coding stats, notes, tasks, and timer in one window.</li>
                <li>• You want project cards with GitHub links, tech stack tags, and live demos.</li>
                <li>• You want a specialized tech job search pipeline with salary logging.</li>
                <li>• You want zero context switching during deep coding sprints.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Check className="size-5 text-muted-foreground" />
                When to Choose Trello
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>• You need simple shared boards with marketing or non-technical peers.</li>
                <li>• You want an isolated Kanban board without notes or coding stats.</li>
                <li>• You rely on existing enterprise Atlassian integrations (Jira, Confluence).</li>
                <li>• You only track simple cards without developer-specific fields.</li>
              </ul>
            </div>
          </section>

          {/* Bottom Conversion Banner */}
          <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-card to-emerald-950/20 p-8 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Level Up from Isolated Kanban Boards
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              DevOS connects your project boards directly to your notes, code profiles, and focus timers.
              Free forever for individual developers.
            </p>
            <div className="pt-2">
              <Link to="/auth">
                <Button size="lg" className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                  <span>Get Started with DevOS</span>
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

