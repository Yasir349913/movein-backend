import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/index.js";
import { env } from "../config/env.js";

export const auth = async (req, res, next) => {
  // ✅ Try getting token from cookies first
  const tokenFromCookie = req.cookies?.accessToken;

  // ✅ Fallback to Bearer token from headers
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    throw new ApiError(401, "Unauthorized – no token provided");
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password");
  

    if (!user) throw new ApiError(401, "User not found");

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }
};
