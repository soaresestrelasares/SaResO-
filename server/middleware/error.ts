import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { DatabaseUnavailableError } from "../db.js";

function firstValidationMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid request.";
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: firstValidationMessage(error),
    });
    return;
  }

  if (error instanceof DatabaseUnavailableError) {
    response.status(503).json({
      error: error.message,
    });
    return;
  }

  response.status(500).json({
    error: error instanceof Error ? error.message : "Unexpected API error.",
  });
};
