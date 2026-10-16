import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { courseSchema, subjectSchema } from "@/lib/validation";
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
  if (!rateLimit(`courses:get:${ip}`, { limit: 120, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";
    const where = mine ? { ownerId: user.id } : {};
    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: { select: { subjects: true, studyMaterials: true, enrollments: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`courses:post:${ip}`, { limit: 30, windowSeconds: 60 }).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const user = await requireRole(["STUDENT", "TEACHER", "ADMIN"]);
    const body = await request.json();
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const course = await prisma.course.create({
      data: {
        title: parsed.data.title,
        code: parsed.data.code || null,
        description: parsed.data.description || null,
        category: parsed.data.category,
        ownerId: user.id,
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
