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
      { title: "DevOS — Your Developer Operating System" },
      {
        name: "description",
        content:
          "DevOS is a developer workspace for managing learning, projects, goals, habits, jobs, notes and your entire developer journey in one place.",
      },
      { property: "og:title", content: "DevOS — Your Developer Operating System" },
      {
        property: "og:description",
        content:
          "DevOS is a developer workspace for managing learning, projects, goals, habits, jobs, notes and your entire developer journey in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DevOS — Your Developer Operating System" },
      {
        name: "twitter:description",
        content:
          "DevOS is a developer workspace for managing learning, projects, goals, habits, jobs, notes and your entire developer journey in one place.",
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
