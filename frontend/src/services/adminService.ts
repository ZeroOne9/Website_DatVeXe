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

  updateTrip(tripId: number, data: any) {
    return apiClient.patch<{ trip: any }>(`/api/admin/trips/${tripId}`, data);
  },

  deleteTrip(tripId: number) {
    return apiClient.delete<{ trip: { id: number } }>(`/api/admin/trips/${tripId}`);
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

  updateRoute(routeId: number, data: any) {
    return apiClient.patch<{ route: any }>(`/api/admin/routes/${routeId}`, data);
  },

  deleteRoute(routeId: number) {
    return apiClient.delete<{ route: { id: number } }>(`/api/admin/routes/${routeId}`);
  },

  getLocations() {
    return apiClient.get<{ locations: any[] }>("/api/admin/locations");
  },

  createLocation(data: any) {
    return apiClient.post<{ location: any }>("/api/admin/locations", data);
  },

  updateLocation(locationId: number, data: any) {
    return apiClient.patch<{ location: any }>(`/api/admin/locations/${locationId}`, data);
  },

  deleteLocation(locationId: number) {
    return apiClient.delete<{ location: { id: number } }>(`/api/admin/locations/${locationId}`);
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

  updateVehicle(vehicleId: number, data: any) {
    return apiClient.patch<{ vehicle: any }>(`/api/admin/vehicles/${vehicleId}`, data);
  },

  deleteVehicle(vehicleId: number) {
    return apiClient.delete<{ vehicle: { id: number } }>(`/api/admin/vehicles/${vehicleId}`);
  },

  getBusCompanies() {
    return apiClient.get<{ busCompanies: any[] }>("/api/admin/bus-companies");
  },

  createBusCompany(data: any) {
    return apiClient.post<{ busCompany: any }>("/api/admin/bus-companies", data);
  },

  updateBusCompany(busCompanyId: number, data: any) {
    return apiClient.patch<{ busCompany: any }>(`/api/admin/bus-companies/${busCompanyId}`, data);
  },

  deleteBusCompany(busCompanyId: number) {
    return apiClient.delete<{ busCompany: { id: number } }>(`/api/admin/bus-companies/${busCompanyId}`);
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
  },

  getUsers(status?: string) {
    const query = status ? `?status=${status}` : "";
    return apiClient.get<{ users: any[] }>(`/api/admin/users${query}`);
  },

  updateUser(userId: number, data: any) {
    return apiClient.patch<{ user: any }>(`/api/admin/users/${userId}`, data);
  },

  deleteUser(userId: number) {
    return apiClient.delete<{ user: { id: number } }>(`/api/admin/users/${userId}`);
  }
};
