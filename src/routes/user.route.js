import express from "express";
import { getProfile , updateProfile , changePassword , deleteMyAccount } from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { updateProfileSchema, changePasswordSchema} from '../validators/user.validators.js';
import { authMiddleware } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { ROLES } from "../utils/roles.utils.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles(ROLES.GUIDE, ROLES.USER)); 

router.get("/profile", getProfile);
router.put("/profile", validateBody(updateProfileSchema) , updateProfile);
router.put("/change-password", validateBody(changePasswordSchema),changePassword);
router.delete("/delete-account",deleteMyAccount);

export default router;