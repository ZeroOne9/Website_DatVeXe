import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { markDepartedTrips } from "./trip-status.service";
import type { TripSearchInput } from "./trip.validator";

function getDateRange(date: string) {
  const start = new Date(`${date}T00:00:00.000`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  if (Number.isNaN(start.getTime())) {
    throw new ApiError("Ngay khoi hanh khong hop le.", 422);
  }

  return { start, end };
}

function getActiveSeatHoldWhere() {
  return {
    OR: [
      { status: "confirmed" as const },
      {
        status: "pending" as const,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    ],
  };
}

function normalizeLocationSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

function getLocationSearchTerms(label: string | undefined) {
  if (!label) return [];

  const normalized = normalizeLocationSearch(label);
  const withoutCityPrefix = normalized.replace(/^tp\.?\s*/i, "").trim();

  return Array.from(new Set([label, normalized, withoutCityPrefix].filter(Boolean)));
}

function getLocationWhere(label: string | undefined, locationId: number) {
  const terms = getLocationSearchTerms(label);

  if (!label) {
    return { id: locationId };
  }

  return {
    OR: [
      { id: locationId },
      ...terms.flatMap((term) => [{ province: { contains: term } }, { name: { contains: term } }]),
    ],
  };
}

export async function searchTrips(input: TripSearchInput) {
  await markDepartedTrips();

  const dateRange = input.date ? getDateRange(input.date) : null;

  const trips = await prisma.trip.findMany({
    where: {
      route: {
        departureLocation: {
          is: getLocationWhere(input.departureLocationLabel, input.departureLocationId),
        },
        destinationLocation: {
          is: getLocationWhere(input.destinationLocationLabel, input.destinationLocationId),
        },
        status: "active",
      },
      departureTime: dateRange ? { gte: dateRange.start, lt: dateRange.end } : { gte: new Date() },
      status: "scheduled",
    },
    orderBy: {
      departureTime: "asc",
    },
    select: {
      id: true,
      departureTime: true,
      arrivalTime: true,
      priceVnd: true,
      status: true,
      route: {
        select: {
          id: true,
          distanceKm: true,
          estimatedMinutes: true,
          departureLocation: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
          destinationLocation: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
        },
      },
      vehicle: {
        select: {
          id: true,
          name: true,
          licensePlate: true,
          vehicleType: true,
          capacity: true,
          busCompany: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          seats: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
            },
          },
        },
      },
      bookingSeats: {
        where: {
          booking: {
            ...getActiveSeatHoldWhere(),
          },
        },
        select: {
          seatId: true,
        },
      },
    },
  });

  return trips.map((trip) => {
    const bookedSeatIds = new Set(trip.bookingSeats.map((bookingSeat) => bookingSeat.seatId));
    const totalSeats = trip.vehicle.seats.length;

    return {
      id: trip.id,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      priceVnd: trip.priceVnd,
      status: trip.status,
      availableSeatCount: totalSeats - bookedSeatIds.size,
      totalSeatCount: totalSeats,
      route: trip.route,
      vehicle: {
        id: trip.vehicle.id,
        name: trip.vehicle.name,
        licensePlate: trip.vehicle.licensePlate,
        vehicleType: trip.vehicle.vehicleType,
        capacity: trip.vehicle.capacity,
        busCompany: trip.vehicle.busCompany,
      },
    };
  });
}

export async function getTripSeats(tripId: number) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      departureTime: true,
      arrivalTime: true,
      priceVnd: true,
      status: true,
      route: {
        select: {
          id: true,
          departureLocation: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
          destinationLocation: {
            select: {
              id: true,
              name: true,
              province: true,
            },
          },
        },
      },
      vehicle: {
        select: {
          id: true,
          name: true,
          licensePlate: true,
          vehicleType: true,
          capacity: true,
          seats: {
            where: {
              isActive: true,
            },
            orderBy: [{ floor: "asc" }, { rowNumber: "asc" }, { colNumber: "asc" }, { seatCode: "asc" }],
            select: {
              id: true,
              seatCode: true,
              seatType: true,
              floor: true,
              rowNumber: true,
              colNumber: true,
            },
          },
          busCompany: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      },
      bookingSeats: {
        where: {
          booking: {
            ...getActiveSeatHoldWhere(),
          },
        },
        select: {
          seatId: true,
          booking: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new ApiError("Khong tim thay chuyen xe.", 404);
  }

  const bookedSeats = new Map(
    trip.bookingSeats.map((bookingSeat) => [bookingSeat.seatId, bookingSeat.booking.status]),
  );
  const seats = trip.vehicle.seats.map((seat) => {
    const bookingStatus = bookedSeats.get(seat.id);

    return {
      ...seat,
      isAvailable: !bookingStatus,
      bookingStatus: bookingStatus ?? null,
    };
  });

  return {
    trip: {
      id: trip.id,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      priceVnd: trip.priceVnd,
      status: trip.status,
      route: trip.route,
      vehicle: {
        id: trip.vehicle.id,
        name: trip.vehicle.name,
        licensePlate: trip.vehicle.licensePlate,
        vehicleType: trip.vehicle.vehicleType,
        capacity: trip.vehicle.capacity,
        busCompany: trip.vehicle.busCompany,
      },
    },
    seats,
    availableSeatCount: seats.filter((seat) => seat.isAvailable).length,
    totalSeatCount: seats.length,
  };
}
