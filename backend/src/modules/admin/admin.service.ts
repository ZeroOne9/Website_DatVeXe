import { Prisma } from "@prisma/client";

import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { assertVehicleTripSchedule } from "@/modules/trips/trip-schedule.service";
import { markDepartedTrips } from "@/modules/trips/trip-status.service";

import type {
  CreateBusCompanyInput,
  CreateLocationInput,
  CreateRouteInput,
  CreateSeatInput,
  CreateTripInput,
  CreateVehicleInput,
  ListUsersQueryInput,
  ListPartnerApplicationsQueryInput,
  UpdateLocationInput,
  UpdateRouteInput,
  UpdateBusCompanyInput,
  UpdateRouteStatusInput,
  UpdateTripInput,
  UpdateTripStatusInput,
  UpdateUserInput,
  UpdateVehicleInput,
  UpdateVehicleStatusInput,
} from "./admin.validator";

const partnerApplicationPublicSelect = {
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

const adminTripInclude = {
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
} as const;

const adminUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      bookings: true,
    },
  },
} as const;

export function listAdminLocations() {
  return prisma.location.findMany({
    orderBy: [{ province: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          departureRoutes: true,
          destinationRoutes: true,
        },
      },
    },
  });
}

export async function createAdminLocation(input: CreateLocationInput) {
  try {
    return await prisma.location.create({
      data: input,
      include: {
        _count: {
          select: {
            departureRoutes: true,
            destinationRoutes: true,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Dia diem nay da ton tai.", 409);
    }

    throw error;
  }
}

export async function updateAdminLocation(locationId: number, input: UpdateLocationInput) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true },
  });

  if (!location) {
    throw new ApiError("Dia diem khong ton tai.", 404);
  }

  try {
    return await prisma.location.update({
      where: { id: locationId },
      data: input,
      include: {
        _count: {
          select: {
            departureRoutes: true,
            destinationRoutes: true,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Dia diem nay da ton tai.", 409);
    }

    throw error;
  }
}

export async function deleteAdminLocation(locationId: number) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      _count: {
        select: {
          departureRoutes: true,
          destinationRoutes: true,
        },
      },
    },
  });

  if (!location) {
    throw new ApiError("Dia diem khong ton tai.", 404);
  }

  const routeCount = location._count.departureRoutes + location._count.destinationRoutes;
  if (routeCount > 0) {
    throw new ApiError("Khong the xoa dia diem da duoc su dung trong tuyen xe.", 409);
  }

  await prisma.location.delete({
    where: { id: locationId },
  });

  return { id: locationId };
}

export function listAdminRoutes() {
  return prisma.route.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      departureLocation: true,
      destinationLocation: true,
      _count: {
        select: {
          trips: true,
        },
      },
    },
  });
}

export async function createAdminRoute(input: CreateRouteInput) {
  const locations = await prisma.location.findMany({
    where: {
      id: {
        in: [input.departureLocationId, input.destinationLocationId],
      },
    },
    select: {
      id: true,
    },
  });

  if (locations.length !== 2) {
    throw new ApiError("Diem di hoac diem den khong ton tai.", 404);
  }

  try {
    return await prisma.route.create({
      data: {
        departureLocationId: input.departureLocationId,
        destinationLocationId: input.destinationLocationId,
        distanceKm: input.distanceKm,
        estimatedMinutes: input.estimatedMinutes,
      },
      include: {
        departureLocation: true,
        destinationLocation: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Tuyen xe nay da ton tai.", 409);
    }

    throw error;
  }
}

export async function listAdminTrips() {
  await markDepartedTrips();

  return prisma.trip.findMany({
    orderBy: {
      departureTime: "desc",
    },
    include: adminTripInclude,
  });
}

export async function createAdminTrip(input: CreateTripInput) {
  const [route, vehicle] = await Promise.all([
    prisma.route.findUnique({
      where: { id: input.routeId },
      select: { id: true, status: true },
    }),
    prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
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
    throw new ApiError("Xe khong ton tai.", 404);
  }

  if (vehicle.status !== "active") {
    throw new ApiError("Xe khong san sang hoat dong.", 409);
  }

  await assertVehicleTripSchedule(prisma, {
    routeId: input.routeId,
    vehicleId: input.vehicleId,
    departureTime: new Date(input.departureTime),
    arrivalTime: input.arrivalTime ? new Date(input.arrivalTime) : null,
    status: input.status ?? "scheduled",
  });

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

export function listAdminBusCompanies() {
  return prisma.busCompany.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          vehicles: true,
        },
      },
    },
  });
}

