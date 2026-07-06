import { apiClient } from "@/services/apiClient";

export type PartnerApplicationInput = {
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  accountEmail: string;
  password: string;
  address?: string;
  description?: string;
};

export type PartnerApplication = Omit<PartnerApplicationInput, "password"> & {
  id: number;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const partnerService = {
  apply(data: PartnerApplicationInput) {
    return apiClient.post<{ application: PartnerApplication }>("/api/partners/apply", data);
  },
};
