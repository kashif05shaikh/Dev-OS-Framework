import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { FEATURES_DATA, type FeatureItem } from "@/lib/features-data";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/features/$slug")({
  head: ({ params }) => {
    const feature = FEATURES_DATA[params.slug];
    if (!feature) {
      return {
        meta: [{ title: "Feature Not Found — DevOS" }],
      };
    }

    const canonicalUrl = `https://www.dev-os.app/features/${feature.slug}`;

    const breadcrumbSchema = {
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
          name: "Features",
          item: "https://www.dev-os.app/features",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: feature.name,
          item: canonicalUrl,
        },
      ],
    };

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: feature.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    const softwareFeatureSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `DevOS — ${feature.name}`,
      alternateName: "DevOS (dev-os.app)",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: canonicalUrl,
      image: "https://www.dev-os.app/og-image.svg",
      description: feature.metaDescription,
      author: {
        "@type": "Organization",
        name: "DevOS",
        url: "https://www.dev-os.app/",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    };

    return {
      meta: [
        { title: feature.metaTitle },
        { name: "description", content: feature.metaDescription },
        { property: "og:title", content: feature.metaTitle },
        { property: "og:description", content: feature.metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: "DevOS (dev-os.app)" },
        { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: feature.metaTitle },
        { name: "twitter:description", content: feature.metaDescription },
        { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
      ],
      links: [
        {
          rel: "canonical",
          href: canonicalUrl,
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbSchema),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(faqSchema),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(softwareFeatureSchema),
        },
      ],
    };
  },
  loader: ({ params }) => {
    const feature = FEATURES_DATA[params.slug];
    if (!feature) {
      throw notFound();
    }
    return { feature };
  },
  component: FeatureDetailPage,
});

function FeatureDetailPage() {
  const data = Route.useLoaderData() as { feature: FeatureItem };
  const feature: FeatureItem = data.feature;

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
            <Link to="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-emerald-400 font-semibold">{feature.name}</span>
          </nav>

          {/* Hero Header */}
          <header className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <Sparkles className="size-3.5" />
              <span>{feature.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {feature.h1}
            </h1>

            {/* Direct Answer in First 2 Sentences (Crucial for AEO / AI Citations) */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-6 md:p-8 backdrop-blur-sm shadow-lg">
              <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                {feature.leadParagraph}{" "}
                <span className="text-muted-foreground font-normal">{feature.secondSentence}</span>
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-500/10 text-sm text-muted-foreground">
                {feature.summary}
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/auth">
                <Button size="lg" className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-2 shadow-md">
                  <span>Start Free Workspace</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="h-11 px-6 border-border/60 hover:bg-muted/40">
                  <Layers className="size-4 mr-2" />
                  View All 14 Modules
                </Button>
              </Link>
            </div>
          </header>

          {/* Capabilities Grid */}
          <section className="space-y-6 pt-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Core Capabilities & Architecture
              </h2>
              <p className="text-sm text-muted-foreground">
                Built code-first for engineers, students, and competitive programmers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feature.capabilities.map((cap: FeatureItem["capabilities"][number], idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-colors space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                    <h3 className="text-base font-semibold text-foreground">{cap.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Why It Matters */}
          <section className="rounded-xl border border-border/40 bg-card/40 p-6 md:p-8 backdrop-blur-sm space-y-4">
            <h2 className="text-xl font-bold text-foreground">Why It Matters for Engineers</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {feature.whyItMatters}
            </p>
            <div className="pt-4 border-t border-border/30">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Compared to generic tools: </span>
                {feature.comparisonWithGeneric}
              </p>
            </div>
          </section>

          {/* Module FAQs */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-5 text-emerald-400" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {feature.faq.map((item: FeatureItem["faq"][number], idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-2"
                >
                  <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Conversion Banner */}
          <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-card to-emerald-950/20 p-8 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Unify Your Engineering Stack with DevOS
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              DevOS replaces scattered tabs and manual trackers with one modern developer workspace.
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

