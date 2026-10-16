import { NextRequest, NextResponse } from "next/server";
import { signIn, signUp, endSession, requireAuth } from "@/lib/auth";
import { signInSchema, signUpSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";


async function handleError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (err.message === "INVALID_CREDENTIALS")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    if (err.message === "EMAIL_IN_USE")
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`auth:${pathname}:${ip}`, { limit: 20, windowSeconds: 60 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    if (pathname.endsWith("/register")) {
      const body = await request.json();
      const parsed = signUpSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      await signUp(parsed.data.email, parsed.data.password, parsed.data.name, parsed.data.role);
      return NextResponse.json({ ok: true });
    }

    if (pathname.endsWith("/login")) {
      const body = await request.json();
      const parsed = signInSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }
      const user = await signIn(parsed.data.email, parsed.data.password);
      return NextResponse.json({ ok: true, user });
    }

    if (pathname.endsWith("/logout")) {
      await endSession();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith("/me")) {
    try {
      const user = await requireAuth();
      return NextResponse.json({ user });
    } catch (err) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
