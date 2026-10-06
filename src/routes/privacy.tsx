import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { PrivacyPolicyContent } from "@/components/privacy-policy";
import { AmbientBackground } from "@/components/dashboard/ambient";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | DevOS" },
      { name: "description", content: "Privacy policy and data handling practices for DevOS." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />
      <main className="pt-24 pb-16 relative z-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/40 dash-card">
          <PrivacyPolicyContent />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

