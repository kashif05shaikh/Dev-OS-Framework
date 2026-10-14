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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevOS: Developer Workspace for Projects, Learning & Jobs" },
      {
        name: "description",
        content:
          "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      },
      { property: "og:title", content: "DevOS: Developer Workspace for Projects, Learning & Jobs" },
      {
        property: "og:description",
        content:
          "DevOS is a developer workspace that manages learning, projects, goals, habits, jobs, notes and coding profiles in one place.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/" },
      { property: "og:site_name", content: "DevOS" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DevOS: Developer Workspace for Projects, Learning & Jobs" },
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
