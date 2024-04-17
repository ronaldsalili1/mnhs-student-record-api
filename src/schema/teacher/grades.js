import { z } from 'zod';

// eslint-disable-next-line import/prefer-default-export
export const downloadTemplateSchema = z.object({
    subject_id: z
        .string({
            required_error: 'Subject ID is required',
            invalid_type_error: 'Subject ID must be a string',
        })
        .length(
            24,
            { message: 'Subject ID must be exactly 24 characters long' },
        ),
    semester_id: z
        .string({
            required_error: 'Semester ID is required',
            invalid_type_error: 'Semester ID must be a string',
        })
        .length(
            24,
            { message: 'Semester ID must be exactly 24 characters long' },
        ),
});