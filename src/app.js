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

app.set("trust proxy", 1);
app.set("etag", false);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== "production",
});

app.use(helmet());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://e-guide-guidora.vercel.app"
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(morgan("dev"));

app.use("/api/auth", apiLimiter);

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
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  res.json({
    success: true,
    message: `${greeting}, this is an E-Tour Guide API`,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found", path: req.path });
});

app.use(errorHandler);

export default app;