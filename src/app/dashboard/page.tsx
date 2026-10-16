import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  let user;
  try {
    user = await getSession();
  } catch {
    user = null;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Please <Link href="/login" className="underline">sign in</Link> to continue.</p>
      </div>
    );
  }

  let stats = { courses: 0, materials: 0, quizzes: 0, flashcards: 0 };
  let recentTasks: any[] = [];
  const upcoming: any[] = [];

  try {
    const [courseCount, materialCount, quizCount, flashcardCount, tasks] =
      await Promise.all([
        prisma.course.count({ where: { ownerId: user.id } }),
        prisma.studyMaterial.count({ where: { uploadedById: user.id } }),
        prisma.quiz.count({ where: { createdById: user.id } }),
        prisma.flashcardDeck.count({ where: { ownerId: user.id } }),
        prisma.studyTask.findMany({
          where: { userId: user.id, status: "PENDING" },
          orderBy: { dueDate: "asc" },
          take: 5,
          include: { course: true, subject: true },
        }),
      ]);
    stats = { courses: courseCount, materials: materialCount, quizzes: quizCount, flashcards: flashcardCount };
    recentTasks = tasks;
  } catch {
    // DB not configured yet; show empty state
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email}. Here&rsquo;s your study overview.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard title="Courses" value={stats.courses} icon={BookOpen} href="/courses" />
          <StatCard title="Materials" value={stats.materials} icon={FileText} href="/documents" />
          <StatCard title="Quizzes" value={stats.quizzes} icon={Activity} href="/quiz" />
          <StatCard title="Flashcards" value={stats.flashcards} icon={GraduationCap} href="/flashcards" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming tasks</CardTitle>
                <CardDescription>Pending study tasks across your courses.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTasks.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle className="mx-auto h-8 w-8 opacity-50 mb-2" />
                    <p>No pending tasks. Create one in the planner.</p>
                    <Button asChild size="sm" className="mt-3">
                      <Link href="/planner">Create task</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recentTasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-input bg-background">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.title}</p>
                          {t.course?.title && (
                            <p className="text-xs text-muted-foreground">{t.course.title}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t.dueDate ? formatDate(t.dueDate) : "No due date"}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {t.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Get started with your study tools.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction href="/documents" icon={FileText} title="Upload a document" desc="Add PDF, DOCX, or TXT materials" />
                <QuickAction href="/reviewer" icon={GraduationCap} title="Generate a reviewer" desc="Create a study reviewer from your notes" />
                <QuickAction href="/quiz" icon={Activity} title="Take a quiz" desc="Test your knowledge" />
                <QuickAction href="/planner" icon={Clock} title="Plan a session" desc="Schedule your study time" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, href }: { title: string; value: number; icon: any; href: string }) {
  return (
    <Link href={href} className="flex flex-col gap-2 p-4 rounded-xl border border-input bg-background text-foreground hover:bg-accent transition-colors block">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ href, icon: Icon, title, desc }: { href: string; icon: any; title: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-input bg-background p-4 text-foreground hover:bg-accent transition-colors block">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
