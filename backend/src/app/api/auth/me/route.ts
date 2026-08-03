import { getMeController, updateMeController } from "@/modules/auth/auth.controller";

export const runtime = "nodejs";

export const GET = getMeController;
export const PATCH = updateMeController;
