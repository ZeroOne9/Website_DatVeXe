import { apiClient } from "@/services/apiClient";
import type { AuthResult, UserInfo } from "@/services/types";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

export type UpdateMePayload = {
  fullName?: string;
  phone?: string | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const authService = {
  login(payload: LoginPayload) {
    return apiClient.post<AuthResult>("/api/auth/login", payload);
  },

  register(payload: RegisterPayload) {
    return apiClient.post<AuthResult>("/api/auth/register", payload);
  },

  getMe() {
    return apiClient.get<{ user: UserInfo }>("/api/auth/me");
  },

  updateMe(payload: UpdateMePayload) {
    return apiClient.patch<{ user: UserInfo }>("/api/auth/me", payload);
  },

  changePassword(payload: ChangePasswordPayload) {
    return apiClient.patch<{ changed: true }>("/api/auth/password", payload);
  },

  logout() {
    return apiClient.post<{ loggedOut: true }>("/api/auth/logout");
  },
};
