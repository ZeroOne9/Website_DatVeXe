import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { ApiError, isApiError } from "@/lib/errors";

type SuccessOptions = {
  status?: number;
  message?: string;
};

export function success<T>(res: Response, data: T, options: SuccessOptions = {}) {
  return res.status(options.status ?? 200).json({
    success: true,
    message: options.message,
    data,
  });
}

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new ApiError("Du lieu khong hop le.", 422, parsed.error.flatten().fieldErrors);
  }

  return parsed.data;
}

export function asyncRoute(handler: (request: Request, response: Response) => Promise<unknown> | unknown) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response)).catch(next);
  };
}

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json({
    success: false,
    message: `Khong tim thay endpoint ${request.method} ${request.path}.`,
  });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (isApiError(error)) {
    response.status(error.status).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    success: false,
    message: "Loi may chu.",
  });
}
