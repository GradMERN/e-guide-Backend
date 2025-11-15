import { z } from 'zod';
import { ROLES } from '../utils/roles.utils.js';

export const updateRoleSchema = z.object({
    role: z.enum([ROLES.USER, ROLES.GUIDE, ROLES.ADMIN], {
        errorMap: () => ({ message: 'Invalid role. Must be user, guide, or admin' })
    })
});

export const userIdParamSchema = z.object({
    id: z.string().length(24, 'Invalid user ID format').regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
});