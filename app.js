// app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";

import { notFoundMiddleware, errorHandler } from "./middlewares/index.js";
import routes from "./routes/index.js";
import { env } from "./config/index.js";
import { initApiDocs } from "./docs/init-oas.js";
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();

// --- Docs (mount first) ---
initApiDocs(app);
// Optional friendly path

// --- Security / platform middlewares ---
const allowedOrigins = [env.CLIENT_URL, "http://localhost:3000", "http://localhost:3001"].filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // No need to allow "Cookie" header; browsers don't send it via CORS request headers
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Swagger UI serves inline scripts; add 'unsafe-inline' to scriptSrc or use a nonce
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // <-- add this for the docs UI to render
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(xssClean());
app.use(mongoSanitize());

app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    secret: env.COOKIE_SECRET || "topsecret",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
);

// --- Stripe webhooks BEFORE body parsers ---
app.use("/webhook", webhookRoutes); // ensure router uses express.raw() on the specific Stripe route

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === "development") app.use(morgan("dev"));
if (env.NODE_ENV === "production") app.set("trust proxy", 1);

// Rate limiting (ensure numbers)
const limiter = rateLimit({
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  max: Number(env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// --- API routes ---
app.use("/api/v1", routes);

// 404 + error handler (must be last)
app.use(notFoundMiddleware);
app.use(errorHandler);

export default app;
