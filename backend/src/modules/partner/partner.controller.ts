import type { Request, Response } from "express";

import { requirePartner } from "@/http/auth";
import { parse, success } from "@/http/response";

import {
  createPartnerTrip,
  createPartnerVehicle,
  createPartnerVehicleSeat,
  deletePartnerVehicle,
  getPartnerDashboard,
  listPartnerBookings,
  listPartnerRoutes,
  listPartnerTrips,
  listPartnerVehicles,
  updatePartnerVehicle,
} from "./partner.service";
import {
  createPartnerSeatSchema,
  createPartnerTripSchema,
  createPartnerVehicleSchema,
  idParamSchema,
  updatePartnerVehicleSchema,
} from "./partner.validator";

export async function getPartnerDashboardController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const result = await getPartnerDashboard(scope);
  success(response, result, { message: "Lay thong ke nha xe thanh cong." });
}

export async function listPartnerRoutesController(request: Request, response: Response) {
  await requirePartner(request);
  const routes = await listPartnerRoutes();
  success(response, { routes }, { message: "Lay danh sach tuyen xe thanh cong." });
}

export async function listPartnerVehiclesController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const vehicles = await listPartnerVehicles(scope);
  success(response, { vehicles }, { message: "Lay danh sach xe thanh cong." });
}

export async function createPartnerVehicleController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const input = parse(createPartnerVehicleSchema, request.body);
  const vehicle = await createPartnerVehicle(scope, input);
  success(response, { vehicle }, { status: 201, message: "Tao xe thanh cong." });
}

export async function updatePartnerVehicleController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(updatePartnerVehicleSchema, request.body);
  const vehicle = await updatePartnerVehicle(scope, params.id, input);
  success(response, { vehicle }, { message: "Cap nhat xe thanh cong." });
}

export async function deletePartnerVehicleController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const params = parse(idParamSchema, request.params);
  const vehicle = await deletePartnerVehicle(scope, params.id);
  success(response, { vehicle }, { message: "Xoa xe thanh cong." });
}

export async function createPartnerVehicleSeatController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const params = parse(idParamSchema, request.params);
  const input = parse(createPartnerSeatSchema, request.body);
  const seat = await createPartnerVehicleSeat(scope, params.id, input);
  success(response, { seat }, { status: 201, message: "Tao ghe thanh cong." });
}

export async function listPartnerTripsController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const trips = await listPartnerTrips(scope);
  success(response, { trips }, { message: "Lay danh sach chuyen xe thanh cong." });
}

export async function createPartnerTripController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const input = parse(createPartnerTripSchema, request.body);
  const trip = await createPartnerTrip(scope, input);
  success(response, { trip }, { status: 201, message: "Tao chuyen xe thanh cong." });
}

export async function listPartnerBookingsController(request: Request, response: Response) {
  const scope = await requirePartner(request);
  const bookings = await listPartnerBookings(scope);
  success(response, { bookings }, { message: "Lay danh sach dat ve thanh cong." });
}
