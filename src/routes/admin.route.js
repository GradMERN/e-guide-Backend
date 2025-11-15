import express from 'express';
import { getAllUsers, getUserById, updateRole, deleteUserAccount} from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/authentication.middleware.js';
import { authorizeRoles } from '../middlewares/authorization.middleware.js';
import { validateBody, validateParams } from '../middlewares/validate.middleware.js';
import { updateRoleSchema, userIdParamSchema } from '../validators/admin.validator.js';
import { ROLES } from '../utils/roles.utils.js';

const router = express.Router();

router.use(authMiddleware , authorizeRoles(ROLES.ADMIN)); 

router.get('/', getAllUsers);
router.get('/:id', validateParams(userIdParamSchema), getUserById);
router.patch('/:id/role', validateParams(userIdParamSchema), validateBody(updateRoleSchema), updateRole );
router.delete('/:id', validateParams(userIdParamSchema), deleteUserAccount);

export default router;