import {
  deleteAdminTripController,
  updateAdminTripController,
} from "@/modules/admin/admin.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = updateAdminTripController;
export const DELETE = deleteAdminTripController;
