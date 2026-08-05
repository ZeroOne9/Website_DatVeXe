import type { PublicUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import type { CreateBookingInput } from "./booking.validator";

const BOOKING_HOLD_MINUTES = 15;
const PAID_BOOKING_CANCEL_REFUND_HOURS = 24;

function createBookingCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `BK${Date.now()}${random}`;
}

function createTicketCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `TK${Date.now()}${random}`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
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

function normalizeBookingLegs(input: CreateBookingInput) {
  if (input.legs?.length) {
    return input.legs;
  }

  return [
    {
      legType: "outbound" as const,
      tripId: input.tripId!,
      seatIds: input.seatIds!,
    },
  ];
}

const tripDetailSelect = {
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
      busCompany: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  },
} as const;

const bookingDetailSelect = {
  id: true,
  bookingCode: true,
  tripType: true,
  passengerName: true,
  passengerPhone: true,
  passengerEmail: true,
  totalFareVnd: true,
  status: true,
  expiresAt: true,
  confirmedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  bookingSeats: {
    orderBy: {
      id: "asc" as const,
    },
    select: {
      id: true,
      legType: true,
      fareVnd: true,
      trip: {
        select: tripDetailSelect,
      },
      seat: {
        select: {
          id: true,
          seatCode: true,
          seatType: true,
          floor: true,
          rowNumber: true,
          colNumber: true,
        },
      },
      ticket: {
        select: {
          id: true,
          code: true,
          qrCode: true,
          status: true,
          issuedAt: true,
          usedAt: true,
        },
      },
    },
  },
} as const;

export async function createBooking(input: CreateBookingInput, user: PublicUser | null) {
  return prisma.$transaction(async (tx) => {
    const legs = normalizeBookingLegs(input);
    const tripType = input.tripType ?? (legs.some((leg) => leg.legType === "return") ? "round_trip" : "one_way");
    const bookingSeatCreates: Array<{
      legType: "outbound" | "return";
      tripId: number;
      seatId: number;
      fareVnd: number;
    }> = [];
    let totalFareVnd = 0;

    for (const leg of legs) {
      const trip = await tx.trip.findUnique({
        where: { id: leg.tripId },
        select: {
          id: true,
          vehicleId: true,
          priceVnd: true,
          departureTime: true,
          status: true,
        },
      });

      if (!trip) {
        throw new ApiError("Khong tim thay chuyen xe.", 404);
      }

      if (trip.status !== "scheduled") {
        throw new ApiError("Chuyen xe khong con nhan dat ve.", 409);
      }

      if (trip.departureTime <= new Date()) {
        throw new ApiError("Chuyen xe da qua thoi gian khoi hanh.", 409);
      }

      const seats = await tx.seat.findMany({
        where: {
          id: {
            in: leg.seatIds,
          },
          vehicleId: trip.vehicleId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (seats.length !== leg.seatIds.length) {
        throw new ApiError("Mot hoac nhieu ghe khong ton tai hoac khong thuoc chuyen xe nay.", 404);
      }

      const existingBookingSeats = await tx.bookingSeat.findMany({
        where: {
          tripId: trip.id,
          seatId: {
            in: leg.seatIds,
          },
          booking: {
            ...getActiveSeatHoldWhere(),
          },
        },
        select: {
          seat: {
            select: {
              seatCode: true,
            },
          },
        },
      });

      if (existingBookingSeats.length > 0) {
        const bookedSeatCodes = existingBookingSeats.map((bookingSeat) => bookingSeat.seat.seatCode).join(", ");
        throw new ApiError(`Ghe da duoc dat: ${bookedSeatCodes}.`, 409);
      }

      totalFareVnd += trip.priceVnd * leg.seatIds.length;
      bookingSeatCreates.push(
        ...leg.seatIds.map((seatId) => ({
          legType: leg.legType,
          tripId: trip.id,
          seatId,
          fareVnd: trip.priceVnd,
        })),
      );
    }

    const booking = await tx.booking.create({
      data: {
        bookingCode: createBookingCode(),
        userId: user?.id,
        passengerName: input.passengerName,
        passengerPhone: input.passengerPhone,
        passengerEmail: input.passengerEmail,
        totalFareVnd,
        tripType,
        status: "pending",
        expiresAt: addMinutes(new Date(), BOOKING_HOLD_MINUTES),
        bookingSeats: {
          create: bookingSeatCreates,
        },
      },
      select: {
        bookingCode: true,
      },
    });

    const createdBooking = await tx.booking.findUniqueOrThrow({
      where: { bookingCode: booking.bookingCode },
      select: bookingDetailSelect,
    });

    return { booking: createdBooking };
  });
}

export async function getBookingByCode(bookingCode: string) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    select: bookingDetailSelect,
  });

  if (!booking) {
    throw new ApiError("Khong tim thay thong tin dat ve.", 404);
  }

  return { booking };
}

