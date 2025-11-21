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
import { validateBody } from "../middlewares/validate.middleware.js";
import { placeSchema } from "../validators/place.validator.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles(ROLES.GUIDE, ROLES.USER));

router.post("/", validateBody(placeSchema), createPlace);
router.get("/", getPlaces);
router.get("/:id", getPlace);
router.put("/:id", validateBody(placeSchema), updatePlace);
router.delete("/:id", deletePlace);

export default router;
