import type { Request, Response } from "express";

import { parse, success } from "@/http/response";

import { getTripSeats, searchTrips } from "./trip.service";
import { tripIdSchema, tripSearchSchema } from "./trip.validator";

export async function searchTripsController(request: Request, response: Response) {
  const input = parse(tripSearchSchema, request.query);
  const trips = await searchTrips(input);
  success(response, { trips }, { message: "Tim chuyen xe thanh cong." });
}

export async function getTripSeatsController(request: Request, response: Response) {
  const params = parse(tripIdSchema, request.params);
  const result = await getTripSeats(params.id);
  success(response, result, { message: "Lay so do ghe thanh cong." });
}
