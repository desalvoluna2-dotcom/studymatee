import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { flashcardSchema } from "@/lib/validation";
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
    const deck = await prisma.flashcardDeck.findUnique({
      where: { id },
      include: {
        cards: { orderBy: { createdAt: "asc" } },
        course: { select: { id: true, title: true } },
      },
    });
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    if (deck.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(deck);
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
    const { id: deckId } = await params;
    const deck = await prisma.flashcardDeck.findUnique({ where: { id: deckId } });
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    if (deck.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const parsed = flashcardSchema.safeParse({ ...body, deckId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const card = await prisma.flashcard.create({
      data: {
        deckId,
        front: parsed.data.front,
        back: parsed.data.back,
        dueDate: new Date(),
      },
    });
    await prisma.flashcardDeck.update({
      where: { id: deckId },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
