import type { Request, Response } from "express";

import { requireAdmin } from "@/http/auth";
import { parse, success } from "@/http/response";
import { cancelBooking } from "@/modules/bookings/booking.service";
import { bookingCodeSchema } from "@/modules/bookings/booking.validator";

import {
  approveAdminPartnerApplication,
  createAdminBusCompany,
  createAdminLocation,
  createAdminRoute,
  createAdminTrip,
  createAdminVehicle,
  createAdminVehicleSeat,
  deleteAdminBusCompany,
  deleteAdminLocation,
  deleteAdminRoute,
  deleteAdminTrip,
  deleteAdminUser,
  deleteAdminVehicle,
  getDashboardStats,
  listAdminBookings,
  listAdminBusCompanies,
  listAdminLocations,
  listAdminPartnerApplications,
  listAdminRoutes,
  listAdminTrips,
  listAdminUsers,
  listAdminVehicles,
  listAdminVehicleSeats,
  rejectAdminPartnerApplication,
  updateAdminBusCompany,
  updateAdminLocation,
  updateAdminRoute,
  updateAdminTrip,
  updateAdminUser,
  updateAdminVehicle,
} from "./admin.service";
import {
  createBusCompanySchema,
  createLocationSchema,
  createRouteSchema,
  createSeatSchema,
  createTripSchema,
  createVehicleSchema,
  idParamSchema,
  listPartnerApplicationsQuerySchema,
  listUsersQuerySchema,
  updateRouteSchema,
  updateBusCompanySchema,
  updateLocationSchema,
  updateTripSchema,
  updateUserSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from "./admin.validator";

export async function getDashboardStatsController(request: Request, response: Response) {
  await requireAdmin(request);
  const stats = await getDashboardStats();
  success(response, { stats }, { message: "Lay thong ke thanh cong." });
}

export async function listAdminLocationsController(request: Request, response: Response) {
  await requireAdmin(request);
  const locations = await listAdminLocations();
  success(response, { locations }, { message: "Lay danh sach dia diem thanh cong." });
}

export async function createAdminLocationController(request: Request, response: Response) {
  await requireAdmin(request);
  const input = parse(createLocationSchema, request.body);
  const location = await createAdminLocation(input);
  success(response, { location }, { status: 201, message: "Tao dia diem thanh cong." });
}

export async function updateAdminLocationController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(updateLocationSchema, request.body);
  const location = await updateAdminLocation(params.id, input);
  success(response, { location }, { message: "Cap nhat dia diem thanh cong." });
}

export async function deleteAdminLocationController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const location = await deleteAdminLocation(params.id);
  success(response, { location }, { message: "Xoa dia diem thanh cong." });
}

export async function listAdminRoutesController(request: Request, response: Response) {
  await requireAdmin(request);
  const routes = await listAdminRoutes();
  success(response, { routes }, { message: "Lay danh sach tuyen xe thanh cong." });
}

export async function createAdminRouteController(request: Request, response: Response) {
  await requireAdmin(request);
  const input = parse(createRouteSchema, request.body);
  const route = await createAdminRoute(input);
  success(response, { route }, { status: 201, message: "Tao tuyen xe thanh cong." });
}

export async function updateAdminRouteController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(updateRouteSchema, request.body);
  const route = await updateAdminRoute(params.id, input);
  success(response, { route }, { message: "Cap nhat tuyen xe thanh cong." });
}

export async function deleteAdminRouteController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const route = await deleteAdminRoute(params.id);
  success(response, { route }, { message: "Xoa tuyen xe thanh cong." });
}

export async function listAdminBusCompaniesController(request: Request, response: Response) {
  await requireAdmin(request);
  const busCompanies = await listAdminBusCompanies();
  success(response, { busCompanies }, { message: "Lay danh sach nha xe thanh cong." });
}

export async function createAdminBusCompanyController(request: Request, response: Response) {
  await requireAdmin(request);
  const input = parse(createBusCompanySchema, request.body);
  const busCompany = await createAdminBusCompany(input);
  success(response, { busCompany }, { status: 201, message: "Tao nha xe thanh cong." });
}

export async function updateAdminBusCompanyController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(updateBusCompanySchema, request.body);
  const busCompany = await updateAdminBusCompany(params.id, input);
  success(response, { busCompany }, { message: "Cap nhat nha xe thanh cong." });
}

