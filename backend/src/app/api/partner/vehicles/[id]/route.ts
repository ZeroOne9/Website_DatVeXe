import {
  deletePartnerVehicleController,
  updatePartnerVehicleController,
} from "@/modules/partner/partner.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = updatePartnerVehicleController;
export const DELETE = deletePartnerVehicleController;