export function listAdminPartnerApplications(query: ListPartnerApplicationsQueryInput = {}) {
  return prisma.partnerApplication.findMany({
    where: query.status ? { status: query.status } : undefined,
    select: partnerApplicationPublicSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function approveAdminPartnerApplication(applicationId: number) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.partnerApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        phone: true,
        email: true,
        accountEmail: true,
        passwordHash: true,
        address: true,
        description: true,
        status: true,
      },
    });

    if (!application) {
      throw new ApiError("Ho so dang ky nha xe khong ton tai.", 404);
    }

    if (application.status !== "pending") {
      throw new ApiError("Chi co the duyet ho so dang cho duyet.", 409);
    }

    if (!application.accountEmail || !application.passwordHash) {
      throw new ApiError("Ho so chua co thong tin tai khoan dang nhap.", 409);
    }

    const [existingBusCompany, existingUser] = await Promise.all([
      tx.busCompany.findUnique({
        where: { name: application.companyName },
        select: { id: true },
      }),
      tx.user.findUnique({
        where: { email: application.accountEmail },
        select: { id: true },
      }),
    ]);

    if (existingBusCompany) {
      throw new ApiError("Nha xe nay da ton tai trong he thong.", 409);
    }

    if (existingUser) {
      throw new ApiError("Email dang nhap da duoc su dung.", 409);
    }

    const busCompany = await tx.busCompany.create({
      data: {
        name: application.companyName,
        phone: application.phone,
        email: application.email,
        address: application.address,
        description: application.description,
      },
    });

    const partnerUser = await tx.user.create({
      data: {
        fullName: application.contactName,
        email: application.accountEmail,
        passwordHash: application.passwordHash,
        role: "partner",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.busCompanyUser.create({
      data: {
        userId: partnerUser.id,
        busCompanyId: busCompany.id,
        role: "owner",
      },
    });

    const updatedApplication = await tx.partnerApplication.update({
      where: { id: applicationId },
      data: {
        status: "approved",
        reviewedAt: new Date(),
      },
      select: partnerApplicationPublicSelect,
    });

    return { application: updatedApplication, busCompany, partnerUser };
  });
}

export async function rejectAdminPartnerApplication(applicationId: number) {
  const application = await prisma.partnerApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true },
  });

  if (!application) {
    throw new ApiError("Ho so dang ky nha xe khong ton tai.", 404);
  }

  if (application.status !== "pending") {
    throw new ApiError("Chi co the tu choi ho so dang cho duyet.", 409);
  }

  return prisma.partnerApplication.update({
    where: { id: applicationId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
    },
    select: partnerApplicationPublicSelect,
  });
}

