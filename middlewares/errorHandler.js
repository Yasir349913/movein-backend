import { ApiResponse } from "../utils/ApiResponse.js";

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  console.error("🔥 Error:", message);

  // ✅ Mongoose validation error (e.g., required field missing)
  if (err.name === "ValidationError") {
    statusCode = 400;
    const fieldErrors = Object.values(err.errors).map((e) => e.message);
    message = fieldErrors.join(", ");
  }

  // ✅ Mongoose bad ObjectId (e.g., invalid _id)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  return res.status(statusCode).json(
    new ApiResponse(statusCode, null, message)
  );
};
