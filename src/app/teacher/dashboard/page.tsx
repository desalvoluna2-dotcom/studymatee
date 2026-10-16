import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Activity, ShieldAlert, Users } from "lucide-react";

export default async function TeacherDashboardPage() {
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
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Teacher access required.</p>
      </div>
    );
  }

  let stats = { courses: 0, subjects: 0, quizzes: 0, materials: 0 };
  let recentCourses: any[] = [];

  try {
    const [courses, subjects, quizzes, materials, rc] = await Promise.all([
      prisma.course.count({ where: { ownerId: user.id } }),
      prisma.subject.count({ where: { ownerId: user.id } }),
      prisma.quiz.count({ where: { createdById: user.id } }),
      prisma.studyMaterial.count({ where: { uploadedById: user.id } }),
      prisma.course.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
    ]);
    stats = { courses, subjects, quizzes, materials };
    recentCourses = rc;
  } catch {
    // DB not configured
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses and materials.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Courses" value={stats.courses} icon={BookOpen} />
        <StatCard title="Subjects" value={stats.subjects} icon={GraduationCap} />
        <StatCard title="Quizzes" value={stats.quizzes} icon={Activity} />
        <StatCard title="Materials" value={stats.materials} icon={ShieldAlert} />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Your courses</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {recentCourses.length === 0 ? (
            <p className="text-muted-foreground">No courses yet. Create one in My Courses.</p>
          ) : (
            recentCourses.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle>{c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.category}</p>
                  <Link href={`/courses/${c.id}`} className="text-xs text-primary underline mt-2 inline-block">
                    Open →
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Link href="/courses" className="flex-1">
          <Button className="w-full">Browse courses</Button>
        </Link>
        <Link href="/documents">
          <Button className="w-full flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" /> Upload material
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: any }) {
  return (
    <Card className="hover:bg-accent transition-colors">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
    </Card>
  );
}
