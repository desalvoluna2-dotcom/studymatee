"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GraduationCap, FileText, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Reviewer {
  id: string;
  title: string;
  course?: { title: string } | null;
  subject?: { title: string } | null;
  format: string;
  difficulty: string;
  language: string;
  sourceGrounded: boolean;
  aiProvider: string;
  createdAt: string;
  content: any;
}

interface Material {
  id: string;
  title: string;
  originalName: string;
}

export default function ReviewerPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    courseId: "",
    subjectId: "",
    topicId: "",
    materialId: "",
    title: "",
    format: "STANDARD" as const,
    difficulty: "MEDIUM" as const,
    language: "en",
  });

  useEffect(() => {
    Promise.all([loadMaterials(), loadReviewers()]).finally(() => setLoading(false));
  }, []);

  async function loadMaterials() {
    try {
      const res = await fetch("/api/documents", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMaterials(data);
    } catch {}
  }

  async function loadReviewers() {
    try {
      const res = await fetch("/api/reviewer", { credentials: "include" });
      if (!res.ok) return;
      setReviewers(await res.json());
    } catch {}
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/reviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setReviewers([data.reviewer, ...reviewers]);
      setForm({ ...form, title: "" });
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setGenerating(false);
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
          <h1 className="text-2xl font-bold text-foreground">Reviewer Generator</h1>
          <p className="text-muted-foreground">Create a structured study reviewer from your uploaded materials.</p>
        </div>
        <Link href="/documents" className="text-sm text-primary underline">
          <FileText className="h-4 w-4 mr-1" /> Upload center
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Generate new reviewer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={generate}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Reviewer title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="courseId">Course</Label>
                      <Select.Root value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                        <SelectTrigger id="courseId">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {materials.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select.Root>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="format">Format</Label>
                      <Select.Root value={form.format} onValueChange={(v) => setForm({ ...form, format: v as any })}>
                        <SelectTrigger id="format">
                          <SelectValue placeholder={form.format} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONCISE">Concise</SelectItem>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="DETAILED">Detailed</SelectItem>
                        </SelectContent>
                      </Select.Root>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select.Root value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as any })}>
                        <SelectTrigger id="difficulty">
                          <SelectValue placeholder={form.difficulty} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select.Root>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select.Root value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder={form.language} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fil">Filipino</SelectItem>
                        </SelectContent>
                      </Select.Root>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="materialId">Source material (optional)</Label>
                    <Select.Root value={form.materialId} onValueChange={(v) => setForm({ ...form, materialId: v })}>
                      <SelectTrigger id="materialId">
                        <SelectValue placeholder="No source material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None — deterministic fallback</SelectItem>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.originalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select.Root>
                  </div>
                  <Button type="submit" className="w-full" disabled={generating}>
                    {generating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Generating…
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-4 w-4 mr-2" /> Generate reviewer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>About AI generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                When an AI provider is configured, reviewers are generated from your
                source material. Otherwise, a deterministic fallback creates a basic
                summary from extracted text.
              </p>
              <Badge variant="outline" className="text-xs">Fallback mode</Badge>
              <p className="mt-2">
                Generated content may contain errors. Always verify against your
                course materials.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Your reviewers</h2>
        {reviewers.length === 0 ? (
          <p className="text-muted-foreground">No reviewers yet. Generate your first one above.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {reviewers.map((r) => (
              <Card key={r.id} className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold line-clamp-1 text-foreground">{r.title}</h3>
                    <Badge variant="outline" className="text-xs">{r.aiProvider}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.course?.title || "General"}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">{r.format}</Badge>
                    <Badge variant="outline" className="text-xs">{r.difficulty}</Badge>
                    <Badge variant={r.sourceGrounded ? "secondary" : "outline"} className="text-xs">
                      {r.sourceGrounded ? "Source-grounded" : "Fallback"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                </CardContent>
                <CardFooter>
                  <Link href={`/reviewer/${r.id}`} className="text-xs text-primary underline flex items-center gap-1">
                    View <span>→</span>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

