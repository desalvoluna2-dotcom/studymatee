"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, Plus, Trash2, Save, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  points: number;
  order: number;
}

export default function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [qForm, setQForm] = useState({
    type: "MULTIPLE_CHOICE" as const,
    question: "",
    options: "",
    correctAnswer: "",
    explanation: "",
    points: 1,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [qRes, qsRes] = await Promise.all([
        fetch(`/api/quiz/${(await params).id}`, { credentials: "include" }),
        fetch(`/api/quiz/${(await params).id}/questions`, { credentials: "include" }),
      ]);
      if (qRes.ok) setQuiz(await qRes.json());
      if (qsRes.ok) setQuestions(await qsRes.json());
    } catch (err: any) {
      setError(err.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    try {
      const options = qForm.options.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/quiz/${(await params).id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...qForm,
          options,
          points: Number(qForm.points) || 1,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add question");
      setQForm({ type: "MULTIPLE_CHOICE", question: "", options: "", correctAnswer: "", explanation: "", points: 1 });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to add question");
    }
  }

  async function deleteQuestion(qid: string) {
    if (!confirm("Delete this question?")) return;
    try {
      const res = await fetch(`/api/quiz/${(await params).id}/questions/${qid}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      load();
    } catch (err: any) {
      setError(err.message || "Failed to delete question");
    }
  }

  async function takeQuiz() {
    try {
      const res = await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start attempt");
      const data = await res.json();
      window.location.href = `/quiz/attempt/${data.attempt.id}`;
    } catch (err: any) {
      setError(err.message || "Failed to start quiz");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
          <p className="text-muted-foreground">{quiz.description || "No description."}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quiz" className="text-sm text-primary underline">← Back</Link>
          <Button onClick={takeQuiz} className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Take quiz
          </Button>
        </div>
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
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Questions</CardTitle>
              {adding ? null : (
                <Button size="sm" onClick={() => setAdding(true)} className="flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {questions.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">No questions yet. Add your first question.</p>
              ) : (
                <div className="space-y-2">
                  {questions.map((q) => (
                    <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border border-input bg-background">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{q.order + 1}. {q.question}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.type} · {q.points} pt
                          {q.options ? ` · ${q.options.length} options` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{q.type}</Badge>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {adding && (
                <form onSubmit={addQuestion} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="nq-type">Type</Label>
                    <select id="nq-type" value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value as any })} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="MULTIPLE_CHOICE">Multiple choice</option>
                      <option value="TRUE_FALSE">True or false</option>
                      <option value="IDENTIFICATION">Identification</option>
                      <option value="FILL_IN_BLANK">Fill in the blank</option>
                      <option value="SHORT_ANSWER">Short answer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nq-question">Question</Label>
                    <Input id="nq-question" value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} required />
                  </div>
                  {qForm.type === "MULTIPLE_CHOICE" && (
                    <div className="space-y-2">
                      <Label htmlFor="nq-options">Options (comma-separated)</Label>
                      <Input id="nq-options" placeholder="Option A, Option B, Option C" value={qForm.options} onChange={(e) => setQForm({ ...qForm, options: e.target.value })} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="nq-answer">Correct answer</Label>
                    <Input id="nq-answer" value={qForm.correctAnswer} onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nq-explanation">Explanation (optional)</Label>
                    <Textarea id="nq-explanation" value={qForm.explanation} onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nq-points">Points</Label>
                    <Input id="nq-points" type="number" min="1" value={String(qForm.points)} onChange={(e) => setQForm({ ...qForm, points: Number(e.target.value) || 1 })} />
                  </div>
                  <Button type="submit" className="w-full flex items-center justify-center gap-1">
                    <Save className="h-3 w-3" /> Add question
                  </Button>
                  <button type="button" onClick={() => setAdding(false)} className="w-full text-sm text-muted-foreground hover:bg-accent py-2 rounded-lg transition-colors">
                    Cancel
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Quiz settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">{quiz.difficulty}</Badge>
                <Badge variant="secondary" className="text-xs">{quiz.questionCount} questions</Badge>
                {quiz.timeLimitMinutes && <Badge variant="outline" className="text-xs">{quiz.timeLimitMinutes} min timed</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{quiz._count.attempts} attempts total</p>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = `/quiz/attempt/new?quiz=${quiz.id}`)} className="w-full">
                <Activity className="h-3 w-3 mr-1" /> Take this quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
