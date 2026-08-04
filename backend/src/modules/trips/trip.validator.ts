import { z } from "zod";

const idParamSchema = z.coerce
  .number()
  .int("ID phai la so nguyen.")
  .positive("ID khong hop le.");

const optionalQueryString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const optionalDateSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngay khoi hanh phai co dinh dang YYYY-MM-DD.")
    .optional(),
);

export const tripSearchSchema = z.object({
  departureLocationId: idParamSchema,
  destinationLocationId: idParamSchema,
  departureLocationLabel: optionalQueryString,
  destinationLocationLabel: optionalQueryString,
  date: optionalDateSchema,
});

export const tripIdSchema = z.object({
  id: idParamSchema,
});

export type TripSearchInput = z.infer<typeof tripSearchSchema>;
export type TripIdInput = z.infer<typeof tripIdSchema>;
