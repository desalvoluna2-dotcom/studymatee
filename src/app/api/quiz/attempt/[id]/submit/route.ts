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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: attemptId } = await params;
    const body = await request.json();
    const { answers, timeSpentSeconds } = body as {
      answers: { questionId: string; answerText: string }[];
      timeSpentSeconds?: number;
    };

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: { include: { questions: true } } },
    });
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    if (attempt.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (attempt.submittedAt) {
      // Return existing result without re-scoring
      const existingAnswers = await prisma.quizAnswer.findMany({
        where: { attemptId },
        include: { question: true },
      });
      const score = attempt.score ?? 0;
      const totalPoints = attempt.totalPoints ?? 0;
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      return NextResponse.json({
        attempt,
        score,
        totalPoints,
        percentage,
        results: existingAnswers.map((a) => ({
          questionId: a.questionId,
          answerText: a.answerText,
          isCorrect: a.isCorrect,
          pointsEarned: a.pointsEarned,
          correctAnswer: a.question.correctAnswer,
          explanation: a.question.explanation,
        })),
      });
    }

    const questionMap = new Map(attempt.quiz.questions.map((q) => [q.id, q]));

    let score = 0;
    const results: any[] = [];

    for (const ans of answers) {
      const question = questionMap.get(ans.questionId);
      if (!question) continue;
      let isCorrect = false;
      switch (question.type) {
        case "MULTIPLE_CHOICE":
        case "TRUE_FALSE":
        case "IDENTIFICATION":
        case "FILL_IN_BLANK":
          isCorrect = ans.answerText.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          break;
        case "SHORT_ANSWER":
          isCorrect = ans.answerText.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          break;
      }
      if (isCorrect) score += question.points;
      results.push({
        questionId: question.id,
        answerText: ans.answerText,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    }

    const percentage = (attempt.totalPoints ?? 0) > 0 ? (score / (attempt.totalPoints ?? 0)) * 100 : 0;

    const updated = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        submittedAt: new Date(),
        timeSpentSeconds,
      },
    });

    // Save answers
    for (const r of results) {
      await prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId: r.questionId,
          answerText: r.answerText,
          isCorrect: r.isCorrect,
          pointsEarned: r.pointsEarned,
        },
      });
    }

    return NextResponse.json({
      attempt: updated,
      score,
      totalPoints: attempt.totalPoints,
      percentage,
      results,
    });
  } catch (err) {
    return handleError(err);
  }
}
