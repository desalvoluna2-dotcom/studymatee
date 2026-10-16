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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const user = await requireAuth();
    const { qid } = await params;
    const question = await prisma.question.findUnique({
      where: { id: qid },
      include: { quiz: true },
    });
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    if (question.quiz.createdById !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.question.delete({ where: { id: qid } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
