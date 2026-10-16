import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import prisma from "./prisma";

const SECRET = process.env.AUTH_SECRET;
const APP_URL = process.env.APP_URL;

if (!SECRET) {
  throw new Error("AUTH_SECRET environment variable is required");
}

export const SESSION_COOKIE_NAME = "studymate_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const SIGNING_KEY = new TextEncoder().encode(SECRET);

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}

function hashToken(token: string): Promise<string> {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(token))
    .then((buf) => {
      const bytes = new Uint8Array(buf);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    });
}

export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SIGNING_KEY);

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  const tokenHash = await await hashToken(token);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const tokenHash = await await hashToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || !session.user) return null;
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Rotate session: extend expiry
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000) },
    });

    const cookieStore2 = await cookies();
    cookieStore2.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      image: session.user.image,
    };
  } catch {
    return null;
  }
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      const tokenHash = await await hashToken(token);
      await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
    } catch {}
  }
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }
  await createSession(user.id);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  };
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: string = "STUDENT"
): Promise<SessionUser> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role as any,
    },
  });
  await createSession(user.id);
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ACCOUNT_CREATED",
      entityType: "User",
      entityId: user.id,
    },
  });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  };
}

export { APP_URL };


