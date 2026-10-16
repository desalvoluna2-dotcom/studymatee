import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { quizSchema, questionSchema } from "@/lib/validation";
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

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`quiz:get:${ip}`, { limit: 120, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const quizzes = await prisma.quiz.findMany({
      where: { OR: [{ createdById: user.id }, { isPublished: true }] },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quizzes);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`quiz:post:${ip}`, { limit: 30, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const quiz = await prisma.quiz.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        courseId: parsed.data.courseId,
        subjectId: parsed.data.subjectId || null,
        topicId: parsed.data.topicId || null,
        questionCount: parsed.data.questionCount,
        difficulty: parsed.data.difficulty,
        timeLimitMinutes: parsed.data.timeLimitMinutes || null,
        randomizeOrder: parsed.data.randomizeOrder,
        createdById: user.id,
      },
    });
    return NextResponse.json(quiz, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
