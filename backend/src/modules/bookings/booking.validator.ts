import { z } from "zod";

const idSchema = z.coerce
  .number()
  .int("ID phai la so nguyen.")
  .positive("ID khong hop le.");

const seatIdsSchema = z
  .array(idSchema)
  .min(1, "Vui long chon it nhat 1 ghe.")
  .max(6, "Moi chang dat toi da 6 ghe.")
  .refine((seatIds) => new Set(seatIds).size === seatIds.length, "Danh sach ghe bi trung.");

const bookingLegSchema = z.object({
  legType: z.enum(["outbound", "return"]),
  tripId: idSchema,
  seatIds: seatIdsSchema,
});

export const createBookingSchema = z
  .object({
    tripType: z.enum(["one_way", "round_trip"]).optional(),
    tripId: idSchema.optional(),
    seatIds: seatIdsSchema.optional(),
    legs: z
      .array(bookingLegSchema)
      .min(1, "Vui long chon it nhat 1 chang.")
      .max(2, "Dat ve chi ho tro toi da 2 chang.")
      .optional(),
    passengerName: z
      .string()
      .trim()
      .min(2, "Ten hanh khach phai co it nhat 2 ky tu.")
      .max(120, "Ten hanh khach khong duoc vuot qua 120 ky tu."),
    passengerPhone: z
      .string()
      .trim()
      .regex(/^(0|\+84)[0-9]{9,10}$/, "So dien thoai khong hop le."),
    passengerEmail: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .trim()
        .email("Email khong hop le.")
        .max(191, "Email khong duoc vuot qua 191 ky tu.")
        .toLowerCase()
        .optional(),
    ),
  })
  .superRefine((data, ctx) => {
    const hasLegacyPayload = Boolean(data.tripId && data.seatIds);
    const hasLegPayload = Boolean(data.legs?.length);

    if (!hasLegacyPayload && !hasLegPayload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui long chon chuyen xe va ghe.",
        path: ["legs"],
      });
      return;
    }

    if (hasLegacyPayload && hasLegPayload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Chi gui mot dinh dang dat ve.",
        path: ["legs"],
      });
      return;
    }

    if (!data.legs?.length) {
      return;
    }

    const legTypes = data.legs.map((leg) => leg.legType);
    if (new Set(legTypes).size !== legTypes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Loai chang bi trung.",
        path: ["legs"],
      });
    }

    if (data.tripType === "round_trip") {
      if (!legTypes.includes("outbound") || !legTypes.includes("return")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ve khu hoi can co ca chang di va chang ve.",
          path: ["legs"],
        });
      }
    } else if (legTypes.includes("return") && !legTypes.includes("outbound")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Chang ve phai di kem chang di.",
        path: ["legs"],
      });
    }

    const totalSeats = data.legs.reduce((sum, leg) => sum + leg.seatIds.length, 0);
    if (totalSeats > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Moi lan dat toi da 12 ghe cho ca hanh trinh khu hoi.",
        path: ["legs"],
      });
    }
  });

export const bookingCodeSchema = z.object({
  bookingCode: z
    .string()
    .trim()
    .min(3, "Ma dat ve khong hop le.")
    .max(40, "Ma dat ve khong hop le."),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingCodeInput = z.infer<typeof bookingCodeSchema>;
