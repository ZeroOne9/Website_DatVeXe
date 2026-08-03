import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import type { ZodError, ZodType } from "zod";

import { getCurrentUser, setAuthCookie, clearAuthCookie } from "@/lib/auth";
import { ApiError, isApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  changeAuthenticatedUserPassword,
  getAuthenticatedUser,
  loginUser,
  registerUser,
  updateAuthenticatedUser,
} from "@/modules/auth/auth.service";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateMeSchema,
} from "@/modules/auth/auth.validator";
import {
  cancelBooking,
  confirmBooking,
  createBooking,
  getBookingByCode,
  getMyBookings,
} from "@/modules/bookings/booking.service";
import {
  bookingCodeSchema,
  createBookingSchema,
} from "@/modules/bookings/booking.validator";
import { getLocations } from "@/modules/locations/location.service";
import {
  approveAdminPartnerApplication,
  createAdminBusCompany,
  createAdminLocation,
  createAdminRoute,
  createAdminTrip,
  createAdminVehicle,
  createAdminVehicleSeat,
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
  updateAdminRoute,
  updateAdminTrip,
  updateAdminUser,
  updateAdminVehicle,
} from "@/modules/admin/admin.service";
import {
  createBusCompanySchema,
  createLocationSchema,
  createRouteSchema,
  createSeatSchema,
  createTripSchema,
  createVehicleSchema,
  idParamSchema as adminIdParamSchema,
  listPartnerApplicationsQuerySchema,
  listUsersQuerySchema,
  updateRouteSchema,
  updateTripSchema,
  updateUserSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from "@/modules/admin/admin.validator";
import {
  createPartnerApplication,
} from "@/modules/partners/partner.service";
import { createPartnerApplicationSchema } from "@/modules/partners/partner.validator";
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
} from "@/modules/partner/partner.service";
import {
  createPartnerSeatSchema,
  createPartnerTripSchema,
  createPartnerVehicleSchema,
  idParamSchema as partnerIdParamSchema,
  updatePartnerVehicleSchema,
} from "@/modules/partner/partner.validator";
import { searchTrips, getTripSeats } from "@/modules/trips/trip.service";
import { tripIdSchema, tripSearchSchema } from "@/modules/trips/trip.validator";
import { getTicketByCode } from "@/modules/tickets/ticket.service";
import { ticketCodeSchema } from "@/modules/tickets/ticket.validator";

type SuccessOptions = {
  status?: number;
  message?: string;
};

type PartnerScope = {
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  memberships: Array<unknown>;
  busCompanyIds: number[];
  primaryBusCompany: unknown;
};

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

app.set("trust proxy", 1);
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

function success<T>(res: Response, data: T, options: SuccessOptions = {}) {
  return res.status(options.status ?? 200).json({
    success: true,
    message: options.message,
    data,
  });
}

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    success: false,
    message: "Du lieu khong hop le.",
    errors: error.flatten().fieldErrors,
  });
}

function parse<T>(schema: ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new ApiError("Du lieu khong hop le.", 422, parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

function asyncRoute(
  handler: (request: Request, response: Response) => Promise<unknown> | unknown,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response)).catch(next);
  };
}

async function optionalUser(request: Request) {
  return getCurrentUser(request);
}

async function requireAdmin(request: Request) {
  const user = await getCurrentUser(request);

  if (!user || user.role !== "admin") {
    throw new ApiError("Ban khong co quyen quan tri.", 403);
  }

  return user;
}

