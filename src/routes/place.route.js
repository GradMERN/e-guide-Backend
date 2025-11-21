import express from "express";
import {
  createPlace,
  getPlaces,
  getPlace,
  updatePlace,
  deletePlace,
} from "../controllers/place.controller.js";
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { ROLES } from "../utils/roles.utils.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles(ROLES.GUIDE, ROLES.USER));

router.post("/", createPlace);
router.get("/", getPlaces);
router.get("/:id", getPlace);
router.put("/:id", updatePlace);
router.delete("/:id", deletePlace);

export default router;
