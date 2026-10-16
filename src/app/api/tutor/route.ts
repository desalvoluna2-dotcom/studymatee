import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { tutorMessageSchema } from "@/lib/validation";
import { tutorReply } from "@/lib/ai";
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
  if (!rateLimit(`tutor:get:${ip}`, { limit: 120, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    if (conversationId) {
      const messages = await prisma.tutorMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(messages);
    }
    const conversations = await prisma.tutorConversation.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(conversations);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`tutor:post:${ip}`, { limit: 60, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = tutorMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    let conversationId = parsed.data.conversationId;
    let conversation;
    if (!conversationId) {
      conversation = await prisma.tutorConversation.create({
        data: { userId: user.id, title: parsed.data.message.slice(0, 60) },
      });
      conversationId = conversation.id;
    } else {
      conversation = await prisma.tutorConversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation || conversation.userId !== user.id) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    }

    // Save user message
    await prisma.tutorMessage.create({
      data: { conversationId, role: "user", content: parsed.data.message },
    });

    // Fetch history
    const history = await prisma.tutorMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const reply = await tutorReply({
      message: parsed.data.message,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      language: parsed.data.language,
      level: parsed.data.level,
    });

    // Save assistant message
    const assistant = await prisma.tutorMessage.create({
      data: { conversationId, role: "assistant", content: reply.text },
    });

    await prisma.tutorConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId,
      userMessage: { role: "user", content: parsed.data.message },
      assistantMessage: { role: "assistant", content: reply.text, id: assistant.id },
      provider: reply.provider,
      grounded: reply.grounded,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Conversation id required" }, { status: 400 });
    const conversation = await prisma.tutorConversation.findUnique({
      where: { id },
    });
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    if (conversation.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.tutorMessage.deleteMany({ where: { conversationId: id } });
    await prisma.tutorConversation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
