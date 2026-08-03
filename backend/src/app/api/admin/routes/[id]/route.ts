import {
  deleteAdminRouteController,
  updateAdminRouteController,
} from "@/modules/admin/admin.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = updateAdminRouteController;
export const DELETE = deleteAdminRouteController;
