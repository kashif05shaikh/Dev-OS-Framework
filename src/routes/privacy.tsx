import { createFileRoute } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { PrivacyPolicyContent } from "@/components/privacy-policy";
import { AmbientBackground } from "@/components/dashboard/ambient";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — DevOS Developer Workspace" },
      {
        name: "description",
        content:
          "Read the DevOS privacy policy. Learn how we protect developer data, coding profile connections, storage, and account information.",
      },
      { property: "og:title", content: "Privacy Policy — DevOS Developer Workspace" },
      {
        property: "og:description",
        content:
          "Read the DevOS privacy policy. Learn how we protect developer data, coding profile connections, storage, and account information.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.dev-os.app/privacy" },
      { property: "og:site_name", content: "DevOS" },
      { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Privacy Policy — DevOS Developer Workspace" },
      {
        name: "twitter:description",
        content:
          "Read the DevOS privacy policy. Learn how we protect developer data, coding profile connections, storage, and account information.",
      },
      { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://www.dev-os.app/privacy",
      },
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

