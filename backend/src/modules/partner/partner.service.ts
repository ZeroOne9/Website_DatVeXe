import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

import type {
  CreatePartnerSeatInput,
  CreatePartnerTripInput,
  CreatePartnerVehicleInput,
  UpdatePartnerVehicleInput,
} from "./partner.validator";

type PartnerScope = {
  busCompanyIds: number[];
  primaryBusCompany: unknown;
};

function partnerTripWhere(busCompanyIds: number[]) {
  return {
    vehicle: {
      busCompanyId: {
        in: busCompanyIds,
      },
    },
  };
}

function partnerBookingWhere(busCompanyIds: number[]) {
  return {
    bookingSeats: {
      some: {
        trip: partnerTripWhere(busCompanyIds),
      },
    },
  };
}

export async function getPartnerDashboard(scope: PartnerScope) {
  const [vehicleCount, tripCount, bookingCount, confirmedBookings, revenue, recentBookings] =
    await Promise.all([
      prisma.vehicle.count({
        where: { busCompanyId: { in: scope.busCompanyIds } },
      }),
      prisma.trip.count({
        where: partnerTripWhere(scope.busCompanyIds),
      }),
      prisma.booking.count({
        where: partnerBookingWhere(scope.busCompanyIds),
      }),
      prisma.booking.count({
        where: {
          ...partnerBookingWhere(scope.busCompanyIds),
          status: "confirmed",
        },
      }),
      prisma.booking.aggregate({
        _sum: { totalFareVnd: true },
        where: {
          ...partnerBookingWhere(scope.busCompanyIds),
          status: "confirmed",
        },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: partnerBookingWhere(scope.busCompanyIds),
        include: {
          bookingSeats: {
            take: 1,
            include: {
              seat: true,
              trip: {
                include: {
                  route: {
                    include: {
                      departureLocation: true,
                      destinationLocation: true,
                    },
                  },
                  vehicle: {
                    include: {
                      busCompany: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

  return {
    busCompany: scope.primaryBusCompany,
    stats: {
      vehicles: vehicleCount,
      trips: tripCount,
      bookings: bookingCount,
      confirmedBookings,
      revenue: revenue._sum.totalFareVnd ?? 0,
    },
    recentBookings,
  };
}

export function listPartnerVehicles(scope: PartnerScope) {
  return prisma.vehicle.findMany({
    where: {
      busCompanyId: {
        in: scope.busCompanyIds,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      busCompany: true,
      _count: {
        select: {
          seats: true,
          trips: true,
        },
      },
    },
  });
}

export async function createPartnerVehicle(scope: PartnerScope, input: CreatePartnerVehicleInput) {
  const busCompanyId = scope.busCompanyIds[0];

  if (!busCompanyId) {
    throw new ApiError("Tai khoan nha xe chua duoc gan voi don vi nao.", 403);
  }

  try {
    return await prisma.vehicle.create({
      data: {
        busCompanyId,
        licensePlate: input.licensePlate,
        name: input.name,
        vehicleType: input.vehicleType,
        capacity: input.capacity,
        status: input.status ?? "active",
      },
      include: {
        busCompany: true,
        _count: {
          select: {
            seats: true,
            trips: true,
          },
        },
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ApiError("Bien so xe da ton tai.", 409);
    }

    throw error;
  }
}

export async function updatePartnerVehicle(
  scope: PartnerScope,
  vehicleId: number,
  input: UpdatePartnerVehicleInput,
) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      busCompanyId: {
        in: scope.busCompanyIds,
      },
    },
    select: {
      id: true,
      status: true,
      _count: {
        select: {
          seats: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new ApiError("Xe khong ton tai hoac khong thuoc nha xe cua ban.", 404);
  }

  if (input.capacity && input.capacity < vehicle._count.seats) {
    throw new ApiError("Suc chua khong duoc nho hon so ghe da tao.", 409);
  }

  if (input.status && input.status !== "active") {
    const scheduledTrips = await prisma.trip.count({
      where: {
        vehicleId,
        status: "scheduled",
        departureTime: {
          gt: new Date(),
        },
      },
    });

    if (scheduledTrips > 0) {
      throw new ApiError("Khong the doi trang thai xe khi con chuyen sap khoi hanh.", 409);
    }
  }

  try {
    return await prisma.vehicle.update({
      where: { id: vehicleId },
      data: input,
      include: {
        busCompany: true,
        _count: {
          select: {
            seats: true,
            trips: true,
          },
        },
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ApiError("Bien so xe da ton tai.", 409);
    }

    throw error;
  }
}

export async function deletePartnerVehicle(scope: PartnerScope, vehicleId: number) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      busCompanyId: {
        in: scope.busCompanyIds,
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          trips: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new ApiError("Xe khong ton tai hoac khong thuoc nha xe cua ban.", 404);
  }

  if (vehicle._count.trips > 0) {
    throw new ApiError("Khong the xoa xe da co chuyen xe. Hay chuyen xe sang trang thai ngung hoat dong.", 409);
  }

  await prisma.vehicle.delete({
    where: { id: vehicleId },
  });

  return { id: vehicleId };
}

export async function createPartnerVehicleSeat(
  scope: PartnerScope,
  vehicleId: number,
  input: CreatePartnerSeatInput,
) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      busCompanyId: {
        in: scope.busCompanyIds,
      },
    },
    select: {
      id: true,
      capacity: true,
      _count: {
        select: {
          seats: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new ApiError("Xe khong ton tai hoac khong thuoc nha xe cua ban.", 404);
  }

  if (vehicle._count.seats >= vehicle.capacity) {
    throw new ApiError("So ghe da dat toi suc chua cua xe.", 409);
  }

  try {
    return await prisma.seat.create({
      data: {
        vehicleId,
        seatCode: input.seatCode,
        seatType: input.seatType ?? "standard",
        floor: input.floor,
        rowNumber: input.rowNumber,
        colNumber: input.colNumber,
        isActive: input.isActive ?? true,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ApiError("Ma ghe da ton tai tren xe nay.", 409);
    }

    throw error;
  }
}

export function listPartnerTrips(scope: PartnerScope) {
  return prisma.trip.findMany({
    where: partnerTripWhere(scope.busCompanyIds),
    orderBy: { departureTime: "desc" },
    include: {
      route: {
        include: {
          departureLocation: true,
          destinationLocation: true,
        },
      },
      vehicle: {
        include: {
          busCompany: true,
        },
      },
      _count: {
        select: {
          bookingSeats: true,
        },
      },
    },
  });
}

export function listPartnerRoutes() {
  return prisma.route.findMany({
    where: { status: "active" },
    orderBy: [{ departureLocation: { province: "asc" } }, { destinationLocation: { province: "asc" } }],
    include: {
      departureLocation: true,
      destinationLocation: true,
    },
  });
}

export async function createPartnerTrip(scope: PartnerScope, input: CreatePartnerTripInput) {
  const [route, vehicle] = await Promise.all([
    prisma.route.findUnique({
      where: { id: input.routeId },
      select: { id: true, status: true },
    }),
    prisma.vehicle.findFirst({
      where: {
        id: input.vehicleId,
        busCompanyId: {
          in: scope.busCompanyIds,
        },
      },
      select: { id: true, status: true },
    }),
  ]);

  if (!route) {
    throw new ApiError("Tuyen xe khong ton tai.", 404);
  }

  if (route.status !== "active") {
    throw new ApiError("Tuyen xe dang ngung hoat dong.", 409);
  }

  if (!vehicle) {
    throw new ApiError("Xe khong ton tai hoac khong thuoc nha xe cua ban.", 404);
  }

  if (vehicle.status !== "active") {
    throw new ApiError("Xe khong san sang hoat dong.", 409);
  }

  return prisma.trip.create({
    data: {
      routeId: input.routeId,
      vehicleId: input.vehicleId,
      departureTime: new Date(input.departureTime),
      arrivalTime: input.arrivalTime ? new Date(input.arrivalTime) : undefined,
      priceVnd: input.priceVnd,
      status: input.status ?? "scheduled",
    },
    include: {
      route: {
        include: {
          departureLocation: true,
          destinationLocation: true,
        },
      },
      vehicle: {
        include: {
          busCompany: true,
        },
      },
    },
  });
}

export function listPartnerBookings(scope: PartnerScope) {
  return prisma.booking.findMany({
    where: partnerBookingWhere(scope.busCompanyIds),
    orderBy: { createdAt: "desc" },
    include: {
      bookingSeats: {
        include: {
          seat: true,
          ticket: true,
          trip: {
            include: {
              route: {
                include: {
                  departureLocation: true,
                  destinationLocation: true,
                },
              },
              vehicle: {
                include: {
                  busCompany: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
