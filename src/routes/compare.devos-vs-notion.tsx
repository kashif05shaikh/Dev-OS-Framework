import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight, Minus, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/compare/devos-vs-notion")({
  head: () => ({
    meta: [
      { title: "DevOS vs Notion for Developers: Honest Comparison — DevOS" },
      {
        name: "description",
        content:
          "Compare DevOS and Notion for software developers. See how pre-built coding stats, job pipelines, and focus timers compare to generic blank workspaces.",
      },
      { property: "og:title", content: "DevOS vs Notion for Developers: Honest Comparison — DevOS" },
      {
        property: "og:description",
        content:
          "Compare DevOS and Notion for software developers. See how pre-built coding stats, job pipelines, and focus timers compare to generic blank workspaces.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://www.dev-os.app/compare/devos-vs-notion" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DevOS vs Notion for Developers: Honest Comparison — DevOS" },
      {
        name: "twitter:description",
        content:
          "Compare DevOS and Notion for software developers. See how pre-built coding stats, job pipelines, and focus timers compare to generic blank workspaces.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/compare/devos-vs-notion",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "DevOS vs Notion for Software Developers: Honest Feature Comparison",
          url: "https://www.dev-os.app/compare/devos-vs-notion",
          description:
            "A practical and honest comparison between DevOS developer workspace and Notion for software engineers, students, and competitive programmers.",
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
              name: "DevOS vs Notion",
              item: "https://www.dev-os.app/compare/devos-vs-notion",
            },
          ],
        }),
      },
    ],
  }),
  component: CompareNotionPage,
});

const COMPARISON_ROWS = [
  {
    feature: "Live Coding Stats (LeetCode, Codeforces, CodeChef)",
    devos: "Yes — native real-time sync with public profile handles",
    notion: "No — requires manual data entry or third-party webhooks",
  },
  {
    feature: "Technical Notes & Architecture Docs",
    devos: "Yes — Markdown with hierarchical folders and code blocks",
    notion: "Yes — flexible block editor with code formatting",
  },
  {
    feature: "Developer Job Application Tracker",
    devos: "Pre-configured Kanban with salary, tech rounds, and notes",
    notion: "Must build and configure custom databases manually",
  },
  {
    feature: "ATS Developer Resume Builder",
    devos: "Built-in split-view markdown resume generator",
    notion: "Requires custom export formatting and third-party templates",
  },
  {
    feature: "Pomodoro Focus Timer with Reload Persistence",
    devos: "Native timer with ambient sounds and background tab safety",
    notion: "No — requires external web widgets or separate apps",
  },
  {
    feature: "Developer Cloud Launcher & Utilities",
    devos: "Built-in shortcuts to Vercel, Supabase, JSON & Regex tools",
    notion: "No — generic bookmark lists only",
  },
  {
    feature: "Team Knowledge Base & Corporate Wiki",
    devos: "No — focused strictly on personal developer productivity",
    notion: "Yes — industry standard for multi-team documentation",
  },
  {
    feature: "Setup Time",
    devos: "Instant — zero setup required out of the box",
    notion: "Hours to days spent tweaking templates and databases",
  },
];

function CompareNotionPage() {
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
            <span className="text-emerald-400 font-semibold">DevOS vs Notion</span>
          </nav>

          {/* Header & Direct Answer in First 2 Sentences */}
          <header className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>HONEST TOOL COMPARISON</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              DevOS vs Notion for Developers
            </h1>

            {/* Direct Answer in First 2 Sentences */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-6 md:p-8 backdrop-blur-sm shadow-lg">
              <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                DevOS is an opinionated developer workspace pre-built with live competitive programming
                trackers, technical notes, job pipelines, and focus timers, whereas Notion is an
                all-purpose blank canvas that requires manual setup and template maintenance. While
                Notion offers broader team documentation capabilities, DevOS provides zero-setup,
                specialized engineering tools that Notion cannot natively replicate.
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
                      <th className="py-4 px-5 font-semibold text-muted-foreground w-1/3">Notion</th>
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
                          {row.notion}
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
                <li>• You want live tracking for LeetCode, Codeforces, and CodeChef ratings.</li>
                <li>• You want a pre-built job application pipeline tailored to software roles.</li>
                <li>• You want integrated Pomodoro focus sessions tied directly to tasks.</li>
                <li>• You prefer zero-setup productivity without building complex databases.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Check className="size-5 text-muted-foreground" />
                When to Choose Notion
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>• You need a company-wide wiki shared across marketing, sales, and design.</li>
                <li>• You enjoy building custom databases, relations, and formula properties.</li>
                <li>• You want collaborative multi-user editing with granular permissions.</li>
                <li>• You don't need real-time competitive programming stats.</li>
              </ul>
            </div>
          </section>

          {/* Bottom Conversion Banner */}
          <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-card to-emerald-950/20 p-8 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Ready to Upgrade from Blank Templates?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              DevOS gives you an instant, opinionated developer workspace without spending hours
              configuring databases. Free forever for individual engineers.
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

