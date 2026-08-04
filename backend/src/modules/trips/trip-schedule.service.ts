import type { Prisma, TripStatus } from "@prisma/client";

import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const TURNAROUND_MINUTES = 30;

type ScheduleDb = typeof prisma | Prisma.TransactionClient;

type VehicleTripScheduleInput = {
  routeId: number;
  vehicleId: number;
  departureTime: Date;
  arrivalTime?: Date | null;
  status?: TripStatus;
  excludeTripId?: number;
};

type RouteCheckpoint = {
  departureLocationId: number;
  destinationLocationId: number;
  estimatedMinutes: number | null;
  departureLocation: { name: string };
  destinationLocation: { name: string };
};

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatRouteName(route: RouteCheckpoint) {
  return `${route.departureLocation.name} -> ${route.destinationLocation.name}`;
}

function getVehicleLabel(vehicle: { licensePlate: string; name: string } | null, fallbackId: number) {
  return vehicle?.licensePlate || vehicle?.name || String(fallbackId);
}

function resolveArrivalTime(
  departureTime: Date,
  arrivalTime: Date | null | undefined,
  estimatedMinutes: number | null,
) {
  if (arrivalTime) return arrivalTime;
  if (estimatedMinutes) return addMinutes(departureTime, estimatedMinutes);
  return null;
}

export async function assertVehicleTripSchedule(
  db: ScheduleDb,
  input: VehicleTripScheduleInput,
) {
  const nextStatus = input.status ?? "scheduled";

  if (nextStatus === "cancelled") {
    return;
  }

  const route = await db.route.findUnique({
    where: { id: input.routeId },
    select: {
      id: true,
      departureLocationId: true,
      destinationLocationId: true,
      estimatedMinutes: true,
      departureLocation: {
        select: { name: true },
      },
      destinationLocation: {
        select: { name: true },
      },
    },
  });

  if (!route) {
    throw new ApiError("Tuyen xe khong ton tai.", 404);
  }

  const candidateArrivalTime = resolveArrivalTime(
    input.departureTime,
    input.arrivalTime,
    route.estimatedMinutes,
  );

  if (!candidateArrivalTime) {
    throw new ApiError("Can nhap thoi gian den hoac thiet lap thoi gian du kien cho tuyen xe.", 422);
  }

  if (candidateArrivalTime <= input.departureTime) {
    throw new ApiError("Thoi gian den phai sau thoi gian khoi hanh.", 400);
  }

  const vehicle = await db.vehicle.findUnique({
    where: { id: input.vehicleId },
    select: {
      licensePlate: true,
      name: true,
    },
  });
  const vehicleLabel = getVehicleLabel(vehicle, input.vehicleId);

  const existingTrips = await db.trip.findMany({
    where: {
      vehicleId: input.vehicleId,
      status: {
        not: "cancelled",
      },
      ...(input.excludeTripId ? { id: { not: input.excludeTripId } } : {}),
    },
    orderBy: {
      departureTime: "asc",
    },
    select: {
      id: true,
      departureTime: true,
      arrivalTime: true,
      route: {
        select: {
          departureLocationId: true,
          destinationLocationId: true,
          estimatedMinutes: true,
          departureLocation: {
            select: { name: true },
          },
          destinationLocation: {
            select: { name: true },
          },
        },
      },
    },
  });

  const candidateEndWithTurnaround = addMinutes(candidateArrivalTime, TURNAROUND_MINUTES);
  let previousTrip: (typeof existingTrips)[number] | null = null;
  let nextTrip: (typeof existingTrips)[number] | null = null;

  for (const trip of existingTrips) {
    const tripArrivalTime = resolveArrivalTime(
      trip.departureTime,
      trip.arrivalTime,
      trip.route.estimatedMinutes,
    );

    if (!tripArrivalTime) continue;

    const tripEndWithTurnaround = addMinutes(tripArrivalTime, TURNAROUND_MINUTES);
    const overlaps =
      input.departureTime < tripEndWithTurnaround &&
      trip.departureTime < candidateEndWithTurnaround;

    if (overlaps) {
      throw new ApiError(
        `Xe ${vehicleLabel} da co chuyen ${formatRouteName(trip.route)} trong khoang thoi gian nay. Vui long chon xe khac hoac doi gio khoi hanh.`,
        409,
      );
    }

    if (trip.departureTime < input.departureTime) {
      previousTrip = trip;
    } else if (!nextTrip) {
      nextTrip = trip;
    }
  }

  if (previousTrip && previousTrip.route.destinationLocationId !== route.departureLocationId) {
    throw new ApiError(
      `Xe ${vehicleLabel} dang o ${previousTrip.route.destinationLocation.name} sau chuyen truoc, nen khong the xuat phat tu ${route.departureLocation.name}.`,
      409,
    );
  }

  if (nextTrip && route.destinationLocationId !== nextTrip.route.departureLocationId) {
    throw new ApiError(
      `Chuyen nay ket thuc o ${route.destinationLocation.name}, nhung chuyen tiep theo cua xe xuat phat tu ${nextTrip.route.departureLocation.name}.`,
      409,
    );
  }
}
