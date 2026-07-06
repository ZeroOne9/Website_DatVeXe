import type { NextRequest } from "next/server";

import { handleApiError } from "@/lib/api-handler";
import { successResponse, validationErrorResponse } from "@/lib/response";

import { requirePartner } from "./partner.auth";
import {
  createPartnerTrip,
  createPartnerVehicle,
  createPartnerVehicleSeat,
  getPartnerDashboard,
  listPartnerBookings,
  listPartnerRoutes,
  listPartnerTrips,
  listPartnerVehicles,
} from "./partner.service";
import {
  createPartnerSeatSchema,
  createPartnerTripSchema,
  createPartnerVehicleSchema,
  idParamSchema,
} from "./partner.validator";

type IdRouteContext = {
  params: {
    id: string;
  };
};

export async function getPartnerDashboardController(request: NextRequest) {
  try {
    const scope = await requirePartner(request);
    const dashboard = await getPartnerDashboard(scope);

    return successResponse({ dashboard }, { message: "Lay dashboard nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay dashboard nha xe.");
  }
}

export async function listPartnerVehiclesController(request: NextRequest) {
  try {
    const scope = await requirePartner(request);
    const vehicles = await listPartnerVehicles(scope);

    return successResponse({ vehicles }, { message: "Lay danh sach xe nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach xe nha xe.");
  }
}

export async function createPartnerVehicleController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createPartnerVehicleSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const scope = await requirePartner(request);
    const vehicle = await createPartnerVehicle(scope, parsed.data);

    return successResponse({ vehicle }, { status: 201, message: "Tao xe nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao xe nha xe.");
  }
}

export async function createPartnerVehicleSeatController(
  request: NextRequest,
  context: IdRouteContext,
) {
  const parsedParams = idParamSchema.safeParse(context.params);

  if (!parsedParams.success) {
    return validationErrorResponse(parsedParams.error);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createPartnerSeatSchema.safeParse(body);

  if (!parsedBody.success) {
    return validationErrorResponse(parsedBody.error);
  }

  try {
    const scope = await requirePartner(request);
    const seat = await createPartnerVehicleSeat(scope, parsedParams.data.id, parsedBody.data);

    return successResponse({ seat }, { status: 201, message: "Tao ghe nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao ghe nha xe.");
  }
}

export async function listPartnerTripsController(request: NextRequest) {
  try {
    const scope = await requirePartner(request);
    const trips = await listPartnerTrips(scope);

    return successResponse({ trips }, { message: "Lay danh sach chuyen nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach chuyen nha xe.");
  }
}

export async function listPartnerRoutesController(request: NextRequest) {
  try {
    await requirePartner(request);
    const routes = await listPartnerRoutes();

    return successResponse({ routes }, { message: "Lay danh sach tuyen active thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach tuyen active.");
  }
}

export async function createPartnerTripController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createPartnerTripSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const scope = await requirePartner(request);
    const trip = await createPartnerTrip(scope, parsed.data);

    return successResponse({ trip }, { status: 201, message: "Tao chuyen nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the tao chuyen nha xe.");
  }
}

export async function listPartnerBookingsController(request: NextRequest) {
  try {
    const scope = await requirePartner(request);
    const bookings = await listPartnerBookings(scope);

    return successResponse({ bookings }, { message: "Lay danh sach booking nha xe thanh cong." });
  } catch (error) {
    return handleApiError(error, "Khong the lay danh sach booking nha xe.");
  }
}
