import { z } from 'zod';

export const updateProfileSchema = z.object({
    profile: z.object({
        last_name: z
            .string({
                required_error: 'Last Name is required',
                invalid_type_error: 'Last Name must be a string',
            }),
        first_name: z
            .string({
                required_error: 'First Name is required',
                invalid_type_error: 'First Name must be a string',
            }),
        middle_name: z
            .string({
                invalid_type_error: 'Middle Name must be a string',
            })
            .optional(),
        suffix: z
            .string({
                invalid_type_error: 'Suffix must be a string',
            })
            .optional(),
    }),
});

export const changePasswordSchema = z.object({
    profile: z.object({
        current_password: z.string({
            required_error: 'Current Password is required',
            invalid_type_error: 'Current Password must be a string',
        }),
        new_password: z.string({
            required_error: 'New Password is required',
            invalid_type_error: 'New Password must be a string',
        }),
        confirm_new_password: z.string({
            required_error: 'Confirm New Password is required',
            invalid_type_error: 'Confirm New Password must be a string',
        }),
    }),
});
