export function PrivacyPolicyContent() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
        <p>
          Welcome to DevOS. This Privacy Policy explains how [TODO: Company Legal Name] ("we", "us",
          or "our") collects, uses, and protects your personal information when you use the DevOS
          platform at devos-hub.vercel.app. We respect your privacy and are committed to protecting
          your personal data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">2. Data We Collect</h2>
        <p>We collect information you provide directly to us when using DevOS:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>
            <strong>Account Information:</strong> Name, email address, and authentication
            credentials.
          </li>
          <li>
            <strong>User Content:</strong> Data you create and store in the app, including goals,
            focus sessions, jobs, learning resources, projects, resume files, and notes.
          </li>
          <li>
            <strong>Usage Data:</strong> We may collect basic analytics on how you interact with the
            platform.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">3. How We Use Your Data</h2>
        <p>Your data is used to provide and improve the DevOS experience:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>To authenticate you and provide access to your workspace.</li>
          <li>To store and sync your user-generated content across sessions.</li>
          <li>To communicate important updates about your account or the service.</li>
          <li>To analyze usage patterns and improve the platform.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">4. Third-Party Services</h2>
        <p>We use trusted third-party services that may process your data:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>
            <strong>Supabase:</strong> For database hosting, authentication, and file storage.
          </li>
          <li>
            <strong>Vercel:</strong> For hosting the application and handling serverless functions.
          </li>
          <li>
            <strong>Google:</strong> If you choose to sign in using Google OAuth.
          </li>
        </ul>
        <p className="mt-2">These services have their own privacy policies governing data use.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">5. Cookies and Storage</h2>
        <p>
          We use local storage, session storage, and essential cookies to keep you logged in, store
          your theme preferences, and maintain app state. We do not use tracking or advertising
          cookies.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          6. Data Retention and Deletion
        </h2>
        <p>
          We keep your data as long as your account is active. You can delete your account and all
          associated data at any time.
        </p>
        <p className="mt-2">
          To delete your account, please visit the{" "}
          <a href="/delete-account" className="text-primary hover:underline">
            Account Deletion
          </a>{" "}
          page. Upon deletion, your profile, files, notes, and all other user content will be
          permanently removed from our databases and storage buckets.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">7. Your Rights</h2>
        <p>Depending on your location ([TODO: Jurisdiction]), you may have rights to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data.</li>
          <li>Export your data in a portable format.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
        <p>
          DevOS is not intended for children under 13 years of age. We do not knowingly collect
          personal information from children under 13.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">9. Security</h2>
        <p>
          We implement standard security measures to protect your data, including encryption in
          transit (HTTPS) and at rest through our infrastructure providers. However, no internet
          transmission is 100% secure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or your data, please contact us at:
        </p>
        <p className="mt-2 font-medium">[TODO: Contact Email Address]</p>
      </section>
    </div>
  );
}
