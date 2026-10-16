import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateFile, extractText, extractError } from "@/lib/extract";
import { storeFile } from "@/lib/storage";
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
  if (!rateLimit(`documents:get:${ip}`, { limit: 120, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const user = await requireAuth();
    const materials = await prisma.studyMaterial.findMany({
      where: { uploadedById: user.id },
      include: {
        extractedDocument: true,
        course: { select: { id: true, title: true } },
        subject: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materials);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`documents:post:${ip}`, { limit: 30, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const courseId = (formData.get("courseId") as string) || undefined;
    const subjectId = (formData.get("subjectId") as string) || undefined;
    const title = (formData.get("title") as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadFile = {
      buffer,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buffer.length,
    };

    const validation = validateFile(uploadFile);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    let storagePath: string;
    let storageBucket: string | null = null;
    try {
      const stored = await storeFile(buffer, file.name, uploadFile.mimeType);
      storagePath = stored.storagePath;
      storageBucket = stored.storageBucket;
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "File storage failed" },
        { status: 500 }
      );
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title: title || file.name,
        originalName: file.name,
        fileType: "PDF", // best effort; refine by mime
        fileSize: buffer.length,
        mimeType: uploadFile.mimeType,
        storagePath,
        storageBucket,
        uploadedById: user.id,
        courseId,
        subjectId,
      },
      include: { course: { select: { id: true, title: true } } },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
