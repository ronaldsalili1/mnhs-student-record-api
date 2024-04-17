import { z } from 'zod';

export const adminQuerySchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
});

export const adminParamSchema = z.object({
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

export const adminJsonSchema = z.object({
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
