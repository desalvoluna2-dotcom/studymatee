import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { questionSchema } from "@/lib/validation";
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
    await requireAuth();
    const { id } = await params;
    const questions = await prisma.question.findMany({
      where: { quizId: id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(questions);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: quizId } = await params;
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    if (quiz.createdById !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const parsed = questionSchema.safeParse({ ...body, quizId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const question = await prisma.question.create({
      data: {
        quizId,
        type: parsed.data.type,
        question: parsed.data.question,
        options: (parsed.data.options || null) as unknown as any,
        correctAnswer: parsed.data.correctAnswer,
        explanation: parsed.data.explanation || null,
        points: parsed.data.points,
        order: parsed.data.order,
      },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