async function requirePartner(request: Request): Promise<PartnerScope> {
  const user = await getCurrentUser(request);

  if (!user || user.role !== "partner") {
    throw new ApiError("Ban khong co quyen truy cap khu vuc nha xe.", 403);
  }

  const memberships = await prisma.busCompanyUser.findMany({
    where: { userId: user.id },
    include: {
      busCompany: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    throw new ApiError("Tai khoan nha xe chua duoc gan voi don vi nao.", 403);
  }

  return {
    user,
    memberships,
    busCompanyIds: memberships.map((membership) => membership.busCompanyId),
    primaryBusCompany: memberships[0].busCompany,
  };
}

app.get("/api/health", (_request, response) => {
  success(response, { service: "backend", runtime: "node-express" }, { message: "Backend dang hoat dong." });
});

app.post("/api/auth/register", asyncRoute(async (request, response) => {
  const input = parse(registerSchema, request.body);
  const result = await registerUser(input);
  setAuthCookie(response, result.token);
  success(response, result, { status: 201, message: "Dang ky thanh cong." });
}));

app.post("/api/auth/login", asyncRoute(async (request, response) => {
  const input = parse(loginSchema, request.body);
  const result = await loginUser(input);
  setAuthCookie(response, result.token);
  success(response, result, { message: "Dang nhap thanh cong." });
}));

app.post("/api/auth/logout", (_request, response) => {
  clearAuthCookie(response);
  success(response, { loggedOut: true }, { message: "Dang xuat thanh cong." });
});

app.get("/api/auth/me", asyncRoute(async (request, response) => {
  const user = await getAuthenticatedUser(request);
  success(response, { user }, { message: "Lay thong tin tai khoan thanh cong." });
}));

app.patch("/api/auth/me", asyncRoute(async (request, response) => {
  const input = parse(updateMeSchema, request.body);
  const currentUser = await getAuthenticatedUser(request);
  const user = await updateAuthenticatedUser(currentUser.id, input);
  success(response, { user }, { message: "Cap nhat thong tin tai khoan thanh cong." });
}));

app.patch("/api/auth/password", asyncRoute(async (request, response) => {
  const input = parse(changePasswordSchema, request.body);
  const currentUser = await getAuthenticatedUser(request);
  const result = await changeAuthenticatedUserPassword(currentUser.id, input);
  success(response, result, { message: "Doi mat khau thanh cong." });
}));

app.get("/api/locations", asyncRoute(async (_request, response) => {
  const locations = await getLocations();
  success(response, { locations }, { message: "Lay danh sach dia diem thanh cong." });
}));

app.get("/api/trips", asyncRoute(async (request, response) => {
  const input = parse(tripSearchSchema, request.query);
  const trips = await searchTrips(input);
  success(response, { trips }, { message: "Tim chuyen xe thanh cong." });
}));

app.get("/api/trips/:id/seats", asyncRoute(async (request, response) => {
  const params = parse(tripIdSchema, request.params);
  const result = await getTripSeats(params.id);
  success(response, result, { message: "Lay so do ghe thanh cong." });
}));

app.post("/api/bookings", asyncRoute(async (request, response) => {
  const input = parse(createBookingSchema, request.body);
  const user = await optionalUser(request);
  const result = await createBooking(input, user);
  success(response, result, { status: 201, message: "Dat ve thanh cong." });
}));

app.get("/api/bookings/me", asyncRoute(async (request, response) => {
  const user = await getAuthenticatedUser(request);
  const result = await getMyBookings(user.id);
  success(response, result, { message: "Lay danh sach ve cua toi thanh cong." });
}));

app.get("/api/bookings/:bookingCode", asyncRoute(async (request, response) => {
  const params = parse(bookingCodeSchema, request.params);
  const result = await getBookingByCode(params.bookingCode);
  success(response, result, { message: "Lay thong tin dat ve thanh cong." });
}));

app.post("/api/bookings/:bookingCode/confirm", asyncRoute(async (request, response) => {
  const params = parse(bookingCodeSchema, request.params);
  const result = await confirmBooking(params.bookingCode);
  success(response, result, { message: "Xac nhan thanh toan thanh cong." });
}));

app.post("/api/bookings/:bookingCode/cancel", asyncRoute(async (request, response) => {
  const params = parse(bookingCodeSchema, request.params);
  const result = await cancelBooking(params.bookingCode);
  success(response, result, { message: "Huy ve thanh cong." });
}));

app.get("/api/tickets/:code", asyncRoute(async (request, response) => {
  const params = parse(ticketCodeSchema, request.params);
  const result = await getTicketByCode(params.code);
  success(response, result, { message: "Lay thong tin ve thanh cong." });
}));

app.post("/api/partners/apply", asyncRoute(async (request, response) => {
  const input = parse(createPartnerApplicationSchema, request.body);
  const result = await createPartnerApplication(input);
  success(response, result, { status: 201, message: "Gui ho so dang ky nha xe thanh cong." });
}));

app.get("/api/admin/dashboard", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const stats = await getDashboardStats();
  success(response, { stats }, { message: "Lay thong ke thanh cong." });
}));

