import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
  activateAccount,
} from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/user.validators.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { ROLES } from "../utils/roles.utils.js";
import { getUserPayments } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/activate/:token", activateAccount);

router.use(authMiddleware, authorizeRoles(ROLES.GUIDE, ROLES.USER));

router.get("/profile", getProfile);
router.patch("/profile", validateBody(updateProfileSchema), updateProfile);
router.put(
  "/change-password",
  validateBody(changePasswordSchema),
  changePassword
);
// Deactivate account

router.put("/deactivate-account", deactivateAccount);

// User payments
router.get("/payments", getUserPayments);

export default router;
