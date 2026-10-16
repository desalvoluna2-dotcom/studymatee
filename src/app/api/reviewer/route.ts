import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reviewerSchema } from "@/lib/validation";
import { generateReviewer } from "@/lib/ai";
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

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`reviewer:post:${ip}`, { limit: 30, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = reviewerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    let sourceText = "";
    let grounded = false;
    if (parsed.data.materialId) {
      const material = await prisma.studyMaterial.findUnique({
        where: { id: parsed.data.materialId },
        include: { extractedDocument: true },
      });
      if (!material) {
        return NextResponse.json({ error: "Material not found" }, { status: 404 });
      }
      if (material.uploadedById !== user.id && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      sourceText = material.extractedDocument?.cleanedText || material.extractedDocument?.rawText || "";
      grounded = Boolean(sourceText);
    }

    const result = await generateReviewer({
      sourceText,
      title: parsed.data.title,
      format: parsed.data.format as any,
      difficulty: parsed.data.difficulty as any,
      language: parsed.data.language,
    });

    const reviewer = await prisma.reviewer.create({
      data: {
        title: parsed.data.title,
        courseId: parsed.data.courseId,
        subjectId: parsed.data.subjectId || null,
        topicId: parsed.data.topicId || null,
        materialId: parsed.data.materialId || null,
        generatedById: user.id,
        format: parsed.data.format as any,
        difficulty: parsed.data.difficulty as any,
        language: parsed.data.language,
        content: result.content,
        sourceGrounded: grounded,
        aiProvider: result.provider,
      },
    });

    return NextResponse.json({ reviewer, grounded, provider: result.provider });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`reviewer:get:${ip}`, { limit: 120, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const reviewers = await prisma.reviewer.findMany({
      where: { generatedById: user.id },
      include: {
        course: { select: { id: true, title: true } },
        subject: { select: { id: true, title: true } },
        material: { select: { id: true, title: true, originalName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviewers);
  } catch (err) {
    return handleError(err);
  }
}
