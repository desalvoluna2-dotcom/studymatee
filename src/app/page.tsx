import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Activity,
  ShieldAlert,
  Users,
  Clock,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-40 w-full border-b border-input bg-background/95 backdrop-blur-lg">
        <div className="flex h-14 shrink-0 items-center gap-1 px-6 lg:px-12">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="font-bold">S</span>
          </div>
          <Link href="/" className="font-bold tracking-tight text-lg text-foreground">
            StudyMate AI
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Sign in
            </Link>
            <Link href="/signup" className="Button-rounded">
              <button className="flex h-9 shrink-0 items-center justify-center rounded-md border border-input bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
                Get started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="px-6 pt-16 pb-24 lg:px-12 lg:pt-24 lg:pb-32 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
            Study smarter. Review better.<br />
            <span className="block text-primary">StudyMate AI</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground">
            A universal college study and reviewer platform for students and
            teachers. Generate reviewers, quizzes, flashcards, and study plans
            from your own course materials.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/signup"
              className="Button-rounded"
            >
              <button className="flex h-12 w-full sm:w-auto shrink-0 items-center justify-center rounded-md border border-input bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
                Start for free
              </button>
            </Link>
            <Link href="/login" className="flex h-12 w-full sm:w-auto shrink-0 items-center justify-center rounded-md border border-input bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80">
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-y border-input bg-muted/50 px-6 py-16 lg:px-12">
          <h2 className="text-center text-2xl font-bold text-foreground mb-12">Everything you need to pass</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: FileText, title: "Document Upload", desc: "Upload PDF, DOCX, or TXT materials. We extract the text for you." },
              { icon: GraduationCap, title: "Reviewer Generator", desc: "Generate structured reviewers from your source materials." },
              { icon: Activity, title: "Quiz Center", desc: "Create and take timed quizzes with server-side scoring." },
              { icon: BookOpen, title: "Flashcards", desc: "Study with spaced repetition flashcard decks." },
              { icon: ShieldAlert, title: "AI Tutor", desc: "Ask questions about your course materials." },
              { icon: Clock, title: "Study Planner", desc: "Plan sessions, track streaks, and meet deadlines." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-input bg-background p-6 text-foreground hover:bg-accent transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-24 lg:px-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">For every college, every course</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Information Technology, Computer Science, Engineering, Business,
            Nursing, Psychology, and more. Add your own courses and subjects.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            {[
              "Information Technology",
              "Computer Science",
              "Engineering",
              "Business Administration",
              "Nursing",
              "Psychology",
              "Education",
              "Criminology",
            ].map((c) => (
              <span key={c} className="rounded-full border border-input px-3 py-1">
                {c}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-input bg-muted/50 px-6 py-10 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>StudyMate AI — Universal College Reviewer Platform</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