export async function createAdminBusCompany(input: CreateBusCompanyInput) {
  try {
    return await prisma.busCompany.create({
      data: input,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Nha xe nay da ton tai.", 409);
    }

    throw error;
  }
}

export async function updateAdminBusCompany(busCompanyId: number, input: UpdateBusCompanyInput) {
  const busCompany = await prisma.busCompany.findUnique({
    where: { id: busCompanyId },
    select: { id: true },
  });

  if (!busCompany) {
    throw new ApiError("Nha xe khong ton tai.", 404);
  }

  try {
    return await prisma.busCompany.update({
      where: { id: busCompanyId },
      data: input,
      include: {
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Nha xe nay da ton tai.", 409);
    }

    throw error;
  }
}

export async function deleteAdminBusCompany(busCompanyId: number) {
  const busCompany = await prisma.busCompany.findUnique({
    where: { id: busCompanyId },
    select: {
      id: true,
      _count: {
        select: {
          vehicles: true,
        },
      },
    },
  });

  if (!busCompany) {
    throw new ApiError("Nha xe khong ton tai.", 404);
  }

  if (busCompany._count.vehicles > 0) {
    throw new ApiError("Khong the xoa nha xe da co xe. Hay cap nhat thong tin nha xe thay vi xoa.", 409);
  }

  await prisma.busCompany.delete({
    where: { id: busCompanyId },
  });

  return { id: busCompanyId };
}

export function listAdminVehicles() {
  return prisma.vehicle.findMany({
    orderBy: {
      createdAt: "desc",
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
}

export async function createAdminVehicle(input: CreateVehicleInput) {
  const busCompany = await prisma.busCompany.findUnique({
    where: { id: input.busCompanyId },
    select: { id: true },
  });

  if (!busCompany) {
    throw new ApiError("Nha xe khong ton tai.", 404);
  }

  try {
    return await prisma.vehicle.create({
      data: {
        busCompanyId: input.busCompanyId,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Bien so xe da ton tai.", 409);
    }

    throw error;
  }
}

export async function listAdminVehicleSeats(vehicleId: number) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      busCompany: true,
      seats: {
        orderBy: [{ floor: "asc" }, { rowNumber: "asc" }, { colNumber: "asc" }, { seatCode: "asc" }],
      },
    },
  });

  if (!vehicle) {
    throw new ApiError("Xe khong ton tai.", 404);
  }

  return vehicle;
}

export async function createAdminVehicleSeat(vehicleId: number, input: CreateSeatInput) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
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
    throw new ApiError("Xe khong ton tai.", 404);
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Ma ghe da ton tai tren xe nay.", 409);
    }

    throw error;
  }
}

export async function updateAdminRouteStatus(routeId: number, input: UpdateRouteStatusInput) {
  return updateAdminRoute(routeId, input);
}

export async function updateAdminRoute(routeId: number, input: UpdateRouteInput) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: {
      id: true,
      departureLocationId: true,
      destinationLocationId: true,
      status: true,
      _count: {
        select: {
          trips: true,
        },
      },
    },
  });

  if (!route) {
    throw new ApiError("Tuyen xe khong ton tai.", 404);
  }

  const departureLocationId = input.departureLocationId ?? route.departureLocationId;
  const destinationLocationId = input.destinationLocationId ?? route.destinationLocationId;

  if (departureLocationId === destinationLocationId) {
    throw new ApiError("Diem di va diem den phai khac nhau.", 400);
  }

  if (input.departureLocationId || input.destinationLocationId) {
    const locations = await prisma.location.findMany({
      where: {
        id: {
          in: [departureLocationId, destinationLocationId],
        },
      },
      select: { id: true },
    });

    if (locations.length !== 2) {
      throw new ApiError("Diem di hoac diem den khong ton tai.", 404);
    }
  }

  if (input.status === "inactive") {
    const scheduledTrips = await prisma.trip.count({
      where: {
        routeId,
        status: "scheduled",
        departureTime: {
          gt: new Date(),
        },
      },
    });

    if (scheduledTrips > 0) {
      throw new ApiError("Khong the ngung tuyen xe khi con chuyen sap khoi hanh.", 409);
    }
  }

  try {
    return await prisma.route.update({
      where: { id: routeId },
      data: input,
      include: {
        departureLocation: true,
        destinationLocation: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("Tuyen xe nay da ton tai.", 409);
    }

    throw error;
  }
}

export async function deleteAdminRoute(routeId: number) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: {
      id: true,
      _count: {
        select: {
          trips: true,
        },
      },
    },
  });

  if (!route) {
    throw new ApiError("Tuyen xe khong ton tai.", 404);
  }

  if (route._count.trips > 0) {
    throw new ApiError("Khong the xoa tuyen xe da co chuyen. Hay chuyen sang trang thai ngung hoat dong.", 409);
  }

  await prisma.route.delete({
    where: { id: routeId },
  });

  return { id: routeId };
}

