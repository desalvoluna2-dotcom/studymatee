import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";


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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            questions: true,
            course: { select: { title: true } },
          },
        },
      },
    });
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let questions = attempt.quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      points: q.points,
      order: q.order,
    }));
    if (attempt.quiz.randomizeOrder) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        submittedAt: attempt.submittedAt,
        startedAt: attempt.startedAt,
        timeSpentSeconds: attempt.timeSpentSeconds,
        quiz: {
          id: attempt.quiz.id,
          title: attempt.quiz.title,
          difficulty: attempt.quiz.difficulty,
          timeLimitMinutes: attempt.quiz.timeLimitMinutes,
          course: attempt.quiz.course,
        },
      },
      questions,
    });
  } catch (err) {
    return handleError(err);
  }
}
