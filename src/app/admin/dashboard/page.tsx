import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldAlert, Activity, GraduationCap } from "lucide-react";

export default async function AdminDashboardPage() {
  let user;
  try {
    user = await getSession();
  } catch {
    user = null;
  }
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Administrator access required.</p>
      </div>
    );
  }

  let stats = { users: 0, courses: 0, quizzes: 0, attempts: 0 };
  let recentUsers: any[] = [];

  try {
    const [users, courses, quizzes, attempts, ru] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.quiz.count(),
      prisma.quizAttempt.count(),
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    stats = { users, courses, quizzes, attempts };
    recentUsers = ru;
  } catch {
    // DB not configured
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and user management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Users" value={stats.users} icon={Users} />
        <StatCard title="Courses" value={stats.courses} icon={GraduationCap} />
        <StatCard title="Quizzes" value={stats.quizzes} icon={Activity} />
        <StatCard title="Attempts" value={stats.attempts} icon={ShieldAlert} />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Recent users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-input">
                <th className="pb-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="pb-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="pb-3 text-xs font-medium text-muted-foreground">Role</th>
                <th className="pb-3 text-xs font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No users yet.</td></tr>
              ) : (
                recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-input">
                    <td className="py-3 text-sm">{u.name}</td>
                    <td className="py-3 text-sm text-muted-foreground">{u.email}</td>
                    <td className="py-3 text-sm">
                      <span className="px-2 py-1 rounded-full border border-input text-xs">{u.role}</span>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href="/dashboard">
          <Button className="w-full">Student dashboard</Button>
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