export async function updateAdminVehicleStatus(vehicleId: number, input: UpdateVehicleStatusInput) {
  return updateAdminVehicle(vehicleId, input);
}

export async function updateAdminVehicle(vehicleId: number, input: UpdateVehicleInput) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      status: true,
      capacity: true,
      _count: {
        select: {
          seats: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new ApiError("Xe khong ton tai.", 404);
  }

  if (input.busCompanyId) {
    const busCompany = await prisma.busCompany.findUnique({
      where: { id: input.busCompanyId },
      select: { id: true },
    });

    if (!busCompany) {
      throw new ApiError("Nha xe khong ton tai.", 404);
    }
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

  return prisma.vehicle.update({
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
}

export async function deleteAdminVehicle(vehicleId: number) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
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
    throw new ApiError("Xe khong ton tai.", 404);
  }

  if (vehicle._count.trips > 0) {
    throw new ApiError("Khong the xoa xe da co chuyen xe. Hay chuyen xe sang trang thai ngung hoat dong.", 409);
  }

  await prisma.vehicle.delete({
    where: { id: vehicleId },
  });

  return { id: vehicleId };
}

export async function updateAdminTripStatus(tripId: number, input: UpdateTripStatusInput) {
  return updateAdminTrip(tripId, input);
}

export async function updateAdminTrip(tripId: number, input: UpdateTripInput) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        routeId: true,
        vehicleId: true,
        departureTime: true,
        arrivalTime: true,
        priceVnd: true,
        status: true,
        _count: {
          select: {
            bookingSeats: true,
          },
        },
      },
    });

    if (!trip) {
      throw new ApiError("Chuyen xe khong ton tai.", 404);
    }

    if (trip.status === "completed" && input.status && input.status !== "completed") {
      throw new ApiError("Khong the doi trang thai chuyen xe da hoan thanh.", 409);
    }

    if (trip.status === "departed" && input.status === "scheduled") {
      throw new ApiError("Khong the dua chuyen da khoi hanh ve trang thai scheduled.", 409);
    }

    const changesTripCore =
      input.routeId !== undefined ||
      input.vehicleId !== undefined ||
      input.departureTime !== undefined ||
      input.arrivalTime !== undefined ||
      input.priceVnd !== undefined;

    if (trip._count.bookingSeats > 0 && changesTripCore) {
      throw new ApiError("Chuyen xe da co ve dat. Chi nen cap nhat trang thai hoac tao chuyen moi.", 409);
    }

    if (input.routeId) {
      const route = await tx.route.findUnique({
        where: { id: input.routeId },
        select: { id: true, status: true },
      });

      if (!route) {
        throw new ApiError("Tuyen xe khong ton tai.", 404);
      }

      if (route.status !== "active") {
        throw new ApiError("Tuyen xe dang ngung hoat dong.", 409);
      }
    }

    if (input.vehicleId) {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { id: true, status: true },
      });

      if (!vehicle) {
        throw new ApiError("Xe khong ton tai.", 404);
      }

      if (vehicle.status !== "active") {
        throw new ApiError("Xe khong san sang hoat dong.", 409);
      }
    }

    const nextDepartureTime = input.departureTime ? new Date(input.departureTime) : trip.departureTime;
    const nextArrivalTime = input.arrivalTime ? new Date(input.arrivalTime) : trip.arrivalTime;

    if (nextArrivalTime && nextArrivalTime <= nextDepartureTime) {
      throw new ApiError("Thoi gian den phai sau thoi gian khoi hanh.", 400);
    }

    await assertVehicleTripSchedule(tx, {
      routeId: input.routeId ?? trip.routeId,
      vehicleId: input.vehicleId ?? trip.vehicleId,
      departureTime: nextDepartureTime,
      arrivalTime: nextArrivalTime,
      status: input.status ?? trip.status,
      excludeTripId: tripId,
    });

    if (input.status === "cancelled" && trip.status !== "cancelled") {
      await tx.booking.updateMany({
        where: {
          bookingSeats: {
            some: {
              tripId,
            },
          },
          status: {
            in: ["pending", "confirmed"],
          },
        },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      });

      await tx.ticket.updateMany({
        where: {
          bookingSeat: {
            tripId,
          },
          status: "valid",
        },
        data: {
          status: "cancelled",
        },
      });
    }

    return tx.trip.update({
      where: { id: tripId },
      data: {
        routeId: input.routeId,
        vehicleId: input.vehicleId,
        departureTime: input.departureTime ? new Date(input.departureTime) : undefined,
        arrivalTime: input.arrivalTime ? new Date(input.arrivalTime) : undefined,
        priceVnd: input.priceVnd,
        status: input.status,
      },
      include: adminTripInclude,
    });
  });
}

