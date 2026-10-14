import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingComparison } from "@/components/landing/comparison";
import { LandingModulesGrid } from "@/components/landing/modules-grid";
import { LandingProductShowcase } from "@/components/landing/showcase";
import { LandingWorkflow } from "@/components/landing/workflow";
import { LandingWhyDevOS } from "@/components/landing/why-devos";
import { LandingPhilosophy } from "@/components/landing/philosophy";
import { LandingCTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.dev-os.app/#organization",
      "name": "DevOS",
      "alternateName": "DevOS (dev-os.app)",
      "url": "https://www.dev-os.app/",
      "logo": "https://www.dev-os.app/favicon.svg",
      "description":
        "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      "sameAs": ["https://github.com/kashif05shaikh/Dev-OS-Framework"],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.dev-os.app/#website",
      "url": "https://www.dev-os.app/",
      "name": "DevOS (dev-os.app)",
      "alternateName": "DevOS",
      "description":
        "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      "publisher": {
        "@id": "https://www.dev-os.app/#organization",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.dev-os.app/#software",
      "name": "DevOS",
      "alternateName": "DevOS (dev-os.app)",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Web",
      "url": "https://www.dev-os.app/",
      "image": "https://www.dev-os.app/og-image.svg",
      "description":
        "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      "author": {
        "@id": "https://www.dev-os.app/#organization",
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "featureList": [
        "Coding Profiles Tracker (LeetCode, GitHub, Codeforces, CodeChef, WakaTime)",
        "Developer Technical Notes & Documentation Organizer",
        "Structured Learning Hub & Resource Library",
        "Software Project Management & Repository Tracker",
        "Developer Job Application Pipeline Tracker",
        "Developer Resume Builder with Live Preview",
        "Developer Goals and Habit Tracker",
        "Focus Timer with Pomodoro and Analytics",
        "Engineering Calendar & Milestone Tracker",
        "Developer Social & Professional Network Hub",
        "AI Prompts Workspace for Engineering Workflows",
        "Engineering Productivity & Focus Analytics",
        "Built-in Developer Utilities (JSON Formatter, Regex Tester, Base64, UUID Generator)",
      ],
    },
  ],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevOS (dev-os.app) — All-in-One Developer Workspace" },
      {
        name: "description",
        content:
          "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      },
      { property: "og:title", content: "DevOS (dev-os.app) — All-in-One Developer Workspace" },
      {
        property: "og:description",
        content:
          "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/" },
      { property: "og:site_name", content: "DevOS (dev-os.app)" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DevOS (dev-os.app) — All-in-One Developer Workspace" },
      {
        name: "twitter:description",
        content:
          "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(structuredData),
      },
    ],
  }),
  component: PublicLandingPage,
});

function PublicLandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingComparison />
        <LandingModulesGrid />
        <LandingProductShowcase />
        <LandingWorkflow />
        <LandingWhyDevOS />
        <LandingPhilosophy />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
