import type { UserRole, UserStatus } from "@prisma/client";
import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "auth_token";

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type PublicUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthTokenPayload = JwtPayload & {
  userId: number;
  email: string;
  role: UserRole;
};

export const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

export function signAuthToken(user: Pick<PublicUser, "id" | "email" | "role">): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: TOKEN_MAX_AGE_SECONDS },
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (typeof decoded === "string") {
      return null;
    }

    if (
      typeof decoded.userId !== "number" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return null;
    }

    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getAuthTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.authorization;

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return request.cookies?.[AUTH_COOKIE_NAME] ?? null;
}

export async function getCurrentUser(request: Request): Promise<PublicUser | null> {
  const token = getAuthTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: publicUserSelect,
  });

  if (!user || user.status !== "active") {
    return null;
  }

  return user;
}

export async function getCurrentAdmin(request: Request): Promise<PublicUser | null> {
  const user = await getCurrentUser(request);

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}

export function setAuthCookie(response: Response, token: string): Response {
  response.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_MAX_AGE_SECONDS * 1000,
    path: "/",
  });

  return response;
}

export function clearAuthCookie(response: Response): Response {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