export async function deleteAdminBusCompanyController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const busCompany = await deleteAdminBusCompany(params.id);
  success(response, { busCompany }, { message: "Xoa nha xe thanh cong." });
}

export async function listAdminPartnerApplicationsController(request: Request, response: Response) {
  await requireAdmin(request);
  const query = parse(listPartnerApplicationsQuerySchema, request.query);
  const applications = await listAdminPartnerApplications(query);
  success(response, { applications }, { message: "Lay danh sach ho so dang ky nha xe thanh cong." });
}

export async function approveAdminPartnerApplicationController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const result = await approveAdminPartnerApplication(params.id);
  success(response, result, { message: "Duyet ho so dang ky nha xe thanh cong." });
}

export async function rejectAdminPartnerApplicationController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const application = await rejectAdminPartnerApplication(params.id);
  success(response, { application }, { message: "Tu choi ho so dang ky nha xe thanh cong." });
}

export async function listAdminVehiclesController(request: Request, response: Response) {
  await requireAdmin(request);
  const vehicles = await listAdminVehicles();
  success(response, { vehicles }, { message: "Lay danh sach xe thanh cong." });
}

export async function createAdminVehicleController(request: Request, response: Response) {
  await requireAdmin(request);
  const input = parse(createVehicleSchema, request.body);
  const vehicle = await createAdminVehicle(input);
  success(response, { vehicle }, { status: 201, message: "Tao xe thanh cong." });
}

export async function updateAdminVehicleController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(updateVehicleSchema, request.body);
  const vehicle = await updateAdminVehicle(params.id, input);
  success(response, { vehicle }, { message: "Cap nhat xe thanh cong." });
}

export async function deleteAdminVehicleController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const vehicle = await deleteAdminVehicle(params.id);
  success(response, { vehicle }, { message: "Xoa xe thanh cong." });
}

export async function listAdminVehicleSeatsController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(vehicleIdParamSchema, request.params);
  const vehicle = await listAdminVehicleSeats(params.id);
  success(response, { vehicle }, { message: "Lay danh sach ghe thanh cong." });
}

export async function createAdminVehicleSeatController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(vehicleIdParamSchema, request.params);
  const input = parse(createSeatSchema, request.body);
  const seat = await createAdminVehicleSeat(params.id, input);
  success(response, { seat }, { status: 201, message: "Tao ghe thanh cong." });
}

export async function listAdminTripsController(request: Request, response: Response) {
  await requireAdmin(request);
  const trips = await listAdminTrips();
  success(response, { trips }, { message: "Lay danh sach chuyen xe thanh cong." });
}

export async function createAdminTripController(request: Request, response: Response) {
  await requireAdmin(request);
  const input = parse(createTripSchema, request.body);
  const trip = await createAdminTrip(input);
  success(response, { trip }, { status: 201, message: "Tao chuyen xe thanh cong." });
}

export async function updateAdminTripController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(updateTripSchema, request.body);
  const trip = await updateAdminTrip(params.id, input);
  success(response, { trip }, { message: "Cap nhat chuyen xe thanh cong." });
}

export async function deleteAdminTripController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const trip = await deleteAdminTrip(params.id);
  success(response, { trip }, { message: "Xoa chuyen xe thanh cong." });
}

export async function listAdminBookingsController(request: Request, response: Response) {
  await requireAdmin(request);
  const bookings = await listAdminBookings();
  success(response, { bookings }, { message: "Lay danh sach dat ve thanh cong." });
}

export async function cancelAdminBookingController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(bookingCodeSchema, request.params);
  const result = await cancelBooking(params.bookingCode);
  success(response, result, { message: "Huy ve thanh cong." });
}

export async function listAdminUsersController(request: Request, response: Response) {
  await requireAdmin(request);
  const query = parse(listUsersQuerySchema, request.query);
  const users = await listAdminUsers(query);
  success(response, { users }, { message: "Lay danh sach khach hang thanh cong." });
}

export async function updateAdminUserController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(updateUserSchema, request.body);
  const user = await updateAdminUser(params.id, input);
  success(response, { user }, { message: "Cap nhat khach hang thanh cong." });
}

export async function deleteAdminUserController(request: Request, response: Response) {
  await requireAdmin(request);
  const params = parse(idParamSchema, request.params);
  const user = await deleteAdminUser(params.id);
  success(response, { user }, { message: "Xoa khach hang thanh cong." });
}
