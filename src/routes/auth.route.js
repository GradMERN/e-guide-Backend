import express from "express";
import {
  register,
  checkEmailExists,
  login,
  // verifyEmail,
  // resendVerificationEmail,
  forgetPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import {
  loginSchema,
  registerSchema,
  // resendVerificationSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import { validateBody } from "../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/check-email", checkEmailExists);
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

// router.post("/verify-email/:token", verifyEmail);
// router.post(
//   "/resend-verification",
//   validateBody(resendVerificationSchema),
//   resendVerificationEmail
// );

router.post(
  "/forgot-password",
  validateBody(forgetPasswordSchema),
  forgetPassword
);
router.post(
  "/reset-password/:token",
  validateBody(resetPasswordSchema),
  resetPassword
);

export default router;
