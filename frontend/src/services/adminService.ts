import { apiClient } from "@/services/apiClient";
import type { BookingDetail } from "@/services/types";

export const adminService = {
  getBookings() {
    return apiClient.get<{ bookings: BookingDetail[] }>("/api/admin/bookings");
  },
  
  cancelBooking(bookingCode: string) {
    return apiClient.post<{ booking: BookingDetail }>(`/api/admin/bookings/${bookingCode}/cancel`);
  },

  getTrips() {
    return apiClient.get<{ trips: any[] }>("/api/admin/trips");
  },

  createTrip(data: any) {
    return apiClient.post<{ trip: any }>("/api/admin/trips", data);
  },

  updateTripStatus(tripId: number, status: string) {
    return apiClient.patch<{ trip: any }>(`/api/admin/trips/${tripId}`, { status });
  },

  getRoutes() {
    return apiClient.get<{ routes: any[] }>("/api/admin/routes");
  },

  createRoute(data: any) {
    return apiClient.post<{ route: any }>("/api/admin/routes", data);
  },

  updateRouteStatus(routeId: number, status: string) {
    return apiClient.patch<{ route: any }>(`/api/admin/routes/${routeId}`, { status });
  },

  getLocations() {
    return apiClient.get<{ locations: any[] }>("/api/admin/locations");
  },

  getVehicles() {
    return apiClient.get<{ vehicles: any[] }>("/api/admin/vehicles");
  },

  createVehicle(data: any) {
    return apiClient.post<{ vehicle: any }>("/api/admin/vehicles", data);
  },

  updateVehicleStatus(vehicleId: number, status: string) {
    return apiClient.patch<{ vehicle: any }>(`/api/admin/vehicles/${vehicleId}`, { status });
  },

  getBusCompanies() {
    return apiClient.get<{ busCompanies: any[] }>("/api/admin/bus-companies");
  },

  createBusCompany(data: any) {
    return apiClient.post<{ busCompany: any }>("/api/admin/bus-companies", data);
  },

  getVehicleSeats(vehicleId: number) {
    return apiClient.get<{ vehicle: any }>(`/api/admin/vehicles/${vehicleId}/seats`);
  },

  createVehicleSeat(vehicleId: number, data: any) {
    return apiClient.post<{ seat: any }>(`/api/admin/vehicles/${vehicleId}/seats`, data);
  },

  getDashboardStats() {
    return apiClient.get<{ stats: any }>("/api/admin/dashboard");
  },

  getPartnerApplications(status?: string) {
    const query = status ? `?status=${status}` : "";
    return apiClient.get<{ applications: any[] }>(`/api/admin/partner-applications${query}`);
  },

  approvePartnerApplication(id: number) {
    return apiClient.patch<{ application: any; busCompany: any }>(`/api/admin/partner-applications/${id}/approve`);
  },

  rejectPartnerApplication(id: number) {
    return apiClient.patch<{ application: any }>(`/api/admin/partner-applications/${id}/reject`);
  }
};
