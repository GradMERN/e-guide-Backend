import express from "express";
import {
  getFeaturedGuides,
  getGuideProfile,
} from "../controllers/public.controller.js";

const router = express.Router();

router.get("/guides/featured", getFeaturedGuides);

router.get("/guides/:id", getGuideProfile);

export default router;
