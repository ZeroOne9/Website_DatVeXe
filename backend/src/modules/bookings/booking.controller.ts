import type { Request, Response } from "express";

import { optionalUser } from "@/http/auth";
import { parse, success } from "@/http/response";
import { getAuthenticatedUser } from "@/modules/auth/auth.service";

import {
  cancelBooking,
  confirmBooking,
  createBooking,
  getBookingByCode,
  getMyBookings,
} from "./booking.service";
import { bookingCodeSchema, createBookingSchema } from "./booking.validator";

export async function createBookingController(request: Request, response: Response) {
  const input = parse(createBookingSchema, request.body);
  const user = await optionalUser(request);
  const result = await createBooking(input, user);
  success(response, result, { status: 201, message: "Dat ve thanh cong." });
}

export async function getMyBookingsController(request: Request, response: Response) {
  const user = await getAuthenticatedUser(request);
  const result = await getMyBookings(user.id);
  success(response, result, { message: "Lay danh sach ve cua toi thanh cong." });
}

export async function getBookingByCodeController(request: Request, response: Response) {
  const params = parse(bookingCodeSchema, request.params);
  const result = await getBookingByCode(params.bookingCode);
  success(response, result, { message: "Lay thong tin dat ve thanh cong." });
}

export async function confirmBookingController(request: Request, response: Response) {
  const params = parse(bookingCodeSchema, request.params);
  const result = await confirmBooking(params.bookingCode);
  success(response, result, { message: "Xac nhan thanh toan thanh cong." });
}

export async function cancelBookingController(request: Request, response: Response) {
  const params = parse(bookingCodeSchema, request.params);
  const result = await cancelBooking(params.bookingCode);
  success(response, result, { message: "Huy ve thanh cong." });
}
