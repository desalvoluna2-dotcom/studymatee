"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  category: string;
  ownerId: string;
  createdAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", description: "", category: "Information Technology" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/courses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load courses");
      setCourses(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    "Information Technology",
    "Computer Science",
    "Engineering",
    "Business Administration",
    "Accountancy",
    "Education",
    "Nursing and allied health",
    "Criminology",
    "Psychology",
    "Hospitality Management",
    "Tourism",
    "Communication",
    "Political Science",
    "Arts and Humanities",
    "General Education",
    "Other",
  ];

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code: form.code || undefined, description: form.description || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create course");
      setOpen(false);
      setForm({ code: "", title: "", description: "", category: categories[0] });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground">Organize your subjects and materials by course.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add course
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {courses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 opacity-50 mb-2" />
            <h3 className="font-medium text-foreground">No courses yet</h3>
            <p className="text-sm">Add your first course to get started.</p>
            <Button onClick={() => setOpen(true)} className="mt-4">
              Add course
            </Button>
          </div>
        ) : (
          courses.map((c) => (
            <Card key={c.id} className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                {c.code && (
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{c.code}</span>
                )}
              </CardHeader>
              {c.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 px-4">{c.description}</p>
              )}
              <CardFooter>
                <Link href={`/courses/${c.id}`} className="text-sm text-primary underline">
                  Open course →
                </Link>
              </CardFooter>
            </Card>
          )
        ))}
      </div>

      {/* Create course dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden={!open ? "true" : "false"}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-background rounded-xl border border-input p-6 shadow-lg w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create course</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
          <form onSubmit={createCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Course code (optional)</Label>
              <Input id="code" placeholder="e.g. CS101" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full">Create course</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