export async function deleteAdminTrip(tripId: number) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      _count: {
        select: {
          bookingSeats: true,
        },
      },
    },
  });

  if (!trip) {
    throw new ApiError("Chuyen xe khong ton tai.", 404);
  }

  if (trip._count.bookingSeats > 0) {
    throw new ApiError("Khong the xoa chuyen xe da co ve dat. Hay huy chuyen xe.", 409);
  }

  await prisma.trip.delete({
    where: { id: tripId },
  });

  return { id: tripId };
}

export function listAdminUsers(query: ListUsersQueryInput = {}) {
  return prisma.user.findMany({
    where: {
      role: "passenger",
      ...(query.status ? { status: query.status } : {}),
    },
    select: adminUserSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateAdminUser(userId: number, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError("Tai khoan khong ton tai.", 404);
  }

  if (user.role !== "passenger") {
    throw new ApiError("Chi duoc quan ly tai khoan khach hang o man hinh nay.", 403);
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: input,
      select: adminUserSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("So dien thoai da duoc su dung.", 409);
    }

    throw error;
  }
}

export async function deleteAdminUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError("Tai khoan khong ton tai.", 404);
  }

  if (user.role !== "passenger") {
    throw new ApiError("Chi duoc xoa tai khoan khach hang o man hinh nay.", 403);
  }

  if (user._count.bookings > 0) {
    throw new ApiError("Khach hang da co lich su dat ve. Hay khoa tai khoan thay vi xoa.", 409);
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { id: userId };
}

export function listAdminBookings() {
  return prisma.booking.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
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

export async function getDashboardStats() {
  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    revenueData,
    totalTrips,
    totalVehicles,
    totalBusCompanies,
    recentBookings,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.booking.count({ where: { status: "cancelled" } }),
    prisma.booking.aggregate({
      _sum: { totalFareVnd: true },
      where: { status: "confirmed" },
    }),
    prisma.trip.count(),
    prisma.vehicle.count(),
    prisma.busCompany.count(),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        bookingSeats: {
          take: 1,
          orderBy: { id: "asc" },
          select: {
            trip: {
              select: {
                route: {
                  select: {
                    departureLocation: { select: { name: true } },
                    destinationLocation: { select: { name: true } },
                  },
                },
                vehicle: {
                  select: {
                    name: true,
                    busCompany: { select: { name: true } },
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
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      cancelled: cancelledBookings,
    },
    revenue: revenueData._sum?.totalFareVnd || 0,
    trips: totalTrips,
    vehicles: totalVehicles,
    busCompanies: totalBusCompanies,
    recentBookings: recentBookings.map((booking) => ({
      id: booking.id,
      bookingCode: booking.bookingCode,
      passenger: {
        fullName: booking.user?.fullName ?? booking.passengerName,
        phone: booking.user?.phone ?? booking.passengerPhone,
      },
      trip: booking.bookingSeats[0]?.trip ?? null,
      totalPriceVnd: booking.totalFareVnd,
      status: booking.status,
    })),
  };
}
