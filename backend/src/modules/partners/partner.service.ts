import { Prisma } from "@prisma/client";

import { ApiError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

import type { CreatePartnerApplicationInput } from "./partner.validator";

const partnerApplicationSelect = {
  id: true,
  companyName: true,
  contactName: true,
  phone: true,
  email: true,
  accountEmail: true,
  address: true,
  description: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function createPartnerApplication(input: CreatePartnerApplicationInput) {
  const [existingBusCompany, existingUser] = await Promise.all([
    prisma.busCompany.findUnique({
      where: { name: input.companyName },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { email: input.accountEmail },
      select: { id: true },
    }),
  ]);

  if (existingBusCompany) {
    throw new ApiError("Nha xe nay da ton tai trong he thong.", 409);
  }

  if (existingUser) {
    throw new ApiError("Email dang nhap da duoc su dung.", 409);
  }

  const existingPendingApplication = await prisma.partnerApplication.findFirst({
    where: {
      status: "pending",
      OR: [
        { companyName: input.companyName },
        { phone: input.phone },
        { accountEmail: input.accountEmail },
        ...(input.email ? [{ email: input.email }] : []),
      ],
    },
    select: { id: true },
  });

  if (existingPendingApplication) {
    throw new ApiError("Ho so dang ky cua nha xe nay dang cho duyet.", 409);
  }

  try {
    const { password, ...applicationData } = input;
    const application = await prisma.partnerApplication.create({
      data: {
        ...applicationData,
        passwordHash: await hashPassword(password),
      },
      select: partnerApplicationSelect,
    });

    return { application };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new ApiError("Khong the tao ho so dang ky doi tac.", 500);
    }

    throw error;
  }
}
