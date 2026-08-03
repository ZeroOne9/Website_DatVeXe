import {
  deleteAdminVehicleController,
  updateAdminVehicleController,
} from "@/modules/admin/admin.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = updateAdminVehicleController;
export const DELETE = deleteAdminVehicleController;
