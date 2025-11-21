import express from "express";
import { getUserTourDetails } from "../controllers/enrollment.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:tourId/details", getUserTourDetails);

export default router;
