import type { Request, Response } from "express";

import { success } from "@/http/response";

import { getLocations } from "./location.service";

export async function listLocationsController(_request: Request, response: Response) {
  const locations = await getLocations();
  success(response, { locations }, { message: "Lay danh sach dia diem thanh cong." });
}
