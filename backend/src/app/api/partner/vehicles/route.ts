import {
  createPartnerVehicleController,
  listPartnerVehiclesController,
} from "@/modules/partner/partner.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = listPartnerVehiclesController;
export const POST = createPartnerVehicleController;
