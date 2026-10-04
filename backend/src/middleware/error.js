import { ZodError } from "zod";
import multer from "multer";
import { ApiError } from "../utils/http.js";
export function errorHandler(error, _req, res, _next) {
  let status = error.status || 500;
  let code = error.code || "INTERNAL_ERROR";
  let message =
    status < 500 || error instanceof ApiError
      ? error.message
      : "Something went wrong. Please try again.";
  if (error instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = error.issues.map((v) => v.message).join(" ");
  }
  if (error instanceof multer.MulterError) {
    status = 400;
    code = error.code;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? "This file exceeds the upload size limit."
        : "Please upload one supported document.";
  }
  if (error.code === "P2002") {
    status = 409;
    code = "CONFLICT";
    message = "This record already exists.";
  }
  if (error.code === "P2025") {
    status = 404;
    code = "NOT_FOUND";
    message = "This item is no longer available.";
  }
  if (status >= 500)
    console.error(
      JSON.stringify({
        event: "api_error",
        code: String(error.code || error.name),
        status,
      }),
    );
  res.status(status).json({ success: false, message, error: { code } });
}
