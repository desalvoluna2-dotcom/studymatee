import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { userPreferenceSchema } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { z } from "zod";


const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

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
  try {
    const user = await requireAuth();
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true, image: true, createdAt: true },
    });
    return NextResponse.json({ user: me });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data: any = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      data.email = parsed.data.email;
    }
    if (parsed.data.newPassword) {
      if (!parsed.data.currentPassword) {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      const me = await prisma.user.findUnique({ where: { id: user.id } });
      if (!me || !(await verifyPassword(parsed.data.currentPassword, me.passwordHash))) {
        return NextResponse.json({ error: "Current password incorrect" }, { status: 401 });
      }
      data.passwordHash = await hashPassword(parsed.data.newPassword);
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({
      user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { password } = z.object({ password: z.string() }).parse(body);
    const me = await prisma.user.findUnique({ where: { id: user.id } });
    if (!me || !(await verifyPassword(password, me.passwordHash))) {
      return NextResponse.json({ error: "Password incorrect" }, { status: 401 });
    }
    // Delete user cascades to sessions, tasks, etc. via onDelete
    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
