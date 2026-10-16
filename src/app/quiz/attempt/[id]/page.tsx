"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, Clock, ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  points: number;
  order: number;
}

export default function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const id = (() => { throw new Error("use params in body"); })();

  useEffect(() => {
    (async () => {
      const { id } = await params;
      try {
        const res = await fetch(`/api/quiz/attempt/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load attempt");
        const data = await res.json();
        setAttempt(data.attempt);
        setQuestions(data.questions);
        if (data.attempt.quiz.timeLimitMinutes) {
          setTimeLeft(data.attempt.quiz.timeLimitMinutes * 60);
        }
        if (data.attempt.submittedAt) {
          // Already submitted; fetch result
          const subRes = await fetch(`/api/quiz/attempt/${id}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: [] }),
            credentials: "include",
          });
          if (subRes.ok) {
            const result = await subRes.json();
            setResult(result);
            setSubmitted(true);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // This component is also reached directly after start; refetch not needed.
  // We rely on attempt/questions set above.

  const timer = useCallback(() => {
    if (timeLeft && timeLeft > 0) setTimeLeft((t) => (t || 0) - 1);
  }, [timeLeft]);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    const iv = setInterval(timer, 1000);
    return () => clearInterval(iv);
  }, [timeLeft, timer]);

  function handleChange(qid: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  async function submitQuiz() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/attempt/${(await params).id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answerText]) => ({ questionId, answerText })),
          timeSpentSeconds: null,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Starting quiz…</p>
      </div>
    );
  }
  if (!attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Unable to load quiz.</p>
      </div>
    );
  }

  if (submitted && result) {
    const percentage = result.totalPoints > 0 ? (result.score / result.totalPoints) * 100 : 0;
    const passed = percentage >= 60;
    return (
      <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className={`flex justify-center mb-3`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                  passed ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"
                }`}>
                  {passed ? <CheckCircle className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                </div>
              </div>
              <CardTitle>{attempt.quiz.title}</CardTitle>
              <CardDescription>Quiz results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold">{passed ? "Passed" : "Not passed"}</div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Score: {result.score} / {result.totalPoints}</span>
                <span>•</span>
                <span>{percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div className={`bg-${passed ? "green" : "destructive"} h-4 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
              </div>
              {result.timeSpentSeconds != null && (
                <p className="text-xs text-muted-foreground">
                  Time spent: {Math.round(result.timeSpentSeconds / 60)} min
                </p>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} className="flex-1">Retake</Button>
                <Link href="/quiz" className="flex-1 flex items-center justify-center">
                  <button className="w-full py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors">Back to quizzes</button>
                </Link>
              </div>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Review your answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.results.map((r: any) => (
                <div key={r.questionId} className="p-3 rounded-lg border border-input bg-background">
                  <p className="text-sm font-medium text-foreground">{r.questionId.slice(-4)}. {r.correctAnswer ? "" : ""}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium ${r.isCorrect ? "text-green-700" : "text-destructive"}`}>
                      {r.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                    <Badge variant="outline" className="text-xs">+{r.pointsEarned} pt</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Your answer: {r.answerText || "(no answer)"}</p>
                  {!r.isCorrect && r.explanation && (
                    <p className="text-sm text-muted-foreground mt-1">Explanation: {r.explanation}</p>
                  )}
                  {!r.isCorrect && <p className="text-sm text-muted-foreground mt-1">Correct answer: {r.correctAnswer}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{attempt.quiz.title}</h1>
          <p className="text-muted-foreground">
            {attempt.quiz.course?.title || "General"} · {attempt.quiz.difficulty}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft != null && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-input bg-background text-sm font-mono text-destructive">
              <Clock className="h-3 w-3" /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Server-scored</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submitQuiz(); }} className="space-y-4 max-w-2xl">
        {questions.map((q) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">{q.order + 1}. {q.question}</CardTitle>
              <Badge variant="outline" className="text-xs">{q.type} · {q.points} pt</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.type === "MULTIPLE_CHOICE" && q.options ? (
                q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-3 p-3 rounded-lg border border-input hover:bg-accent cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    {opt}
                  </label>
                ))
              ) : q.type === "TRUE_FALSE" ? (
                <div className="flex gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-input hover:bg-accent cursor-pointer transition-colors flex-1">
                    <input
                      type="radio"
                      name={q.id}
                      value="True"
                      checked={answers[q.id] === "True"}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    True
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-input hover:bg-accent cursor-pointer transition-colors flex-1">
                    <input
                      type="radio"
                      name={q.id}
                      value="False"
                      checked={answers[q.id] === "False"}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    False
                  </label>
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    placeholder="Type your answer…"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={submitting} className="flex items-center gap-2">
            {submitting ? (
              <>
                <ShieldAlert className="h-3 w-3 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <ShieldAlert className="h-3 w-3" /> Submit quiz
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
