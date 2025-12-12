import express from "express";
import {
  getFeaturedGuides,
  getGuideProfile,
} from "../controllers/public.controller.js";

const router = express.Router();

// Get featured guides for homepage (public)
router.get("/guides/featured", getFeaturedGuides);

// Get guide profile by ID (public)
router.get("/guides/:id", getGuideProfile);

export default router;
