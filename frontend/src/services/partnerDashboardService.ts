import { apiClient } from "@/services/apiClient";
import type { BookingDetail } from "@/services/types";

type MutationPayload = Record<string, unknown>;

export const partnerDashboardService = {
  getDashboard() {
    return apiClient.get<{ dashboard: any }>("/api/partner/dashboard");
  },

  getVehicles() {
    return apiClient.get<{ vehicles: any[] }>("/api/partner/vehicles");
  },

  createVehicle(data: MutationPayload) {
    return apiClient.post<{ vehicle: any }>("/api/partner/vehicles", data);
  },

  updateVehicle(vehicleId: number, data: MutationPayload) {
    return apiClient.patch<{ vehicle: any }>(`/api/partner/vehicles/${vehicleId}`, data);
  },

  deleteVehicle(vehicleId: number) {
    return apiClient.delete<{ vehicle: { id: number } }>(`/api/partner/vehicles/${vehicleId}`);
  },

  createVehicleSeat(vehicleId: number, data: MutationPayload) {
    return apiClient.post<{ seat: any }>(`/api/partner/vehicles/${vehicleId}/seats`, data);
  },

  getTrips() {
    return apiClient.get<{ trips: any[] }>("/api/partner/trips");
  },

  getRoutes() {
    return apiClient.get<{ routes: any[] }>("/api/partner/routes");
  },

  createTrip(data: MutationPayload) {
    return apiClient.post<{ trip: any }>("/api/partner/trips", data);
  },

  getBookings() {
    return apiClient.get<{ bookings: BookingDetail[] }>("/api/partner/bookings");
  },
};
