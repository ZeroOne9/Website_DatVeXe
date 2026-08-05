import { prisma } from "@/lib/prisma";

export function markDepartedTrips(now = new Date()) {
  return prisma.trip.updateMany({
    where: {
      status: "scheduled",
      departureTime: {
        lte: now,
      },
    },
    data: {
      status: "departed",
    },
  });
}
