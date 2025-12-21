import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import { requestTimingMiddleware } from "./middlewares/request-timing.middleware.js";

import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import tourRoutes from "./routes/tour.route.js";
import placeRoutes from "./routes/place.route.js";
import oauthRoutes from "./routes/oauth.route.js";
import enrollmentRoutes from "./routes/enrollment.route.js";
import paymentRoutes from "./routes/payment.route.js";
import notificationRoutes from "./routes/notification.route.js";
import tourItemsRoutes from "./routes/tourItem.route.js";
import reviewRoutes from "./routes/review.route.js";
import guideApplicationRoutes from "./routes/guideApplication.route.js";
import publicRoutes from "./routes/public.route.js";
import "./config/passport.config.js";

const app = express();

app.set("etag", false);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

const FRONTEND_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV === "production") {
          callback(new Error("Not allowed by CORS"));
        } else {
          callback(null, true);
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan("dev"));

app.use("/api/auth", apiLimiter);
app.use("/api/admin", apiLimiter);
app.use("/api/payments", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/items", tourItemsRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/guide-applications", guideApplicationRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", oauthRoutes);

app.get("/", (req, res) => {
  const hour = new Date().getHours();
  let greeting = "Hello";

  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  res.json({ success: true, message: `${greeting}, this is an E-Tour Guide`,
    environment: process.env.NODE_ENV || "development", timestamp: new Date().toISOString()});
  });

// Health check for Railway
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.use((req, res) => {res.status(404).json({ success: false, status: "fail", message: "Route not found", path: req.path });});

app.use(errorHandler);

export default app;