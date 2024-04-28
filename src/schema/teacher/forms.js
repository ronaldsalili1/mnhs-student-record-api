import { z } from 'zod';

export const getFormByStudentIdSchema = z.object({
    form: z
        .string({
            required_error: 'Form is required',
            invalid_type_error: 'Form must be a string',
        }),
    studentId: z
        .string({
            required_error: 'Student ID is required',
            invalid_type_error: 'Student ID must be a string',
        })
        .length(
            24,
            { message: 'Student ID must be exactly 24 characters long' },
        ),
});

export const downloadTemplateSchema = z.object({
    studentId: z
        .string({
            required_error: 'Student ID is required',
            invalid_type_error: 'Student ID must be a string',
        })
        .length(
            24,
            { message: 'Student ID must be exactly 24 characters long' },
        ),
});
