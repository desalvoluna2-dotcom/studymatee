import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { extractText, extractError, ALLOWED_EXTENSIONS, ALLOWED_MIME, MAX_FILE_SIZE, ExtractionStatus } from "@/lib/extract";
import { getFile } from "@/lib/storage";
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const material = await prisma.studyMaterial.findUnique({
      where: { id },
    });
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
    if (material.uploadedById !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let buffer: Buffer;
    try {
      buffer = await getFile(material.storagePath);
    } catch (err: any) {
      return NextResponse.json(
        { error: "Stored file not found: " + (err.message || "unknown") },
        { status: 404 }
      );
    }

    const file = {
      buffer,
      originalName: material.originalName,
      mimeType: material.mimeType,
      size: buffer.length,
    };

    const ext = material.originalName.slice(material.originalName.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(material.mimeType)) {
      return NextResponse.json({ error: "Unsupported MIME type" }, { status: 400 });
    }
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const result = await extractText(file);
    const errMsg = extractError(result);

    let status = "COMPLETED";
    if (errMsg) status = "FAILED";

    const extracted = await prisma.extractedDocument.upsert({
      where: { materialId: id },
      update: {
        rawText: result.text || null,
        cleanedText: result.text || null,
        ocrUsed: result.ocrUsed,
        pageCount: result.pageCount || null,
        language: result.language || null,
        extractionStatus: status as ExtractionStatus,
        errorMessage: errMsg || null,
        extractedAt: new Date(),
      },
      create: {
        materialId: id,
        rawText: result.text || null,
        cleanedText: result.text || null,
        ocrUsed: result.ocrUsed,
        pageCount: result.pageCount || null,
        language: result.language || null,
        extractionStatus: status as ExtractionStatus,
        errorMessage: errMsg || null,
        extractedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      status: extracted.extractionStatus,
      textLength: (result.text || "").length,
      error: extracted.errorMessage,
    });
  } catch (err) {
    return handleError(err);
  }
}
