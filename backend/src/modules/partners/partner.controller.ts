import type { Request, Response } from "express";

import { parse, success } from "@/http/response";

import { createPartnerApplication } from "./partner.service";
import { createPartnerApplicationSchema } from "./partner.validator";

export async function createPartnerApplicationController(request: Request, response: Response) {
  const input = parse(createPartnerApplicationSchema, request.body);
  const result = await createPartnerApplication(input);
  success(response, result, { status: 201, message: "Gui ho so dang ky nha xe thanh cong." });
}
