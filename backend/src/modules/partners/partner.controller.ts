import type { NextRequest } from "next/server";

import { handleApiError } from "@/lib/api-handler";
import { successResponse, validationErrorResponse } from "@/lib/response";

import { createPartnerApplication } from "./partner.service";
import { createPartnerApplicationSchema } from "./partner.validator";

export async function createPartnerApplicationController(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createPartnerApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const result = await createPartnerApplication(parsed.data);

    return successResponse(result, {
      status: 201,
      message: "Gui ho so dang ky doi tac thanh cong. Vui long cho admin duyet.",
    });
  } catch (error) {
    return handleApiError(error, "Khong the gui ho so dang ky doi tac.");
  }
}
