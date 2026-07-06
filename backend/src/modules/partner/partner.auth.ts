import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function requirePartner(request: NextRequest) {
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
