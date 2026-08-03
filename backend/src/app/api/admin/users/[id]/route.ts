import {
  deleteAdminUserController,
  updateAdminUserController,
} from "@/modules/admin/admin.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = updateAdminUserController;
export const DELETE = deleteAdminUserController;
