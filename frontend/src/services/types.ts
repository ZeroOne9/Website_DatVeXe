export type LocationItem = {
  id: number;
  name: string;
  province: string;
  address: string | null;
};

export type TripSearchItem = {
  id: number;
  departureTime: string;
  arrivalTime: string | null;
  priceVnd: number;
  status: string;
  availableSeatCount: number;
  totalSeatCount: number;
  route: {
    id: number;
    distanceKm?: string | number | null;
    estimatedMinutes?: number | null;
    departureLocation: Pick<LocationItem, "id" | "name" | "province">;
    destinationLocation: Pick<LocationItem, "id" | "name" | "province">;
  };
  vehicle: {
    id: number;
    name: string;
    licensePlate: string;
    vehicleType: string;
    capacity?: number;
    busCompany: {
      id: number;
      name: string;
      phone: string | null;
    };
  };
};

export type TripDetailItem = {
  id: number;
  departureTime: string;
  arrivalTime: string | null;
  priceVnd: number;
  status: string;
  route: {
    id: number;
    distanceKm?: string | number | null;
    estimatedMinutes?: number | null;
    departureLocation: Pick<LocationItem, "id" | "name" | "province">;
    destinationLocation: Pick<LocationItem, "id" | "name" | "province">;
  };
  vehicle: {
    id: number;
    name: string;
    licensePlate: string;
    vehicleType: string;
    capacity?: number;
    busCompany: {
      id: number;
      name: string;
      phone: string | null;
    };
  };
};

export type SeatItem = {
  id: number;
  seatCode: string;
  seatType: "standard" | "sleeper" | "vip";
  floor: number;
  rowNumber: number | null;
  colNumber: number | null;
  isAvailable: boolean;
  bookingStatus: "pending" | "confirmed" | null;
};

export type BookingDetail = {
  id: number;
  bookingCode: string;
  tripType: "one_way" | "round_trip";
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string | null;
  totalFareVnd: number;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  expiresAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  bookingSeats: BookingSeatDetail[];
};

export type CreateBookingResult = {
  booking: BookingDetail;
};

export type BookingSeatDetail = {
  id: number;
  legType: "outbound" | "return";
  fareVnd: number;
  trip: TripDetailItem;
  seat: Omit<SeatItem, "isAvailable" | "bookingStatus">;
  ticket: {
    id: number;
    code: string;
    qrCode: string | null;
    status: "valid" | "used" | "cancelled";
    issuedAt: string;
    usedAt: string | null;
  } | null;
};

export type TripSeatsResult = {
  trip: TripDetailItem;
  seats: SeatItem[];
  availableSeatCount: number;
  totalSeatCount: number;
};

export type UserInfo = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: "passenger" | "admin" | "partner";
  status: "active" | "locked";
  createdAt: string;
  updatedAt: string;
};

export type AuthResult = {
  user: UserInfo;
  token: string;
};