app.get("/api/admin/locations", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const locations = await listAdminLocations();
  success(response, { locations }, { message: "Lay danh sach dia diem thanh cong." });
}));

app.post("/api/admin/locations", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const input = parse(createLocationSchema, request.body);
  const location = await createAdminLocation(input);
  success(response, { location }, { status: 201, message: "Tao dia diem thanh cong." });
}));

app.get("/api/admin/routes", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const routes = await listAdminRoutes();
  success(response, { routes }, { message: "Lay danh sach tuyen xe thanh cong." });
}));

app.post("/api/admin/routes", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const input = parse(createRouteSchema, request.body);
  const route = await createAdminRoute(input);
  success(response, { route }, { status: 201, message: "Tao tuyen xe thanh cong." });
}));

app.patch("/api/admin/routes/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const input = parse(updateRouteSchema, request.body);
  const route = await updateAdminRoute(params.id, input);
  success(response, { route }, { message: "Cap nhat tuyen xe thanh cong." });
}));

app.delete("/api/admin/routes/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const route = await deleteAdminRoute(params.id);
  success(response, { route }, { message: "Xoa tuyen xe thanh cong." });
}));

app.get("/api/admin/bus-companies", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const busCompanies = await listAdminBusCompanies();
  success(response, { busCompanies }, { message: "Lay danh sach nha xe thanh cong." });
}));

app.post("/api/admin/bus-companies", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const input = parse(createBusCompanySchema, request.body);
  const busCompany = await createAdminBusCompany(input);
  success(response, { busCompany }, { status: 201, message: "Tao nha xe thanh cong." });
}));

app.get("/api/admin/partner-applications", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const query = parse(listPartnerApplicationsQuerySchema, request.query);
  const applications = await listAdminPartnerApplications(query);
  success(response, { applications }, { message: "Lay danh sach ho so dang ky nha xe thanh cong." });
}));

app.patch("/api/admin/partner-applications/:id/approve", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const result = await approveAdminPartnerApplication(params.id);
  success(response, result, { message: "Duyet ho so dang ky nha xe thanh cong." });
}));

app.patch("/api/admin/partner-applications/:id/reject", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const application = await rejectAdminPartnerApplication(params.id);
  success(response, { application }, { message: "Tu choi ho so dang ky nha xe thanh cong." });
}));

app.get("/api/admin/vehicles", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const vehicles = await listAdminVehicles();
  success(response, { vehicles }, { message: "Lay danh sach xe thanh cong." });
}));

app.post("/api/admin/vehicles", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const input = parse(createVehicleSchema, request.body);
  const vehicle = await createAdminVehicle(input);
  success(response, { vehicle }, { status: 201, message: "Tao xe thanh cong." });
}));

app.patch("/api/admin/vehicles/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const input = parse(updateVehicleSchema, request.body);
  const vehicle = await updateAdminVehicle(params.id, input);
  success(response, { vehicle }, { message: "Cap nhat xe thanh cong." });
}));

app.delete("/api/admin/vehicles/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const vehicle = await deleteAdminVehicle(params.id);
  success(response, { vehicle }, { message: "Xoa xe thanh cong." });
}));

app.get("/api/admin/vehicles/:id/seats", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(vehicleIdParamSchema, request.params);
  const vehicle = await listAdminVehicleSeats(params.id);
  success(response, { vehicle }, { message: "Lay danh sach ghe thanh cong." });
}));

app.post("/api/admin/vehicles/:id/seats", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(vehicleIdParamSchema, request.params);
  const input = parse(createSeatSchema, request.body);
  const seat = await createAdminVehicleSeat(params.id, input);
  success(response, { seat }, { status: 201, message: "Tao ghe thanh cong." });
}));

app.get("/api/admin/trips", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const trips = await listAdminTrips();
  success(response, { trips }, { message: "Lay danh sach chuyen xe thanh cong." });
}));

app.post("/api/admin/trips", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const input = parse(createTripSchema, request.body);
  const trip = await createAdminTrip(input);
  success(response, { trip }, { status: 201, message: "Tao chuyen xe thanh cong." });
}));

