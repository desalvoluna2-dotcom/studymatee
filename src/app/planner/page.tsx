"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, Plus, Clock, CheckCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  course?: { title: string } | null;
  dueDate: string | null;
  status: string;
  estimatedMinutes: number | null;
  createdAt: string;
}

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    status: "PENDING" as const,
    estimatedMinutes: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/planner", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tasks");
      setTasks(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dueDate: form.dueDate || undefined, estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      setOpen(false);
      setForm({ title: "", description: "", courseId: "", dueDate: "", status: "PENDING", estimatedMinutes: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    }
  }

  async function toggleTask(id: string, status: string) {
    try {
      await fetch(`/api/planner/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "COMPLETED" ? "PENDING" : "COMPLETED" }),
        credentials: "include",
      });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to update task");
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/planner/${id}`, { method: "DELETE", credentials: "include" });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const pending = tasks.filter((t) => t.status !== "COMPLETED");
  const completed = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Planner</h1>
          <p className="text-muted-foreground">Organize your study sessions, deadlines, and goals.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Today</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold">{pending.length}</div>
              <p className="text-sm text-muted-foreground">pending tasks</p>
              <div className="text-3xl font-bold mt-2">{completed.length}</div>
              <p className="text-sm text-muted-foreground">completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => load()}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No tasks yet. Add your first study task.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-input bg-background hover:bg-accent transition-colors group">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleTask(t.id, t.status)}
                          className="rounded-full border p-1 text-muted-foreground hover:text-green-700 focus:outline-none"
                          aria-label="Toggle completion"
                        >
                          {t.status === "COMPLETED" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <span className="block h-4 w-4 rounded-full border border-input" />}
                        </button>
                        <div>
                          <p className={`text-sm ${t.status === "COMPLETED" ? "line-through text-muted-foreground" : "font-medium text-foreground"}`}>
                            {t.title}
                          </p>
                          {t.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" /> {formatDate(t.dueDate)}
                            </p>
                          )}
                          {t.course?.title && (
                            <p className="text-xs text-muted-foreground">{t.course.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={t.status === "COMPLETED" ? "secondary" : "outline"} className="text-xs">
                          {t.status}
                        </Badge>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete task"
                        >
                          <span className="h-3 w-3">✕</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden={!open ? "true" : "false"}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-background rounded-xl border border-input p-6 shadow-lg w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New study task</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <form onSubmit={createTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task title</Label>
              <Input id="task-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea id="task-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-est">Estimated minutes</Label>
              <Input id="task-est" type="number" min="1" value={form.estimatedMinutes} onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <select id="task-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <Button type="submit" className="w-full">Create task</Button>
          </form>
        </div>
      </div>
    </div>
  );
}

