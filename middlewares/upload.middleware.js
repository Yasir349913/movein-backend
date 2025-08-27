// middlewares/upload.js
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(), // Keep in memory temporarily
  limits: { fileSize: 20 * 1024 * 1024 }, // 5MB limit
});