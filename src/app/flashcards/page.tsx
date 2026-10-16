"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Deck {
  id: string;
  title: string;
  description: string | null;
  course?: { title: string } | null;
  _count: { cards: number };
  updatedAt: string;
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", courseId: "" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/flashcards/decks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load decks");
      setDecks(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load decks");
    } finally {
      setLoading(false);
    }
  }

  async function createDeck(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/flashcards/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, courseId: form.courseId || undefined }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create deck");
      setOpen(false);
      setForm({ title: "", description: "", courseId: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Failed to create deck");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
          <p className="text-muted-foreground">Study with spaced repetition flashcard decks.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New deck
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {decks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 opacity-50 mb-2" />
            <h3 className="font-medium text-foreground">No decks yet</h3>
            <p className="text-sm">Create your first flashcard deck.</p>
            <Button onClick={() => setOpen(true)} className="mt-4">New deck</Button>
          </div>
        ) : (
          decks.map((d) => (
            <Card key={d.id} className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold line-clamp-1 text-foreground">{d.title}</h3>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{d.course?.title || "General"}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">{d._count.cards} cards</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(d.updatedAt).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/flashcards/${d.id}`} className="text-xs text-primary underline flex items-center gap-1">
                  Study <span>→</span>
                </Link>
              </CardFooter>
            </Card>
          )
        ))}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden={!open ? "true" : "false"}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-background rounded-xl border border-input p-6 shadow-lg w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New deck</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <form onSubmit={createDeck} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deck-title">Deck title</Label>
              <Input id="deck-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck-desc">Description</Label>
              <Input id="deck-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck-course">Course (optional)</Label>
              <Input id="deck-course" placeholder="Course name" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Create deck</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
