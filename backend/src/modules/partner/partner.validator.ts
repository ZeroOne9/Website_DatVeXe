import { SeatType, TripStatus, VehicleStatus } from "@prisma/client";
import { z } from "zod";

const idSchema = z.coerce
  .number()
  .int("ID phai la so nguyen.")
  .positive("ID khong hop le.");

export const idParamSchema = z.object({
  id: idSchema,
});

export const createPartnerVehicleSchema = z.object({
  licensePlate: z.string().trim().min(5, "Bien so xe khong hop le.").max(20),
  name: z.string().trim().min(2, "Ten xe phai co it nhat 2 ky tu.").max(120),
  vehicleType: z.string().trim().min(2, "Loai xe phai co it nhat 2 ky tu.").max(80),
  capacity: z.coerce
    .number()
    .int("So ghe phai la so nguyen.")
    .positive("So ghe phai lon hon 0."),
  status: z.nativeEnum(VehicleStatus).optional(),
});

export const updatePartnerVehicleSchema = z
  .object({
    licensePlate: z.string().trim().min(5, "Bien so xe khong hop le.").max(20).optional(),
    name: z.string().trim().min(2, "Ten xe phai co it nhat 2 ky tu.").max(120).optional(),
    vehicleType: z.string().trim().min(2, "Loai xe phai co it nhat 2 ky tu.").max(80).optional(),
    capacity: z.coerce
      .number()
      .int("So ghe phai la so nguyen.")
      .positive("So ghe phai lon hon 0.")
      .optional(),
    status: z.nativeEnum(VehicleStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Can it nhat mot truong de cap nhat.",
  });

export const createPartnerSeatSchema = z.object({
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

export const createPartnerTripSchema = z
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

export type IdParamInput = z.infer<typeof idParamSchema>;
export type CreatePartnerVehicleInput = z.infer<typeof createPartnerVehicleSchema>;
export type UpdatePartnerVehicleInput = z.infer<typeof updatePartnerVehicleSchema>;
export type CreatePartnerSeatInput = z.infer<typeof createPartnerSeatSchema>;
export type CreatePartnerTripInput = z.infer<typeof createPartnerTripSchema>;
