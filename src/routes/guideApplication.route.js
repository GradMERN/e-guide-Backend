import express from "express";
import {
  submitGuideApplication,
  uploadCertificate,
  deleteCertificate,
  downloadCertificate,
  getMyApplication,
  getAllApplications,
  getApplicationById,
  scheduleInterview,
  approveApplication,
  rejectApplication,
  getApplicationStats,
  updateGuideProfile,
} from "../controllers/guideApplication.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { upload } from "../middlewares/fileUpload.middleware.js";
import { ROLES } from "../utils/roles.utils.js";

const router = express.Router();


router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "certificates", maxCount: 10 },
    { name: "documents", maxCount: 10 },
  ]),
  submitGuideApplication
);

router.get("/me", authMiddleware, getMyApplication);

// Guide profile update (for approved guides)
router.patch("/profile", authMiddleware, updateGuideProfile);

router.post(
  "/certificates",
  authMiddleware,
  upload.single("certificate"),
  uploadCertificate
);

router.delete(
  "/certificates/:certificateId",
  authMiddleware,
  deleteCertificate
);

// Download certificate (accessible by owner or admin)
router.get(
  "/certificates/:certificateId/download",
  authMiddleware,
  downloadCertificate
);

// Admin routes
router.get(
  "/",
  authMiddleware,
  authorizeRoles(ROLES.ADMIN),
  getAllApplications
);

router.get(
  "/stats",
  authMiddleware,
  authorizeRoles(ROLES.ADMIN),
  getApplicationStats
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(ROLES.ADMIN),
  getApplicationById
);

router.patch(
  "/:id/schedule-interview",
  authMiddleware,
  authorizeRoles(ROLES.ADMIN),
  scheduleInterview
);

router.patch(
  "/:id/approve",
  authMiddleware,
  authorizeRoles(ROLES.ADMIN),
  approveApplication
);

router.patch(
  "/:id/reject",
  authMiddleware,
  authorizeRoles(ROLES.ADMIN),
  rejectApplication
);

export default router;
