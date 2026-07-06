import type { NextRequest } from "next/server";

import { handleApiError } from "@/lib/api-handler";
import { ApiError } from "@/lib/errors";
import { successResponse, validationErrorResponse } from "@/lib/response";
import { cancelBooking } from "@/modules/bookings/booking.service";

import { requireAdmin } from "./admin.auth";
import {
  approveAdminPartnerApplication,
  createAdminBusCompany,
  createAdminLocation,
  createAdminRoute,
  createAdminTrip,
  createAdminVehicle,
  createAdminVehicleSeat,
  listAdminBusCompanies,
  listAdminLocations,
  listAdminPartnerApplications,
  listAdminRoutes,
  listAdminTrips,
  listAdminVehicleSeats,
  listAdminVehicles,
  rejectAdminPartnerApplication,
  updateAdminRouteStatus,
  updateAdminTripStatus,
  updateAdminVehicleStatus,
  listAdminBookings,
  getDashboardStats,
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
  updateRouteStatusSchema,
  updateTripStatusSchema,
  updateVehicleStatusSchema,
  vehicleIdParamSchema,
} from "./admin.validator";

type IdRouteContext = {
  params: {
    id: string;
  };
};

export async function listAdminLocationsController(request: NextRequest) {
  try {
    await requireAdmin(request);
    const locations = await listAdminLocations();

    return successResponse({ locations }, { message: "Lay danh sach dia diem thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach dia diem.");
  }
}

export async function createAdminLocationController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createLocationSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    await requireAdmin(request);
    const location = await createAdminLocation(parsed.data);

    return successResponse({ location }, { status: 201, message: "Tao dia diem thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao dia diem.");
  }
}

export async function listAdminRoutesController(request: NextRequest) {
  try {
    await requireAdmin(request);
    const routes = await listAdminRoutes();

    return successResponse({ routes }, { message: "Lay danh sach tuyen xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach tuyen xe.");
  }
}

export async function createAdminRouteController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createRouteSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    await requireAdmin(request);
    const route = await createAdminRoute(parsed.data);

    return successResponse({ route }, { status: 201, message: "Tao tuyen xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao tuyen xe.");
  }
}

