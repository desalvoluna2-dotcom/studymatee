import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { flashcardDeckSchema, flashcardSchema } from "@/lib/validation";
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
  if (!rateLimit(`flashcards:get:${ip}`, { limit: 120, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const decks = await prisma.flashcardDeck.findMany({
      where: { ownerId: user.id },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(decks);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`flashcards:post:${ip}`, { limit: 30, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = flashcardDeckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const deck = await prisma.flashcardDeck.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        courseId: parsed.data.courseId,
        subjectId: parsed.data.subjectId || null,
        topicId: parsed.data.topicId || null,
        ownerId: user.id,
      },
    });
    return NextResponse.json(deck, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
