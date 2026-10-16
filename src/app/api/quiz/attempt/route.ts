import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { quizAttemptSchema } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";


async function handleError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`attempt:post:${ip}`, { limit: 60, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = quizAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: parsed.data.quizId },
      include: { questions: true },
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        totalPoints,
      },
      include: { quiz: { select: { id: true, title: true, timeLimitMinutes: true, randomizeOrder: true } } },
    });

    // Return questions without correct answers for the client
    let questions = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      points: q.points,
      order: q.order,
    }));
    if (quiz.randomizeOrder) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({ attempt, questions }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
