import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <Link href="/" className="text-sm text-primary underline">← Back home</Link>
      </nav>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">StudyMate AI — effective October 2026.</p>
        <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">1. Information we collect</h2>
        <p className="text-muted-foreground mb-4">
          We collect account information (email, name, hashed password) that you provide when you sign up,
          plus content you upload or create (course materials, extracted text, reviewers, quizzes, flashcards,
          study tasks, and tutor conversations).
        </p>
        <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">2. How we use your information</h2>
        <p className="text-muted-foreground mb-4">
          Your data is used to provide the study tools, generate reviewers/quizzes/flashcards, and power your
          AI tutor. Document contents are never shared with other users.
        </p>
        <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">3. AI and your data</h2>
        <p className="text-muted-foreground mb-4">
          If you configure an AI provider, your messages and source excerpts may be sent to that provider.
          StudyMate AI does not require an AI provider; basic features work without one using a deterministic
          fallback. We do not log API secrets or passwords.
        </p>
        <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">4. Data retention &amp; deletion</h2>
        <p className="text-muted-foreground mb-4">
          You may delete your account at any time from Profile &amp; account settings. Deletion removes your
          personal data and associated content. Uploaded files stored locally are not persisted across
          serverless deployments; configure private object storage for production persistence.
        </p>
        <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">5. Security</h2>
        <p className="text-muted-foreground mb-4">
          Passwords are hashed. Sessions use HTTP-only, secure cookies. We do not sell your data.
        </p>
        <p className="text-muted-foreground mt-6">Questions? Contact support through the application.</p>
      </div>
    </div>
  );
}
