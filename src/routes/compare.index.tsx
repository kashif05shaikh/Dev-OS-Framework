import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { ArrowRight, ChevronRight, Scale, Sparkles } from "lucide-react";

export const Route = createFileRoute("/compare/")({
  head: () => ({
    meta: [
      { title: "DevOS Comparisons: Alternatives for Software Developers" },
      {
        name: "description",
        content:
          "Honest comparisons between DevOS and tools like Notion and Trello. Discover the best productivity workspace for software developers.",
      },
      { property: "og:title", content: "DevOS Comparisons: Alternatives for Software Developers" },
      {
        property: "og:description",
        content:
          "Honest comparisons between DevOS and tools like Notion and Trello. Discover the best productivity workspace for software developers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/compare" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DevOS Comparisons: Alternatives for Software Developers" },
      {
        name: "twitter:description",
        content:
          "Honest comparisons between DevOS and tools like Notion and Trello. Discover the best productivity workspace for software developers.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/compare",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Developer Workspace Comparisons",
          url: "https://www.dev-os.app/compare",
          description:
            "Objective, side-by-side comparisons of DevOS vs other popular productivity tools for software engineers.",
          publisher: {
            "@type": "Organization",
            name: "DevOS",
            url: "https://www.dev-os.app/",
          },
        }),
      },
    ],
  }),
  component: CompareIndexPage,
});

const COMPARISONS = [
  {
    title: "DevOS vs Notion for Developers",
    slug: "devos-vs-notion",
    href: "/compare/devos-vs-notion" as const,
    tagline: "Pre-built engineering workspace vs generic blank canvas databases",
    summary:
      "See why developers prefer DevOS for real-time competitive programming ratings, specialized job tracking, and deep work timers instead of spending days configuring Notion templates.",
  },
  {
    title: "DevOS vs Trello for Developers",
    slug: "devos-vs-trello",
    href: "/compare/devos-vs-trello" as const,
    tagline: "Integrated engineering lifecycle vs isolated generic Kanban boards",
    summary:
      "Compare DevOS's multi-module developer dashboard against standalone Kanban cards lacking repository metadata, tech stack tags, and coding statistics.",
  },
];

function CompareIndexPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />

      <main className="relative z-10 pt-28 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>HONEST & OBJECTIVE COMPARISONS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              How DevOS Compares
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              We believe in honest, practical evaluations. Explore how DevOS compares to traditional
              productivity apps and decide which solution fits your engineering routine best.
            </p>
          </div>

          {/* Comparisons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMPARISONS.map((comp) => (
              <Link
                key={comp.slug}
                to={comp.href}
                className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-card/90 hover:shadow-xl hover:shadow-emerald-950/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                      Comparison
                    </span>
                    <Scale className="size-4 text-muted-foreground/60 group-hover:text-emerald-400 transition-colors" />
                  </div>

                  <h2 className="text-xl font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                    {comp.title}
                  </h2>

                  <p className="text-xs font-medium text-emerald-300">
                    {comp.tagline}
                  </p>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {comp.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-xs font-medium text-emerald-400">
                  <span>Read Honest Breakdown</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

