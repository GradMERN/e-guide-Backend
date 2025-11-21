import express from 'express';
import {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  getToursByGuide,
  getToursByCity
} from '../controllers/tour.controller.js';
import { authMiddleware } from '../middlewares/authentication.middleware.js';
import { authorizeRoles } from '../middlewares/authorization.middleware.js';
import { validateBody, validateParams } from '../middlewares/validate.middleware.js';
import { createTourSchema, updateTourSchema, tourIdSchema } from '../validators/tour.validator.js';
import { ROLES } from '../utils/roles.utils.js';

const router = express.Router();

// Public routes
router.get('/', getAllTours);
router.get('/:id', validateParams(tourIdSchema), getTourById);
router.get('/guide/:guideId', getToursByGuide);
router.get('/city/:city', getToursByCity);

// Protected routes (Admin & Guide only)
router.use(authMiddleware, authorizeRoles(ROLES.ADMIN, ROLES.GUIDE));

router.post('/', validateBody(createTourSchema), createTour);
router.patch('/:id', validateParams(tourIdSchema), validateBody(updateTourSchema), updateTour);
router.delete('/:id', validateParams(tourIdSchema), deleteTour);

export default router;