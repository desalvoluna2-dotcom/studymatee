"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, Plus, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  course?: { title: string } | null;
  questionCount: number;
  difficulty: string;
  timeLimitMinutes: number | null;
  isPublished: boolean;
  createdAt: string;
  _count: { questions: number; attempts: number };
}

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    questionCount: 10,
    difficulty: "MEDIUM" as const,
    timeLimitMinutes: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/quiz", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load quizzes");
      setQuizzes(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }

  async function createQuiz(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          timeLimitMinutes: form.timeLimitMinutes ? Number(form.timeLimitMinutes) : null,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create quiz");
      setOpen(false);
      setForm({ title: "", description: "", courseId: "", questionCount: 10, difficulty: "MEDIUM", timeLimitMinutes: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create quiz");
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
          <h1 className="text-2xl font-bold text-foreground">Quiz &amp; Exam Center</h1>
          <p className="text-muted-foreground">Create and take timed quizzes. Scores are calculated on the server.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create quiz
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {quizzes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Activity className="h-12 w-12 opacity-50 mb-2" />
            <h3 className="font-medium text-foreground">No quizzes yet</h3>
            <p className="text-sm">Create your first quiz to get started.</p>
            <Button onClick={() => setOpen(true)} className="mt-4">Create quiz</Button>
          </div>
        ) : (
          quizzes.map((q) => (
            <Card key={q.id} className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <>
                    <h3 className="text-sm font-semibold line-clamp-1 text-foreground">{q.title}</h3>
                    <ShieldAlert className="h-4 w-4 text-primary" />
                  </>
                </div>
                <p className="text-xs text-muted-foreground">{q.course?.title || "General"}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                  <Badge variant="secondary" className="text-xs">{q.questionCount} questions</Badge>
                  {q.timeLimitMinutes && <Badge variant="outline" className="text-xs">{q.timeLimitMinutes} min</Badge>}
                </div>
                {q.description && <p className="text-xs text-muted-foreground line-clamp-2">{q.description}</p>}
              </CardContent>
              <CardFooter>
                <Link href={`/quiz/${q.id}`} className="text-xs text-primary underline flex items-center gap-1">
                  Open <span>→</span>
                </Link>
              </CardFooter>
            </Card>
          )
        ))}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden={!open ? "true" : "false"}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-background rounded-xl border border-input p-6 shadow-lg w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create quiz</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <form onSubmit={createQuiz} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q-title">Quiz title</Label>
              <Input id="q-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-desc">Description</Label>
              <Input id="q-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-course">Course (optional)</Label>
              <Input id="q-course" placeholder="Course name" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q-count">Question count</Label>
                <Input id="q-count" type="number" min="1" max="50" value={String(form.questionCount)} onChange={(e) => setForm({ ...form, questionCount: Number(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-diff">Difficulty</Label>
                <select id="q-diff" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-time">Time limit (minutes, optional)</Label>
              <Input id="q-time" type="number" min="1" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })} />
              <p className="text-xs text-muted-foreground">Leave empty for untimed</p>
            </div>
            <Button type="submit" className="w-full">Create quiz</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
