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

// Simple SM-2-ish spaced repetition update
function updateCard(card: any, quality: number) {
  let { easeFactor, interval, repetitions } = card;
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  return { easeFactor, interval, repetitions, dueDate, lastReviewed: new Date() };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const card = await prisma.flashcard.findUnique({
      where: { id },
      include: { deck: true },
    });
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    if (card.deck.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { front, back } = body as { front?: string; back?: string };
    const updated = await prisma.flashcard.update({
      where: { id },
      data: { front: front ?? card.front, back: back ?? card.back },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const card = await prisma.flashcard.findUnique({
      where: { id },
      include: { deck: true },
    });
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    if (card.deck.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.flashcard.delete({ where: { id } });
    await prisma.flashcardDeck.update({
      where: { id: card.deckId },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Record a review for a card: /api/flashcards/cards/[id]/review
  try {
    const user = await requireAuth();
    const { id } = await params;
    const card = await prisma.flashcard.findUnique({
      where: { id },
      include: { deck: true },
    });
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    if (card.deck.ownerId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { quality } = body as { quality?: number };
    const q = Math.min(5, Math.max(0, Number(quality) || 3));
    const updated = updateCard(card, q);
    const saved = await prisma.flashcard.update({
      where: { id },
      data: {
        easeFactor: updated.easeFactor,
        interval: updated.interval,
        repetitions: updated.repetitions,
        dueDate: updated.dueDate,
        lastReviewed: updated.lastReviewed,
      },
    });
    return NextResponse.json(saved);
  } catch (err) {
    return handleError(err);
  }
}
