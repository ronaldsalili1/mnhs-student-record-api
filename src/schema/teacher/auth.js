import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
    }),
    password: z.string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string',
    }),
});

export const resetPasswordSchema = z.object({
    token: z.string({
        required_error: 'Token is required',
        invalid_type_error: 'Token must be a string',
    }),
    new_password: z.string({
        required_error: 'New Password is required',
        invalid_type_error: 'New Password must be a string',
    }),
    confirm_new_password: z.string({
        required_error: 'Confirm New Password is required',
        invalid_type_error: 'Confirm New Password must be a string',
    }),
});

export const passwordResetRequestSchema = z.object({
    email: z
        .string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be a string',
        }),
    resend: z
        .boolean({
            required_error: 'Resend is required',
            invalid_type_error: 'Resend must be a boolean',
        }),
    old_token: z
        .string({
            invalid_type_error: 'Email must be a string',
        })
        .optional(),
});
