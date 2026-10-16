import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { GraduationCap, AlertTriangle, Copy } from "lucide-react";

export default async function ReviewerDetailPage({
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

  let reviewer;
  try {
    reviewer = await prisma.reviewer.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        subject: { select: { id: true, title: true } },
        material: { select: { id: true, title: true, originalName: true } },
      },
    });
  } catch {
    reviewer = null;
  }

  if (!reviewer) return notFound();
  if (reviewer.generatedById !== user.id && user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Forbidden</p>
      </div>
    );
  }

  const content: any = reviewer.content || {};

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{reviewer.title}</h1>
          <p className="text-muted-foreground">
            {reviewer.course?.title || "General course"} · {reviewer.format} · {reviewer.difficulty}
          </p>
        </div>
        <Link href="/reviewer" className="text-sm text-primary underline">
          ← Back to reviewers
        </Link>
      </div>

      {!reviewer.sourceGrounded && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Generated without an AI provider or source material. This is a deterministic summary—verify all content against your course materials.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm text-muted-foreground max-w-none">
              {typeof content.overview === "string" ? content.overview : Array.isArray(content.overview) ? content.overview.join(" ") : "No overview available."}
            </div>
          </CardContent>
        </Card>

        {content.definitions && content.definitions.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Key definitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.definitions.map((d: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-input bg-background">
                  <p className="text-sm font-semibold text-foreground">{d.term}</p>
                  <p className="text-sm text-muted-foreground">{d.definition}</p>
                  {d.unverified && (
                    <span className="text-xs text-muted-foreground mt-1 block">⚠ Not verified from source</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {content.concepts && content.concepts.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Important concepts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.concepts.map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-input bg-background">
                  <p className="text-sm font-semibold text-foreground">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {content.explanations && content.explanations.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Explanations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.explanations.map((e: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-input bg-background">
                  <p className="text-sm text-foreground">{typeof e === "string" ? e : e.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {content.practiceQuestions && content.practiceQuestions.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Practice questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.practiceQuestions.map((q: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-input bg-background">
                  <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                  {q.answer && (
                    <p className="text-sm text-muted-foreground mt-1">Answer: {q.answer}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {content.summary && content.summary.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Summary &amp; key takeaways</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {content.summary.map((s: any, i: number) => (
                <p key={i} className="text-sm text-foreground">• {typeof s === "string" ? s : s.text || s}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <span className="text-xs text-muted-foreground">Generated by: {reviewer.aiProvider}</span>
        {reviewer.sourceGrounded ? (
          <span className="text-xs text-muted-foreground">Grounded in source material</span>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Copy className="h-3 w-3 mr-1" /> Print
        </Button>
      </div>
    </div>
  );
}
