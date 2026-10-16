import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { subjectSchema } from "@/lib/validation";
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
  if (!rateLimit(`subjects:get:${ip}`, { limit: 120, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const subjects = await prisma.subject.findMany({
      where: courseId ? { courseId } : {},
      include: {
        course: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true } },
        _count: { select: { studyMaterials: true, quizzes: true, flashcardDecks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subjects);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`subjects:post:${ip}`, { limit: 30, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = subjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const subject = await prisma.subject.create({
      data: {
        title: parsed.data.title,
        code: parsed.data.code || null,
        description: parsed.data.description || null,
        courseId: parsed.data.courseId,
        ownerId: user.id,
      },
      include: { course: { select: { id: true, title: true } } },
    });
    return NextResponse.json(subject, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
