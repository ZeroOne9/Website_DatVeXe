import { z } from "zod";

const optionalTextSchema = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const createPartnerApplicationSchema = z.object({
  companyName: z.string().trim().min(2, "Ten nha xe phai co it nhat 2 ky tu.").max(150),
  contactName: z.string().trim().min(2, "Ten nguoi lien he phai co it nhat 2 ky tu.").max(120),
  phone: z.string().trim().min(8, "So dien thoai khong hop le.").max(20),
  email: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().email("Email khong hop le.").max(191).optional(),
  ),
  accountEmail: z
    .string()
    .trim()
    .email("Email dang nhap khong hop le.")
    .max(191),
  password: z.string().min(6, "Mat khau phai co it nhat 6 ky tu.").max(72),
  address: optionalTextSchema(255),
  description: optionalTextSchema(1000),
});

export type CreatePartnerApplicationInput = z.infer<typeof createPartnerApplicationSchema>;
