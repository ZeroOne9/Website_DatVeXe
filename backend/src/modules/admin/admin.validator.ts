import { PartnerApplicationStatus, RouteStatus, SeatType, TripStatus, VehicleStatus } from "@prisma/client";
import { z } from "zod";

const idSchema = z.coerce
  .number()
  .int("ID phai la so nguyen.")
  .positive("ID khong hop le.");

const optionalPositiveNumberSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().positive("Gia tri phai lon hon 0.").optional(),
);

const optionalPositiveIntSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int("Gia tri phai la so nguyen.").positive("Gia tri phai lon hon 0.").optional(),
);

export const createLocationSchema = z.object({
  name: z.string().trim().min(2, "Ten dia diem phai co it nhat 2 ky tu.").max(120),
  province: z.string().trim().min(2, "Tinh/thanh phai co it nhat 2 ky tu.").max(120),
  address: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().max(255).optional(),
  ),
});

export const createRouteSchema = z
  .object({
    departureLocationId: idSchema,
    destinationLocationId: idSchema,
    distanceKm: optionalPositiveNumberSchema,
    estimatedMinutes: optionalPositiveIntSchema,
  })
  .refine((data) => data.departureLocationId !== data.destinationLocationId, {
    message: "Diem di va diem den phai khac nhau.",
    path: ["destinationLocationId"],
  });

export const createTripSchema = z
  .object({
    routeId: idSchema,
    vehicleId: idSchema,
    departureTime: z.string().trim().datetime("Thoi gian khoi hanh khong hop le."),
    arrivalTime: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.string().trim().datetime("Thoi gian den khong hop le.").optional(),
    ),
    priceVnd: z.coerce
      .number()
      .int("Gia ve phai la so nguyen.")
      .positive("Gia ve phai lon hon 0."),
    status: z.nativeEnum(TripStatus).optional(),
  })
  .refine(
    (data) => !data.arrivalTime || new Date(data.arrivalTime) > new Date(data.departureTime),
    {
      message: "Thoi gian den phai sau thoi gian khoi hanh.",
      path: ["arrivalTime"],
    },
  );

export const createBusCompanySchema = z.object({
  name: z.string().trim().min(2, "Ten nha xe phai co it nhat 2 ky tu.").max(150),
  phone: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().max(20).optional(),
  ),
  email: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().email("Email khong hop le.").max(191).optional(),
  ),
  address: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().max(255).optional(),
  ),
  description: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().optional(),
  ),
});

export const createVehicleSchema = z.object({
  busCompanyId: idSchema,
  licensePlate: z.string().trim().min(5, "Bien so xe khong hop le.").max(20),
  name: z.string().trim().min(2, "Ten xe phai co it nhat 2 ky tu.").max(120),
  vehicleType: z.string().trim().min(2, "Loai xe phai co it nhat 2 ky tu.").max(80),
  capacity: z.coerce
    .number()
    .int("So ghe phai la so nguyen.")
    .positive("So ghe phai lon hon 0."),
  status: z.nativeEnum(VehicleStatus).optional(),
});

export const vehicleIdParamSchema = z.object({
  id: idSchema,
});

export const idParamSchema = z.object({
  id: idSchema,
});

export const createSeatSchema = z.object({
  seatCode: z.string().trim().min(1, "Ma ghe khong hop le.").max(20),
  seatType: z.nativeEnum(SeatType).optional(),
  floor: z.coerce
    .number()
    .int("Tang ghe phai la so nguyen.")
    .positive("Tang ghe phai lon hon 0.")
    .default(1),
  rowNumber: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int("Hang ghe phai la so nguyen.").positive("Hang ghe phai lon hon 0.").optional(),
  ),
  colNumber: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int("Cot ghe phai la so nguyen.").positive("Cot ghe phai lon hon 0.").optional(),
  ),
  isActive: z.boolean().optional(),
});

export const updateRouteStatusSchema = z.object({
  status: z.nativeEnum(RouteStatus),
});

export const updateVehicleStatusSchema = z.object({
  status: z.nativeEnum(VehicleStatus),
});

export const updateTripStatusSchema = z.object({
  status: z.nativeEnum(TripStatus),
});

export const listPartnerApplicationsQuerySchema = z.object({
  status: z.nativeEnum(PartnerApplicationStatus).optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CreateBusCompanyInput = z.infer<typeof createBusCompanySchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type VehicleIdParamInput = z.infer<typeof vehicleIdParamSchema>;
export type CreateSeatInput = z.infer<typeof createSeatSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type UpdateRouteStatusInput = z.infer<typeof updateRouteStatusSchema>;
export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;
export type ListPartnerApplicationsQueryInput = z.infer<typeof listPartnerApplicationsQuerySchema>;
