import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete Account | DevOS" },
      { name: "description", content: "Instructions to delete your DevOS account." },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <AmbientBackground />
      <LandingNavbar />
      <main className="pt-24 pb-16 relative z-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-sm rounded-xl p-8 border border-border/40 dash-card">
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
              Account Deletion
            </h1>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                How to delete your account
              </h2>
              <p>
                You can delete your DevOS account and all associated data at any time from within
                the application. Follow these steps:
              </p>
              <ol className="list-decimal pl-6 space-y-2 mt-4">
                <li>
                  <Link to="/auth" className="text-primary hover:underline">
                    Log in
                  </Link>{" "}
                  to your DevOS account.
                </li>
                <li>
                  Navigate to the <strong>Settings</strong> page by clicking the gear icon in the
                  sidebar.
                </li>
                <li>
                  Scroll to the bottom of the page to find the <strong>Danger Zone</strong>.
                </li>
                <li>
                  Click the <strong>Delete account</strong> button.
                </li>
                <li>
                  A confirmation dialog will appear. Type <strong>DELETE</strong> as instructed to
                  permanently remove your account and all data.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">What gets deleted?</h2>
              <p>When you delete your account, the following data is permanently erased:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your profile and authentication credentials.</li>
                <li>All user-generated content (notes, goals, jobs, projects, etc.).</li>
                <li>All files you have uploaded (resumes, learning materials).</li>
                <li>Any active subscriptions will be cancelled.</li>
              </ul>
              <p className="mt-4 text-sm text-destructive font-medium">
                Please note that this action cannot be undone. We cannot recover your data once your
                account is deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Fallback Contact</h2>
              <p>
                If you are unable to access your account or encounter any issues with the automated
                deletion process, you can request account deletion by contacting us directly at:
              </p>
              <p className="mt-2 font-medium">
                <a href="mailto:kashcorp149@gmail.com" className="text-primary hover:underline">
                  kashcorp149@gmail.com
                </a>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please email us from the address associated with your DevOS account to verify
                ownership.
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
