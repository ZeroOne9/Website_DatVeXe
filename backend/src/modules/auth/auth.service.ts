import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { getCurrentUser, publicUserSelect, signAuthToken } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

import type { AuthResult } from "./auth.types";
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateMeInput } from "./auth.validator";

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const { fullName, email, phone, password } = input;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
    },
    select: {
      email: true,
      phone: true,
    },
  });

  if (existingUser?.email === email) {
    throw new ApiError("Email da duoc su dung.", 409);
  }

  if (phone && existingUser?.phone === phone) {
    throw new ApiError("So dien thoai da duoc su dung.", 409);
  }

  try {
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash: await hashPassword(password),
      },
      select: publicUserSelect,
    });

    return {
      user,
      token: signAuthToken(user),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Email hoac so dien thoai da duoc su dung.", 409);
    }

    throw new ApiError("Khong the dang ky tai khoan.", 500);
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      passwordHash: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError("Email hoac mat khau khong dung.", 401);
  }

  if (user.status !== "active") {
    throw new ApiError("Tai khoan dang bi khoa.", 403);
  }

  const publicUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: publicUser,
    token: signAuthToken(publicUser),
  };
}

export async function getAuthenticatedUser(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new ApiError("Vui long dang nhap.", 401);
  }

  return user;
}

export async function updateAuthenticatedUser(userId: number, input: UpdateMeInput) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: input,
      select: publicUserSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("So dien thoai da duoc su dung.", 409);
    }

    throw error;
  }
}

export async function changeAuthenticatedUserPassword(userId: number, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new ApiError("Tai khoan khong ton tai.", 404);
  }

  const passwordMatches = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError("Mat khau hien tai khong dung.", 401);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(input.newPassword),
    },
  });

  return { changed: true };
}
