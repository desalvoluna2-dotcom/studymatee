import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, GraduationCap, BookOpen, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function ProgressPage() {
  let user;
  try {
    user = await getSession();
  } catch {
    user = null;
  }
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Please <Link href="/login" className="underline">sign in</Link>.</p>
      </div>
    );
  }

  let stats = { attempts: 0, avgScore: 0, flashcards: 0, materials: 0, streak: 0 };
  let recentAttempts: any[] = [];

  try {
    const [attempts, avg, flashcardCount, materialCount] = await Promise.all([
      prisma.quizAttempt.count({ where: { userId: user.id } }),
      prisma.quizAttempt.aggregate({
        where: { userId: user.id, score: { not: null } },
        _avg: { score: true },
        _sum: { totalPoints: true },
      }),
      prisma.flashcard.count({ where: { deck: { ownerId: user.id } } }),
      prisma.studyMaterial.count({ where: { uploadedById: user.id } }),
    ]);
    const total = await prisma.quizAttempt.aggregate({
      where: { userId: user.id },
      _sum: { totalPoints: true },
    });
    stats = {
      attempts,
      avgScore: (total._sum.totalPoints ?? 0) > 0 ? Math.round((avg._avg.score ?? 0) / ((total._sum.totalPoints ?? 0) / attempts) * 100) : 0,
      flashcards: flashcardCount,
      materials: materialCount,
      streak: 0,
    };
    recentAttempts = await prisma.quizAttempt.findMany({
      where: { userId: user.id, submittedAt: { not: null } },
      include: { quiz: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    });
  } catch {
    // DB not configured
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Progress &amp; analytics</h1>
        <p className="text-muted-foreground">Track your study performance over time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Quizzes taken" value={stats.attempts} icon={Activity} />
        <StatCard title="Average score" value={stats.avgScore} suffix="%" icon={TrendingUp} />
        <StatCard title="Flashcards" value={stats.flashcards} icon={BookOpen} />
        <StatCard title="Materials" value={stats.materials} icon={GraduationCap} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttempts.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No quiz attempts yet.</p>
            ) : (
              <div className="space-y-3">
                {recentAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-input bg-background">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.quiz.title}</p>
                      <p className="text-xs text-muted-foreground">{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {a.score != null ? a.score : "-"} / {a.totalPoints ?? "-"}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {a.score != null && a.totalPoints ? Math.round((a.score / a.totalPoints) * 100) + "%" : "-"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, suffix, icon: Icon }: { title: string; value: number; suffix?: string; icon: any }) {
  return (
    <Card className="hover:bg-accent transition-colors">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}{suffix}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
    </Card>
  );
}