app.patch("/api/admin/trips/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const input = parse(updateTripSchema, request.body);
  const trip = await updateAdminTrip(params.id, input);
  success(response, { trip }, { message: "Cap nhat chuyen xe thanh cong." });
}));

app.delete("/api/admin/trips/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const trip = await deleteAdminTrip(params.id);
  success(response, { trip }, { message: "Xoa chuyen xe thanh cong." });
}));

app.get("/api/admin/bookings", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const bookings = await listAdminBookings();
  success(response, { bookings }, { message: "Lay danh sach dat ve thanh cong." });
}));

app.post("/api/admin/bookings/:bookingCode/cancel", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(bookingCodeSchema, request.params);
  const result = await cancelBooking(params.bookingCode);
  success(response, result, { message: "Huy ve thanh cong." });
}));

app.get("/api/admin/users", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const query = parse(listUsersQuerySchema, request.query);
  const users = await listAdminUsers(query);
  success(response, { users }, { message: "Lay danh sach khach hang thanh cong." });
}));

app.patch("/api/admin/users/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const input = parse(updateUserSchema, request.body);
  const user = await updateAdminUser(params.id, input);
  success(response, { user }, { message: "Cap nhat khach hang thanh cong." });
}));

app.delete("/api/admin/users/:id", asyncRoute(async (request, response) => {
  await requireAdmin(request);
  const params = parse(adminIdParamSchema, request.params);
  const user = await deleteAdminUser(params.id);
  success(response, { user }, { message: "Xoa khach hang thanh cong." });
}));

app.get("/api/partner/dashboard", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const result = await getPartnerDashboard(scope);
  success(response, result, { message: "Lay thong ke nha xe thanh cong." });
}));

app.get("/api/partner/routes", asyncRoute(async (request, response) => {
  await requirePartner(request);
  const routes = await listPartnerRoutes();
  success(response, { routes }, { message: "Lay danh sach tuyen xe thanh cong." });
}));

app.get("/api/partner/vehicles", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const vehicles = await listPartnerVehicles(scope);
  success(response, { vehicles }, { message: "Lay danh sach xe thanh cong." });
}));

app.post("/api/partner/vehicles", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const input = parse(createPartnerVehicleSchema, request.body);
  const vehicle = await createPartnerVehicle(scope, input);
  success(response, { vehicle }, { status: 201, message: "Tao xe thanh cong." });
}));

app.patch("/api/partner/vehicles/:id", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const params = parse(partnerIdParamSchema, request.params);
  const input = parse(updatePartnerVehicleSchema, request.body);
  const vehicle = await updatePartnerVehicle(scope, params.id, input);
  success(response, { vehicle }, { message: "Cap nhat xe thanh cong." });
}));

app.delete("/api/partner/vehicles/:id", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const params = parse(partnerIdParamSchema, request.params);
  const vehicle = await deletePartnerVehicle(scope, params.id);
  success(response, { vehicle }, { message: "Xoa xe thanh cong." });
}));

app.post("/api/partner/vehicles/:id/seats", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const params = parse(partnerIdParamSchema, request.params);
  const input = parse(createPartnerSeatSchema, request.body);
  const seat = await createPartnerVehicleSeat(scope, params.id, input);
  success(response, { seat }, { status: 201, message: "Tao ghe thanh cong." });
}));

app.get("/api/partner/trips", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const trips = await listPartnerTrips(scope);
  success(response, { trips }, { message: "Lay danh sach chuyen xe thanh cong." });
}));

app.post("/api/partner/trips", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const input = parse(createPartnerTripSchema, request.body);
  const trip = await createPartnerTrip(scope, input);
  success(response, { trip }, { status: 201, message: "Tao chuyen xe thanh cong." });
}));

app.get("/api/partner/bookings", asyncRoute(async (request, response) => {
  const scope = await requirePartner(request);
  const bookings = await listPartnerBookings(scope);
  success(response, { bookings }, { message: "Lay danh sach dat ve thanh cong." });
}));

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: `Khong tim thay endpoint ${request.method} ${request.path}.`,
  });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (isApiError(error)) {
    response.status(error.status).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    success: false,
    message: "Loi may chu.",
  });
});

app.listen(port, () => {
  console.log(`Express backend is running at http://localhost:${port}`);
});
