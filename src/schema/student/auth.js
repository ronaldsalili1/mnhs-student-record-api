import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
    }),
    otp: z
        .string({
            required_error: 'OTP is required',
            invalid_type_error: 'OTP must be a string',
        })
        .length(
            6,
            { message: 'OTP must be exactly 6 characters long' },
        ),
});

export const requestOtpSchema = z.object({
    email: z.string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
    }),
    resend: z
        .boolean({
            required_error: 'Resend is required',
            invalid_type_error: 'Resend must be a boolean',
        })
        .default(false),
});