export async function getMyBookings(userId: number) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    select: bookingDetailSelect,
  });

  return { bookings };
}

export async function confirmBooking(bookingCode: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { bookingCode },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        bookingSeats: {
          select: {
            id: true,
            ticket: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError("Khong tim thay thong tin dat ve.", 404);
    }

    if (booking.status === "confirmed") {
      const confirmedBooking = await tx.booking.findUniqueOrThrow({
        where: { bookingCode },
        select: bookingDetailSelect,
      });

      return { booking: confirmedBooking };
    }

    if (booking.status !== "pending") {
      throw new ApiError("Chi co the xac nhan booking dang cho thanh toan.", 409);
    }

    if (booking.expiresAt && booking.expiresAt <= new Date()) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "expired",
        },
      });

      throw new ApiError("Booking da het thoi gian giu cho.", 409);
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "confirmed",
        confirmedAt: new Date(),
      },
    });

    for (const bookingSeat of booking.bookingSeats) {
      if (!bookingSeat.ticket) {
        await tx.ticket.create({
          data: {
            bookingSeatId: bookingSeat.id,
            code: createTicketCode(),
            qrCode: `${bookingCode}:${bookingSeat.id}`,
          },
        });
      }
    }

    const confirmedBooking = await tx.booking.findUniqueOrThrow({
      where: { bookingCode },
      select: bookingDetailSelect,
    });

    return { booking: confirmedBooking };
  });
}

export async function cancelBooking(bookingCode: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { bookingCode },
      select: {
        id: true,
        status: true,
        totalFareVnd: true,
        bookingSeats: {
          select: {
            trip: {
              select: {
                departureTime: true,
                status: true,
              },
            },
            ticket: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError("Khong tim thay thong tin dat ve.", 404);
    }

    if (booking.status === "cancelled") {
      const cancelledBooking = await tx.booking.findUniqueOrThrow({
        where: { bookingCode },
        select: bookingDetailSelect,
      });

      return { booking: cancelledBooking };
    }

    if (booking.status === "expired") {
      throw new ApiError("Booking da het han, khong can huy.", 409);
    }

    const hasDepartedTrip = booking.bookingSeats.some(
      (bookingSeat) => bookingSeat.trip.status !== "scheduled" || bookingSeat.trip.departureTime <= new Date(),
    );

    if (hasDepartedTrip) {
      throw new ApiError("Xe da khoi hanh, khong the huy ve.", 409);
    }

    const hasUsedTicket = booking.bookingSeats.some((bookingSeat) => bookingSeat.ticket?.status === "used");

    if (hasUsedTicket) {
      throw new ApiError("Co ve da duoc su dung, khong the huy.", 409);
    }

    if (booking.status === "confirmed") {
      const earliestDepartureTime = booking.bookingSeats.reduce<Date | null>((earliest, bookingSeat) => {
        const departureTime = bookingSeat.trip.departureTime;

        if (!earliest || departureTime < earliest) {
          return departureTime;
        }

        return earliest;
      }, null);

      if (!earliestDepartureTime) {
        throw new ApiError("Khong tim thay thoi gian khoi hanh cua ve.", 409);
      }

      const hoursBeforeDeparture = (earliestDepartureTime.getTime() - Date.now()) / (60 * 60 * 1000);

      if (hoursBeforeDeparture < PAID_BOOKING_CANCEL_REFUND_HOURS) {
        throw new ApiError("Ve da thanh toan chi duoc huy truoc gio khoi hanh toi thieu 24 gio.", 409);
      }
    } else if (booking.status !== "pending") {
      throw new ApiError("Chi co the huy ve dang cho thanh toan hoac ve da thanh toan hop le.", 409);
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    await tx.ticket.updateMany({
      where: {
        bookingSeat: {
          bookingId: booking.id,
        },
        status: {
          not: "cancelled",
        },
      },
      data: {
        status: "cancelled",
      },
    });

    const cancelledBooking = await tx.booking.findUniqueOrThrow({
      where: { bookingCode },
      select: bookingDetailSelect,
    });

    return { booking: cancelledBooking };
  });
}
