import { createFileRoute, Link } from "@tanstack/react-router";
import { FEATURES_DATA } from "@/lib/features-data";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { ArrowRight, ChevronRight, Sparkles, Terminal } from "lucide-react";

export const Route = createFileRoute("/features/")({
  head: () => ({
    meta: [
      { title: "DevOS Features: All-in-One Developer Workspace Modules" },
      {
        name: "description",
        content:
          "Explore all 14 DevOS modules: LeetCode profile tracker, technical notes, learning hub, job pipeline, focus timer, resume builder, and analytics.",
      },
      { property: "og:title", content: "DevOS Features: All-in-One Developer Workspace Modules" },
      {
        property: "og:description",
        content:
          "Explore all 14 DevOS modules: LeetCode profile tracker, technical notes, learning hub, job pipeline, focus timer, resume builder, and analytics.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/features" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DevOS Features: All-in-One Developer Workspace Modules" },
      {
        name: "twitter:description",
        content:
          "Explore all 14 DevOS modules: LeetCode profile tracker, technical notes, learning hub, job pipeline, focus timer, resume builder, and analytics.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/features",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "DevOS Features & Modules Directory",
          url: "https://www.dev-os.app/features",
          description:
            "Explore all 14 DevOS developer workspace modules designed for software engineers, students, and competitive programmers.",
          publisher: {
            "@type": "Organization",
            name: "DevOS",
            url: "https://www.dev-os.app/",
          },
        }),
      },
    ],
  }),
  component: FeaturesIndexPage,
});

function FeaturesIndexPage() {
  const featureList = Object.values(FEATURES_DATA);

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />

      <main className="relative z-10 pt-28 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-emerald-400 font-semibold">Features</span>
          </nav>

          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>14 DEDICATED MODULES</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Everything Developers Need in One Place
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              DevOS eliminates context switching by connecting your coding profiles, technical notes,
              active projects, job search pipeline, and deep work timers in a single dark UI.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureList.map((feature) => (
              <Link
                key={feature.slug}
                to="/features/$slug"
                params={{ slug: feature.slug }}
                className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-card/80 hover:shadow-xl hover:shadow-emerald-950/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {feature.badge}
                    </span>
                    <Terminal className="size-4 text-muted-foreground/60 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                    {feature.name}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.metaDescription}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-border/30 flex items-center justify-between text-xs font-medium text-emerald-400">
                  <span>Explore Module</span>
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

