import type { Request, Response } from "express";

import { parse, success } from "@/http/response";

import { getTicketByCode } from "./ticket.service";
import { ticketCodeSchema } from "./ticket.validator";

export async function getTicketByCodeController(request: Request, response: Response) {
  const params = parse(ticketCodeSchema, request.params);
  const result = await getTicketByCode(params.code);
  success(response, result, { message: "Lay thong tin ve thanh cong." });
}