export async function updateAdminRouteStatusController(request: NextRequest, context: IdRouteContext) {
  const parsedParams = idParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = updateRouteStatusSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  try {
    await requireAdmin(request);
    const route = await updateAdminRouteStatus(parsedParams.data.id, parsedBody.data);

    return successResponse({ route }, { message: "Cap nhat tuyen xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the cap nhat tuyen xe.");
  }
}

export async function listAdminBusCompaniesController(request: NextRequest) {
  try {
    await requireAdmin(request);
    const busCompanies = await listAdminBusCompanies();

    return successResponse({ busCompanies }, { message: "Lay danh sach nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach nha xe.");
  }
}

export async function createAdminBusCompanyController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createBusCompanySchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    await requireAdmin(request);
    const busCompany = await createAdminBusCompany(parsed.data);

    return successResponse({ busCompany }, { status: 201, message: "Tao nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao nha xe.");
  }
}

export async function listAdminPartnerApplicationsController(request: NextRequest) {
  const parsedQuery = listPartnerApplicationsQuerySchema.safeParse({
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  if (!parsedQuery.success) {
    return validationErrorResponse(parsedQuery.error);
  }

  try {
    await requireAdmin(request);
    const applications = await listAdminPartnerApplications(parsedQuery.data);

    return successResponse(
      { applications },
      { message: "Lay danh sach ho so dang ky nha xe thanh cong." },
    );
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach ho so dang ky nha xe.");
  }
}

export async function approveAdminPartnerApplicationController(
  request: NextRequest,
  context: IdRouteContext,
) {
  const parsedParams = idParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  try {
    await requireAdmin(request);
    const result = await approveAdminPartnerApplication(parsedParams.data.id);

    return successResponse(result, { message: "Duyet ho so dang ky nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the duyet ho so dang ky nha xe.");
  }
}

export async function rejectAdminPartnerApplicationController(
  request: NextRequest,
  context: IdRouteContext,
) {
  const parsedParams = idParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  try {
    await requireAdmin(request);
    const application = await rejectAdminPartnerApplication(parsedParams.data.id);

    return successResponse({ application }, { message: "Tu choi ho so dang ky nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tu choi ho so dang ky nha xe.");
  }
}

export async function listAdminVehiclesController(request: NextRequest) {
  try {
    await requireAdmin(request);
    const vehicles = await listAdminVehicles();

    return successResponse({ vehicles }, { message: "Lay danh sach xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach xe.");
  }
}

export async function createAdminVehicleController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createVehicleSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    await requireAdmin(request);
    const vehicle = await createAdminVehicle(parsed.data);

    return successResponse({ vehicle }, { status: 201, message: "Tao xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao xe.");
  }
}

export async function updateAdminVehicleStatusController(request: NextRequest, context: IdRouteContext) {
  const parsedParams = idParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = updateVehicleStatusSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  try {
    await requireAdmin(request);
    const vehicle = await updateAdminVehicleStatus(parsedParams.data.id, parsedBody.data);

    return successResponse({ vehicle }, { message: "Cap nhat xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the cap nhat xe.");
  }
}

export async function listAdminVehicleSeatsController(request: NextRequest, context: IdRouteContext) {
  const parsedParams = vehicleIdParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  try {
    await requireAdmin(request);
    const vehicle = await listAdminVehicleSeats(parsedParams.data.id);

    return successResponse({ vehicle }, { message: "Lay danh sach ghe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach ghe.");
  }
}

export async function createAdminVehicleSeatController(request: NextRequest, context: IdRouteContext) {
  const parsedParams = vehicleIdParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createSeatSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  try {
    await requireAdmin(request);
    const seat = await createAdminVehicleSeat(parsedParams.data.id, parsedBody.data);

    return successResponse({ seat }, { status: 201, message: "Tao ghe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao ghe.");
  }
}

export async function listAdminTripsController(request: NextRequest) {
  try {
    await requireAdmin(request);
    const trips = await listAdminTrips();

    return successResponse({ trips }, { message: "Lay danh sach chuyen xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach chuyen xe.");
  }
}

export async function createAdminTripController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createTripSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    await requireAdmin(request);
    const trip = await createAdminTrip(parsed.data);

    return successResponse({ trip }, { status: 201, message: "Tao chuyen xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao chuyen xe.");
  }
}

export async function updateAdminTripStatusController(request: NextRequest, context: IdRouteContext) {
  const parsedParams = idParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = updateTripStatusSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  try {
    await requireAdmin(request);
    const trip = await updateAdminTripStatus(parsedParams.data.id, parsedBody.data);

    return successResponse({ trip }, { message: "Cap nhat chuyen xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the cap nhat chuyen xe.");
  }
}

export async function listAdminBookingsController(request: NextRequest) {
  try {
    await requireAdmin(request);
    const bookings = await listAdminBookings();

    return successResponse({ bookings }, { message: "Lay danh sach dat ve thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach dat ve.");
  }
}

type BookingRouteContext = {
  params: {
    bookingCode: string;
  };
};

export async function cancelAdminBookingController(request: NextRequest, context: BookingRouteContext) {
  try {
    await requireAdmin(request);
    const bookingCode = context.params?.bookingCode;
    if (!bookingCode) {
      throw new ApiError("Thieu ma dat ve.", 400);
    }
    const result = await cancelBooking(bookingCode);

    return successResponse(result, { message: "Huy ve thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the huy ve.");
  }
}

export async function getDashboardStatsController(request: NextRequest) {
  try {
    await requireAdmin(request);
    const stats = await getDashboardStats();

    return successResponse({ stats }, { message: "Lay thong ke thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay thong ke dashboard.");
  }
}
