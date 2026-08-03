import type { Request } from "express";

import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/auth.service";

export type PartnerScope = {
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  memberships: Array<unknown>;
  busCompanyIds: number[];
  primaryBusCompany: unknown;
};

export function optionalUser(request: Request) {
  return getCurrentUser(request);
}

export async function requireAdmin(request: Request) {
  const user = await getCurrentUser(request);

  if (!user || user.role !== "admin") {
    throw new ApiError("Ban khong co quyen quan tri.", 403);
  }

  return user;
}

export async function requirePartner(request: Request): Promise<PartnerScope> {
  const user = await getCurrentUser(request);

  if (!user || user.role !== "partner") {
    throw new ApiError("Ban khong co quyen truy cap khu vuc nha xe.", 403);
  }

  const memberships = await prisma.busCompanyUser.findMany({
    where: { userId: user.id },
    include: {
      busCompany: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    throw new ApiError("Tai khoan nha xe chua duoc gan voi don vi nao.", 403);
  }

  return {
    user,
    memberships,
    busCompanyIds: memberships.map((membership) => membership.busCompanyId),
    primaryBusCompany: memberships[0].busCompany,
  };
}
