import { z } from 'zod';
import validator from '../../helpers/validator.js';

export const getAdminsValidator = () => {
    const schema = z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
    });

    return validator('query', schema);
};

export const getAdminByIdValidator = () => {
    const schema = z.object({
        adminId: z
            .string({
                required_error: 'Admin ID is required',
                invalid_type_error: 'Admin ID must be a string',
            })
            .length(
                24,
                { message: 'Admin ID must be exactly 24 characters long' },
            ),
    });

    return validator('param', schema);
};
