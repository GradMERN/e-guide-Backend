import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  setPassword,
  deactivateAccount,
  activateAccount,
  uploadAvatar,
  deleteAvatar,
  getUserStats,
} from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  setPasswordSchema,
} from "../validators/user.validator.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { upload } from "../middlewares/fileUpload.middleware.js";
import { ROLES } from "../utils/roles.utils.js";
import { getUserPayments } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/activate/:token", activateAccount);

router.use(authMiddleware);

router.get("/profile", getProfile);
router.get("/stats", getUserStats);
router.patch("/profile", validateBody(updateProfileSchema), updateProfile);
router.put(
  "/change-password",
  validateBody(changePasswordSchema),
  changePassword
);

// Set password for Google users
router.put("/set-password", validateBody(setPasswordSchema), setPassword);

// Avatar management
router.post("/avatar", upload.single("avatar"), uploadAvatar);
router.delete("/avatar", deleteAvatar);

// Deactivate account
router.put("/deactivate-account", deactivateAccount);

// User payments
router.get("/payments", getUserPayments);

export default router;
