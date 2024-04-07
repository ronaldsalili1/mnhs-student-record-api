import { z } from 'zod';
import validator from '../../helpers/validator.js';

export const adminQueryValidator = () => {
    const schema = z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
    });

    return validator('query', schema);
};

export const adminParamValidator = () => {
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

export const adminJsonValidator = () => {
    const schema = z.object({
        admin: z.object({
            email: z.string({
                required_error: 'Email is required',
                invalid_type_error: 'Email must be a string',
            }),
            first_name: z.string({
                required_error: 'First name is required',
                invalid_type_error: 'First name must be a string',
            }),
            last_name: z.string({
                required_error: 'Last name is required',
                invalid_type_error: 'Last name must be a string',
            }),
            middle_name: z.string({
                invalid_type_error: 'Middle name must be a string',
            }).optional(),
            suffix: z.string({
                invalid_type_error: 'Middle name must be a string',
            }).optional(),
            roles: z
                .array(
                    z.string({
                        invalid_type_error: 'Role must be a string',
                    }),
                    {
                        required_error: 'Roles is required',
                        invalid_type_error: 'Roles must be an array',
                    },
                )
                .nonempty({ message: 'Roles must not be empty' }),
        }),
    });

    return validator('json', schema);
};
