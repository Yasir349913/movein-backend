import express from "express";
import cors from "cors";
import helmet from "helmet";
import xssClean from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import { notFoundMiddleware } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import routes from "./routes/index.js";
import { env } from "./config/index.js";

const app = express();

// CORS – allow specific origins with credentials
app.use(cors({
  origin: [env.CLIENT_URL, "http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));

// Helmet – secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Sanitize user input (XSS & NoSQL Injection)
app.use(xssClean());
app.use(mongoSanitize());

// Cookie Parser (for reading cookies if needed)
app.use(cookieParser());

// Cookie Session – used if storing JWT/token in cookies
app.use(
  cookieSession({
    name: "session",
    secret: env.COOKIE_SECRET || "topsecret",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
);

// Stripe Webhook Endpoint (must be before JSON parser)
app.use("/webhook/stripe", express.raw({ type: "application/json" }));

// Body Parser – parse JSON and URL-encoded data
app.use(express.json({ limit: "50mb" })); // For large image uploads
app.use(express.urlencoded({ extended: true }));

// Morgan Logger – dev only
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Trust reverse proxy (for secure cookies & IP)
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // e.g. Heroku / Railway / Vercel
}

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// API Routes
app.use("/api/v1", routes);

// 404 Not Found Handler
app.use(notFoundMiddleware);

// Central Error Handler
app.use(errorHandler);

export default app;
