"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, RefreshCw, Check, X, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CardItem {
  id: string;
  front: string;
  back: string;
  dueDate: string;
  interval: number;
  repetitions: number;
}

export default function FlashcardStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch(`/api/flashcards/decks/${(await params).id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load deck");
      const data = await res.json();
      setDeck(data.deck);
      setCards(data.cards);
    } catch (err: any) {
      setError(err.message || "Failed to load deck");
    } finally {
      setLoading(false);
    }
  }

  const current = cards[index];

  async function review(quality: number) {
    if (!current) return;
    try {
      const res = await fetch(`/api/flashcards/cards/${current.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record review");
      const updated = await res.json();
      setReviewed((prev) => ({ ...prev, [current.id]: true }));
      // Remove reviewed card from session; move to next
      setCards((prev) => prev.filter((c) => c.id !== current.id));
      setIndex((i) => (i >= cards.length - 1 ? 0 : i));
      setFlipped(false);
    } catch (err: any) {
      setError(err.message || "Failed to record review");
    }
  }

  function nextCard() {
    setFlipped(false);
    setIndex((i) => (i >= cards.length - 1 ? 0 : i + 1));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!deck) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Deck not found.</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{deck.title}</CardTitle>
              <Badge variant="secondary" className="text-xs">All cards reviewed</Badge>
            </CardHeader>
            <CardContent className="text-center py-10">
              <BookOpen className="mx-auto h-12 w-12 opacity-50 mb-3" />
              <h3 className="font-medium text-foreground">Session complete</h3>
              <p className="text-sm text-muted-foreground">You&rsquo;ve reviewed all cards in this deck.</p>
            </CardContent>
            <CardFooter>
              <Link href="/flashcards" className="w-full flex items-center justify-center">
                <button className="w-full py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg">Back to decks</button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const progress = cards.length > 0 ? Math.round(((cards.length - cards.filter((c) => reviewed[c.id]).length) / cards.length) * 100) : 100;

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/flashcards" className="text-sm text-primary underline">← Back to decks</Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">{deck.title}</Badge>
          <span>{progress}% complete</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-2xl relative group" style={{ minHeight: 400 }}>
          <div className="absolute inset-0 bg-background rounded-2xl border border-input shadow-xl transition-all duration-500 ease-in-out" style={{
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            visibility: flipped ? "hidden" : "visible",
          }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center backface-hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question</span>
              <p className="mt-4 text-lg font-semibold text-foreground">{current.front}</p>
              <div className="mt-6 flex items-center justify-center">
                <button onClick={() => setFlipped(true)} className="h-10 w-10 rounded-full border border-input bg-background hover:bg-accent transition-colors" aria-label="Flip card">
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-background rounded-2xl border border-input shadow-xl transition-all duration-500 ease-in-out backface-hidden" style={{
            transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
            visibility: flipped ? "visible" : "hidden",
          }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Answer</span>
              <p className="mt-4 text-lg text-foreground">{current.back}</p>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => review(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  aria-label="Again"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  onClick={() => review(3)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500 bg-amber-500 text-amber-900 hover:bg-amber-600 transition-colors"
                  aria-label="Hard"
                >
                  <span className="font-bold text-sm">H</span>
                </button>
                <button
                  onClick={() => review(4)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 bg-green-500 text-green-900 hover:bg-green-600 transition-colors"
                  aria-label="Good"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => review(5)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500 bg-blue-500 text-blue-900 hover:bg-blue-600 transition-colors"
                  aria-label="Easy"
                >
                  <span className="font-bold text-sm">E</span>
                </button>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Interval: {current.interval} day(s) · Repetitions: {current.repetitions}
              </div>
            </div>
          </div>
        </Card>
        <div className="mt-4 flex w-full max-w-2xl justify-between">
          <button onClick={nextCard} disabled={!flipped} className="px-4 py-2 rounded-lg border border-input text-sm font-medium text-muted-foreground disabled:opacity-50 hover:bg-accent transition-colors">
            Skip
          </button>
          <span className="text-xs text-muted-foreground">{index + 1} of {cards.length}</span>
        </div>
      </div>
    </div>
  );
}
