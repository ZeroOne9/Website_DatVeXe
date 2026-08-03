import type { Request, Response } from "express";

import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import { parse, success } from "@/http/response";

import {
  changeAuthenticatedUserPassword,
  getAuthenticatedUser,
  loginUser,
  registerUser,
  updateAuthenticatedUser,
} from "./auth.service";
import { changePasswordSchema, loginSchema, registerSchema, updateMeSchema } from "./auth.validator";

export async function registerController(request: Request, response: Response) {
  const input = parse(registerSchema, request.body);
  const result = await registerUser(input);
  setAuthCookie(response, result.token);
  success(response, result, { status: 201, message: "Dang ky thanh cong." });
}

export async function loginController(request: Request, response: Response) {
  const input = parse(loginSchema, request.body);
  const result = await loginUser(input);
  setAuthCookie(response, result.token);
  success(response, result, { message: "Dang nhap thanh cong." });
}

export function logoutController(_request: Request, response: Response) {
  clearAuthCookie(response);
  success(response, { loggedOut: true }, { message: "Dang xuat thanh cong." });
}

export async function getMeController(request: Request, response: Response) {
  const user = await getAuthenticatedUser(request);
  success(response, { user }, { message: "Lay thong tin tai khoan thanh cong." });
}

export async function updateMeController(request: Request, response: Response) {
  const input = parse(updateMeSchema, request.body);
  const currentUser = await getAuthenticatedUser(request);
  const user = await updateAuthenticatedUser(currentUser.id, input);
  success(response, { user }, { message: "Cap nhat thong tin tai khoan thanh cong." });
}

export async function changePasswordController(request: Request, response: Response) {
  const input = parse(changePasswordSchema, request.body);
  const currentUser = await getAuthenticatedUser(request);
  const result = await changeAuthenticatedUserPassword(currentUser.id, input);
  success(response, result, { message: "Doi mat khau thanh cong." });
}
