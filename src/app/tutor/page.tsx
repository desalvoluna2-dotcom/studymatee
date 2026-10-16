"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Send, Trash2, Edit3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: Message[];
}

export default function TutorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // fix: declare loading properly above
  // (TypeScript may complain about redeclare; handle below)

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const res = await fetch("/api/tutor", { credentials: "include" });
      if (!res.ok) return;
      setConversations(await res.json());
    } catch {}
  }

  async function openConversation(id: string) {
    setActiveId(id);
    setMessages([]);
    try {
      const res = await fetch(`/api/tutor?conversationId=${id}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch {}
    loadConversations();
  }

  async function createConversation() {
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello", language: "en", level: "intermediate" }),
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setActiveId(data.conversationId);
      setMessages([
        { id: "temp1", role: "user", content: "Hello", createdAt: new Date().toISOString() },
        { id: data.assistantMessage.id, role: "assistant", content: data.assistantMessage.content, createdAt: new Date().toISOString() },
      ]);
      loadConversations();
    } catch {}
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: Message = { id: "temp-" + Date.now(), role: "user", content: input, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const convId = activeId || undefined;
    setLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message: input, language: "en", level: "intermediate" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get reply");
      const data = await res.json();
      setActiveId(data.conversationId);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsg.id),
        { id: userMsg.id, role: "user", content: input, createdAt: new Date().toISOString() },
        { id: data.assistantMessage.id, role: "assistant", content: data.assistantMessage.content, createdAt: new Date().toISOString() },
      ]);
      loadConversations();
    } catch (err: any) {
      setError(err.message || "Failed to get reply");
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversation(id: string) {
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`/api/tutor?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      if (activeId === id) setActiveId(null);
      setMessages([]);
      loadConversations();
    } catch {}
  }

  const scrolling = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrolling();
  }, [messages, scrolling]);

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Study Tutor</h1>
          <p className="text-muted-foreground">Ask about your course materials. Get simple, step-by-step explanations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={createConversation} className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> New conversation
          </Button>
          <Link href="/documents" className="text-sm text-primary underline">Upload materials</Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No conversations yet.</div>
              ) : (
                <div className="divide-y divide-input">
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => openConversation(c.id)}
                      className={cn("p-4 hover:bg-accent cursor-pointer transition-colors", activeId === c.id && "bg-primary/10 border-l border-primary")}
                    >
                      <p className="text-sm font-medium text-foreground line-clamp-1">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c._count?.messages || 0} messages</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Button onClick={() => setActiveId(null)} variant="outline" size="sm" className="flex-1">
                  Clear selection
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {!activeId ? (
            <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
              <ShieldAlert className="h-12 w-12 opacity-50 mb-3" />
              <h3 className="font-medium text-foreground">Select a conversation to start</h3>
            </div>
          ) : (
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle>Tutor conversation</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Fallback mode</Badge>
                  <button
                    onClick={() => deleteConversation(activeId!)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3 max-w-[80%]",
                      m.role === "user" ? "flex-row-reverse ml-auto" : "mr-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl p-3 text-sm",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 mr-auto">
                    <div className="bg-muted rounded-xl p-3 text-sm animate-pulse">…</div>
                  </div>
                )}
              </CardContent>
              <CardContent className="p-3">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your tutor…"
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !input.trim()} className="flex items-center gap-1">
                    <Send className="h-3 w-3" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  No AI provider is configured. Replies are deterministic and based on your uploaded materials. Verify all information.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

