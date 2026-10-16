import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, FileText, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  let course;
  try {
    course = await prisma.course.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        subjects: { orderBy: { title: "asc" } },
        studyMaterials: { orderBy: { createdAt: "desc" } },
        _count: { select: { subjects: true, studyMaterials: true, enrollments: true } },
      },
    });
  } catch {
    course = null;
  }

  if (!course) return notFound();

  const canManage = course.ownerId === user.id || user.role === "ADMIN" || user.role === "TEACHER";

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground">
            {course.category} {course.code ? `· ${course.code}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => (window.location.href = "/courses")}>
            <Settings className="h-4 w-4 mr-1" /> Back
          </Button>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => (document.getElementById("add-subject")?.scrollIntoView())}>
              <Plus className="h-4 w-4 mr-1" /> Add subject
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Course info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{course.description || "No description."}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner</span>
              <span className="text-sm">{course.owner.name || course.owner.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</span>
              <span className="text-sm">{formatDate(course.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subjects</span>
              <span className="text-sm font-medium">{course._count.subjects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Materials</span>
              <span className="text-sm font-medium">{course._count.studyMaterials}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Enrollments</span>
              <span className="text-sm font-medium">{course._count.enrollments}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <section id="add-subject" className="mb-8">
        <Card className="hidden md:block">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Subjects</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Search subjects…" className="w-64" />
              {canManage && (
                <Button size="sm" onClick={() => (document.getElementById("new-subject-title")?.focus())}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {course.subjects.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">No subjects yet. Add your first subject.</p>
            ) : (
              <ul className="space-y-2">
                {course.subjects.map((s) => (
                  <li key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-input bg-background hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        {s.code && <span className="text-xs text-muted-foreground">{s.code}</span>}
                      </div>
                    </div>
                    <Link href={`/subjects/${s.id}`} className="text-xs text-primary underline">
                      Open →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {canManage && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add new subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action=""
              className="grid gap-4 sm:grid-cols-3 items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const courseId = id;
                const title = formData.get("title") as string;
                const code = (formData.get("code") as string) || undefined;
                const description = (formData.get("description") as string) || undefined;
                try {
                  const res = await fetch("/api/subjects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ courseId, title, code, description }),
                  });
                  if (!res.ok) throw new Error("Failed to create subject");
                  window.location.reload();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to create subject");
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="new-subject-title">Subject title</Label>
                <Input id="new-subject-title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-subject-code">Code (optional)</Label>
                <Input id="new-subject-code" name="code" placeholder="e.g. MATH101" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-subject-description">Description</Label>
                <Input id="new-subject-description" name="description" />
              </div>
              <Button type="submit">Add subject</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Materials</h2>
          <Link href="/documents" className="text-sm text-primary underline">
            Upload center →
          </Link>
        </div>
        {course.studyMaterials.length === 0 ? (
          <p className="text-muted-foreground">No materials uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {course.studyMaterials.map((m) => (
              <li key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-input bg-background hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <span className="text-xs text-muted-foreground">{m.originalName}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
